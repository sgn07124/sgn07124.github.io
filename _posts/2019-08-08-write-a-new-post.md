---
title: JWT 로그인 + Redis (1)
author: 
date: 2024-03-15 14:10:00 +0800
categories: [Spring&Springboot, Spring Security]
tags: [spring, java]
render_with_liquid: false
---

로그인 기능은 거의 대부분의 애플리케이션에서 사용하고 있습니다.. 로그인 방식으로는 여러 방식들이 있지만 가장 많이 사용하는 방식을 한 번 사용해보고자 하여 JWT를 사용하여 프로젝트를 진행해보았습니다. 해당 블로그의 로그인 방식(JWT 생성 및 인증) 부분의 내용은 블로그 하단의 출처의 블로그를 공부하며 프로젝트에 적용하였습니다. (로그인 부분의 코드는 spring security + JWT + JPA + Redis로 구성되어 있고 JWT의 AccessToken으로 조회한 회원 이메일과 RefreshToken을 key:value로 redis에 저장하는 방법을 적용했습니다. 이 외의 전체적인 코드는 MySQL과 MongoDB를 사용하였습니다.)

### Security + JWT의 기본 동작 원리

![](https://velog.velcdn.com/images/sgn07124/post/16387411-6a55-4dca-877b-763132440180/image.png)
<figcaption style="text-align:center; font-size:15px; color:#808080; margin-top:10px">
    JWT 인증 과정
</figcaption>

1. 사용자는 URL: /auth/login으로 email과 password로 로그인 요청을 합니다.
2. 서버에서 Spring Security는 사용자를 인증하고 AccessToken과 RefreshToken을 발급해서 반환합니다. 토큰 발급 후 이메일:RefreshToken을 Redis에 보관됩니다.
3. 사용자는 일반 요청을 할 때마다 AccessToken을 함께 요청합니다.
4. 서버는 AccessToken을 검증하고 통과하면 응답을 보냅니다.
5. 만약 사용자가 일반 요청을 했을 때, AccessToken이 만료된 경우, 서버는 AccessToken 검증을 마친 후 재발행 요청을 합니다.
6. 사용자는 만료된 AccessToken과 유효한 RefreshToken을 함께 URL: /auth/reissue로 재발행 요청을 합니다.
7. 서버는 RefreshToken을 검증하고 AccessToken과 RefreshToken을 재발행하여 사용자에게 반환합니다. 이때, 서버는 만료된 AccessToken에서 조회한 이메일로 Redis의 키값인 이메일과 매칭하여 RefreshToken을 조회하고 조회한 RefreshToken과 사용자가 요청할 때 보낸 RefreshToken과 비교하여 일치하는 경우 새로운 AccessToken과 RefreshToken을 발급하여 사용자에게 반환하고 RefreshToken은 Redis에 다시 저장합니다.

### 코드 구조 및 상세 설명


```java
public ResponseEntity<?> login(UserLoginRequestDto login) {
        if (userRepository.findById(login.getMemberId()).orElse(null) == null) {
            return response.fail("해당하는 유저가 존재하지 않습니다.", HttpStatus.BAD_REQUEST);
        }

        // 1. Login Email/PW 를 기반으로 Authentication 객체 생성
        // 이때 authentication 는 인증 여부를 확인하는 authenticated 값이 false
        UsernamePasswordAuthenticationToken authenticationToken = login.toAuthentication();

        // 2. 실제 검증 (사용자 비밀번호 체크)이 이루어지는 부분
        // authenticate 매서드가 실행될 때 CustomUserDetailsService 에서 만든 loadUserByUsername 메서드가 실행
        Authentication authentication = authenticationManagerBuilder.getObject().authenticate(authenticationToken);

        // 3. 인증 정보를 기반으로 JWT 토큰 생성
        TokenDto tokenDto = jwtTokenProvider.generateToken(authentication);

        // 4. RefreshToken Redis 저장 (expirationTime 설정을 통해 자동 삭제 처리)
        redisTemplate.opsForValue()
                .set("RT:" + authentication.getName(), tokenDto.getRefreshToken(), tokenDto.getRefreshTokenExpirationTime(), TimeUnit.MILLISECONDS);

        return response.success(tokenDto, "로그인에 성공했습니다.", HttpStatus.OK);
    }
```
<figcaption style="text-align:center; font-size:15px; color:#808080; margin-top:10px">
    UserService
</figcaption>

클라이언트가 /auth/login 요청을 했을 때, Controller를 통해 들어오는 Service단의 login 메서드입니다.

1. Login 요청으로 들어온 Email, Password을 기반으로 Authentication 객체를 생성합니다. 
2. authenticate() 메서드를 통해 요청된 사용자에 대한 검증이 진행됩니다.
3. 2번에서 검증이 정상적으로 통과되었다면 인증된 authentication 객체를 기반으로 JWT 토큰을 생성합니다. 
4. Redis에 authentication에서 가져온 이메일, RefreshToken을 저장합니다. expirationTime을 RefreshToken의 만료 시간과 동일하게 설정하여 토큰 만료 시 자동으로 삭제되도록 처리합니다.

#### 첫 번째 과정 - Login Email/Password를 기반으로 Authentication 객체 생성

![](https://velog.velcdn.com/images/sgn07124/post/ac4d04d2-0816-40fc-8926-c45668a5cb6a/image.png)
<figcaption style="text-align:center; font-size:15px; color:#808080; margin-top:10px">
    UsernamePasswordAuthenticationToken
</figcaption>

첫 번째는 ID와 Password 기반으로 객체를 생성하는 과정입니다.
UsernamePasswordAuthenticationToken 클래스를 보면 두 개의 생성자가 있으며 principal과 credentials를 인자로 받는 생성자를 통한 객체가 생성됩니다.
이때, authenticated 값은 false(기본값)로 해당 Authentication은 아직 인증되지 않았으며, 인증을 위해 만들어진 객체가 됩니다. 이후의 과정에서 이렇게 만들어진 Authentication 객체를 사용하여 실제 인증이 진행됩니다.

#### 두 번째 과정 - 실제 검증이 이루어지는 과정

![](https://velog.velcdn.com/images/sgn07124/post/914af3d0-7cdf-4073-89be-468a60771696/image.png)
<figcaption style="text-align:center; font-size:15px; color:#808080; margin-top:10px">
    authenticated()
</figcaption>

두 번째는 실제 검증이 이루어지는 부분으로 사용자의 비밀번호를 확인 후 통과 하면 authenticated 값이 true로 변경됩니다.

![](https://velog.velcdn.com/images/sgn07124/post/8d9a3118-c790-4470-9f32-005f0c39b10f/image.png)
<figcaption style="text-align:center; font-size:15px; color:#808080; margin-top:10px">
    ProviderManager
</figcaption>

ProviderManager 클래스의 authenticate() 메서드입니다.
해당 메서드의 동작 과정을 보면 모든 Providers들을 for문으로 반복하며 provider가 해당 인증을 할 수 있는지 여부를 supports 메서드로 확인합니다. 그리고 인증을 할 수 있는 provider를 발견하면 해당 provider의 authenticate() 메서드를 통해 인증을 진행합니다.

![](https://velog.velcdn.com/images/sgn07124/post/fc34ed98-df8b-4740-aa53-f1cc39b84ef0/image.png)
<figcaption style="text-align:center; font-size:15px; color:#808080; margin-top:10px">
    AbstractUserDetailsAuthenticationProvider.class
</figcaption>

위 과정인 ProviderManager 클래스의 authenticate() 메서드에서 해당 인증을 처리할 수 있도록 provider를 통해 인증을 진행한다고 했습니다. 위 과정에서 해당 인증을 처리할 수 있는 provider로 결정된 클래스가 AbstractUserDetailsAuthenticationProvider.class입니다.
결국 해당 클래스의 authenticate() 메서드를 통해 인증이 진행됩니다.
위 코드의 retrieveUser() 메서드는 DaoAuthenticationProvider.class에 구현되어 있습니다.

![](https://velog.velcdn.com/images/sgn07124/post/df27f2d3-2d1f-4ac7-a4d0-ab217da58a93/image.png)
<figcaption style="text-align:center; font-size:15px; color:#808080; margin-top:10px">
    DaoAuthenticationProvider.class
</figcaption>

여기서 loadUserByUsername() 메서드는 직접 구현이 필요합니다.

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    private final MemberRepository memberRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return memberRepository.findByEmail(email)
                .map(this::createUserDetails)
                .orElseThrow(() -> new UsernameNotFoundException("해당하는 유저를 찾을 수 없습니다."));
    }

    // 해당하는 User 의 데이터가 존재한다면 UserDetails 객체로 만들어서 리턴
    private UserDetails createUserDetails(User member) {
        return User.builder()
                .email(member.getUsername())
                .password(member.getPassword())
                .role(member.getRole())
                .build();
    }
}
```
<figcaption style="text-align:center; font-size:15px; color:#808080; margin-top:10px">
    CustomUserDetailsService
</figcaption>

UserDetailsService interface를 구현한 CustomUserDetailsService.class를 통해 loadUserByUsername 메서드를 실제로 구현을 해줘야 인증 과정에서 해당 메서드가 동작하면서 DB와 연동하여 해당 username(email)의 존재 여부가 검증됩니다.

이제 AbstractUserDetailsAuthenticationProvider.class의 retrieveUser() 메서드가 정상적으로 실행되어 DB에 해당 유저가 있는게 확인이 완료되면 코드 아래 부분의 파란색 부분인 additionalAuthenticationChecks() 메서드에서 해당 유저의 비밀번호 일치 여부를 확인합니다.

![](https://velog.velcdn.com/images/sgn07124/post/01a82a8c-6e3d-491c-a4f1-1bdee2d11322/image.png)
<figcaption style="text-align:center; font-size:15px; color:#808080; margin-top:10px">
    additionalAuthenticationChecks
</figcaption>

additionalAuthenticationChecks() 메서드도 DaoAuthenticationProvider.class에 구현되어 있습니다.
동작 과정을 보면 passwordEncoder.matches(presentedPassword, userDetails.getPassword())를 통해 1번 과정에서 입력한 password와 해당 UserDetails 객체의 비밀번호가 일치하는지 여부를 확인하는 것을 볼 수 있습니다.

![](https://velog.velcdn.com/images/sgn07124/post/cf660602-8ea3-480f-8db4-b086530c2b7c/image.png)
<figcaption style="text-align:center; font-size:15px; color:#808080; margin-top:10px">
    AbstractUserDetailsAuthenticationProvider class의 authenticate()
</figcaption>

이렇게 비밀번호 일치 여부까지 확인했다면 AbstractUserDetailsAuthenticationProvider.class의 authenticate() 메서드는 최종적으로 createSuccessAuthentication() 메서드를 반환합니다. 

![](https://velog.velcdn.com/images/sgn07124/post/4451924d-ada2-4fff-9546-33602d581f88/image.png)
<figcaption style="text-align:center; font-size:15px; color:#808080; margin-top:10px">
    UsernamePasswordAuthenticationToken 생성자
</figcaption>

createSuccessAuthentication() 메서드를 통해 만들어지는 객체가 첫 번째 과정의 UsernamePasswordAuthenticationToken.class 아래에 있는 생성자이며, 이때, authenticate 값이 true가 되며(첫 번째 과정에서는 false였음) 해당 객체는 인증이 완료된 객체가 됩니다. 

![](https://velog.velcdn.com/images/sgn07124/post/e3ca05ff-e2b9-402a-b9f5-29184b5bd9dd/image.png)
<figcaption style="text-align:center; font-size:15px; color:#808080; margin-top:10px">
    검증 전과 후 Authenticated 값 비교
</figcaption>
로그를 보면 실제 검증 이전(1번 과정) 부분은 Authenticated=false로 되어있지만 하단의 실제 검증 이후(2번 과정 수행) 부분은 Authenticated=true로 변경된 것을 확인할 수 있습니다.

#### 세 번째 과정 - 인증 정보를 기반으로 JWT 토큰이 생성되는 과정

세 번째는 위에서 생성된 authentication 객체를 기반으로 JWT 토큰을 생성합니다.

```java
@Slf4j
@Component
public class JwtTokenProvider {

    private static final String AUTHORITIES_KEY = "auth";
    private static final String BEARER_TYPE = "Bearer";
    private static final long ACCESS_TOKEN_EXPIRE_TIME = 30 * 60 * 4 * 1000L;  // 2시간 : 30 * 60 * 4 * 1000L
    private static final long REFRESH_TOKEN_EXPIRE_TIME = 7 * 24 * 60 * 60 * 1000L;  // 7일
    private final Key key;

    public JwtTokenProvider(@Value("${jwt.secret}") String secretKey) {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

    // 유저 정보를 가지고 AccessToken, RefreshToken 을 생성하는 메서드
    public TokenDto generateToken(Authentication authentication) {
        // 권한 가져오기
        String authorities = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        long now = (new Date()).getTime();
        // Access Token 생성
        Date accessTokenExpiresIn = new Date(now + ACCESS_TOKEN_EXPIRE_TIME);
        String accessToken = Jwts.builder()
                .setSubject(authentication.getName())
                .claim(AUTHORITIES_KEY, authorities)
                .setExpiration(accessTokenExpiresIn)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();

        // Refresh Token 생성
        String refreshToken = Jwts.builder()
                .setExpiration(new Date(now + REFRESH_TOKEN_EXPIRE_TIME))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();

        return TokenDto.builder()
                .grantType(BEARER_TYPE)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .refreshTokenExpirationTime(REFRESH_TOKEN_EXPIRE_TIME)
                .build();
    }
```
<figcaption style="text-align:center; font-size:15px; color:#808080; margin-top:10px">
    JwtTokenProvider
</figcaption>

UserService의 2번 부분에서 Authentication 객체 검증 후, 인증된 객체로 3번 과정의 JwtTokenProvider class의 generateToken() 메서드를 통해 AccessToken과 RefreshToken을 생성합니다.

일반적으로 AccessToken의 유효시간은 30분 ~ 1시간으로 짧게 설정하고, RefreshToken의 유효시간은 7일 ~ 30일로 길게 설정합니다.

```java
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig{

    private final JwtTokenProvider jwtTokenProvider;
    private final RedisTemplate<String, Object> redisTemplate; // RedisTemplate 주입

    //AuthenticationManager Bean 등록
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {

        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        // csrf disable
        http
                .csrf((auth) -> auth.disable());

        //From 로그인 방식 disable
        http
                .formLogin((auth) -> auth.disable());

        //http basic 인증 방식 disable
        http
                .httpBasic((auth) -> auth.disable());

        //경로별 인가 작업 - hasRole()에 원래 ROLE_A라면 ROLE_는 생략하고 A만 적어줘야 오류가 안뜸..
        http
                .authorizeHttpRequests((auth) -> auth
                        .requestMatchers("/auth/login", "/auth/login-test", "/auth/reissue", "/", "/auth/join-A", "/auth/join-B", "/auth/join-C", "/swagger-ui/**","/v3/api-docs/**", "/swagger-resources/**").permitAll()
                        .requestMatchers("/admin", "/auth/login-test", "/user/role", "/auth/logout").hasAnyRole("A", "B", "C")
                        .requestMatchers("/A/info").hasRole("A")
                        .requestMatchers("/B/info").hasRole("B")
                        .requestMatchers("/C/info").hasRole("C")
                        .anyRequest().authenticated());

        http
                .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider, redisTemplate),
                        UsernamePasswordAuthenticationFilter.class);

        http
                .sessionManagement((session) -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        return http.build();
    }

    @Bean
    public BCryptPasswordEncoder bCryptPasswordEncoder() {

        return new BCryptPasswordEncoder();
    }
}
```
<figcaption style="text-align:center; font-size:15px; color:#808080; margin-top:10px">
    SecurityConfig
</figcaption>

http.addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider, redisTemplate), UsernamePasswordAuthenticationFilter.class);를 추가하여 JWT 인증을 위해 직접 구현한 JwtAuthenticationFilter를 UsernamePasswordAuthenticationFilter.class 전에 실행하겠다는 설정입니다.

```java
/**
 * JwtAuthenticationFilter는 클라이언트 요청 시 JWT 인증을 하기위해 설치하는 커스텀 필터로, UsernamePasswordAuthenticationFilter 이전에 실행됨
 * 이 말은 JwtAuthenticationFilter를 통과하면 UsernamePasswordAuthenticationFilter 이후의 필터는 통과한 것으로 본다는 의미이다.
 * @author rimsong
 */
@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends GenericFilterBean {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_TYPE = "Bearer";

    private final JwtTokenProvider jwtTokenProvider;
    private final RedisTemplate redisTemplate;


    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {

        // 1. Request Header 에서 JWT 토큰 추출
        String token = resolveToken((HttpServletRequest) request);

        // 2. validateToken 으로 토큰 유효성 검사
        if (token != null && jwtTokenProvider.validateToken(token)) {
            // Redis에 해당 accessToken logout 여부 확인
            String isLogout = (String)redisTemplate.opsForValue().get(token);
            if (ObjectUtils.isEmpty(isLogout)) {
                Authentication authentication = jwtTokenProvider.getAuthentication(token);
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }
        chain.doFilter(request, response);
    }

    // Request Header 에서 토큰 정보 추출
    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_TYPE)) {
            return bearerToken.substring(7);
        }
        return null;
    }

}
```
<figcaption style="text-align:center; font-size:15px; color:#808080; margin-top:10px">
    JwtAuthenticationFilter
</figcaption>

JwtAuthenticationFilter는 JWT 토큰을 Header에 담아 API 요청이 왔을 때, 해당 토큰을 검사하고, 토큰에서 인증 정보를 가져오기 위해 생성하는 필터입니다. 과정을 보면 resoleveToken() 메서드를 통해 HttpServletRequest 객체에서 Header의 이름이 Authorization인 Header를 가져옵니다. 그리고 해당 토큰이 "Bearer"로 시작되는지 확인 후 "Bearer" + ' '(공백 1자리)를 잘라냅니다. 그런 다음 jwtTokenProvider의 validateToken() 메서드를 사용하여 토큰의 유효성 검사를 진행합니다.

```java
// 토큰 정보를 검증하는 메서드
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (io.jsonwebtoken.security.SecurityException | MalformedJwtException e) {
            log.info("Invalid JWT Token", e);
        } catch (ExpiredJwtException e) {
            log.info("Expired JWT Token", e);
        } catch (UnsupportedJwtException e) {
            log.info("Unsupported JWT Token", e);
        } catch (IllegalArgumentException e) {
            log.info("JWT claims string is empty.", e);
        }
        return false;
    }
```
<figcaption style="text-align:center; font-size:15px; color:#808080; margin-top:10px">
    JwtTokenProvider의 validateToken()
</figcaption>

해당 메서드를 통해 토큰을 복호화하며 각 과정을 통해 토큰 서명이 유효하지 않은 경우, 토큰의 형식이 잘못된 경우, 토큰이 만료된 경우, 토큰이 지원하지 않는 형식인 경우, JWT의 claims 문자열이 비어있는 경우 예외를 발생시켜 유효성을 체크하고 토큰 유효성 검사에 이상이 없다면 true를 반환하고 JwtTokenProvider의 getAuthentication() 메서드를 실행합니다.

```java
// JWT 토큰을 복호화하여 토큰에 들어있는 정보를 꺼내는 메서드
    public Authentication getAuthentication(String accessToken) {
        // 토큰 복호화
        Claims claims = parseClaims(accessToken);

        if (claims.get(AUTHORITIES_KEY) == null) {
            throw new RuntimeException("권한 정보가 없는 토큰입니다.");
        }

        // 클레임에서 권한 정보 가져오기
        Collection<? extends GrantedAuthority> authorities =
                Arrays.stream(claims.get(AUTHORITIES_KEY).toString().split(","))
                        .map(SimpleGrantedAuthority::new)
                        .collect(Collectors.toList());

        // UserDetails 객체를 만들어서 Authentication 리턴
        UserDetails principal = new User(claims.getSubject(), "", authorities);  // User : import org.springframework.security.core.userdetails.User;
        return new UsernamePasswordAuthenticationToken(principal, "", authorities);
    }

    private Claims parseClaims(String accessToken) {
        try {
            return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(accessToken).getBody();
        } catch (ExpiredJwtException e) {
            return e.getClaims();
        }
    }
}
```
<figcaption style="text-align:center; font-size:15px; color:#808080; margin-top:10px">
    JwtTokenProvider의 getAuthentication()와 parseClaims()
</figcaption>

getAuthentication() 메서드에서는 parseClaims() 메서드로 토큰을 복호화하여 권한 확인 후 권한 정보를 가져와서 해당 정보로 UserDetails 객체를 만들어서 리턴합니다.

<br>

다시 JwtAuthenticationFilter의 jwtTokenProvider.getAuthentication(); 메서드를 통해 생성된 authentication 객체는 SecurityContextHolder의 SecurityContext 안에 저장됩니다. 이후 나머지 filterchain이 도착하고 api 요청에 대한 응답을 합니다.


#### 네 번째 과정 - 사용자 email과 RefreshToken을 Redis에 저장하는 과정

```java
@Configuration
@RequiredArgsConstructor
@EnableRedisRepositories
public class RedisRepositoryConfig {

    /**
     * 맥에서 Redis homebrew로 설치한 경우 서버 실행 방법
     * 1. 서버 실행 : brew services start redis
     * 2. cli 접근 : redis-cli
     * 2-1. 현재 key 전체 조회 : keys *
     * 2-2. key에 대한 value 조회(예시) : get RT:Test1@test.com -> value(RT)값 조회
     * Redis 서버 종료
     * 1. 서버 종료 : brew services stop redis
     */

    private final RedisProperties redisProperties;

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        return new LettuceConnectionFactory(redisProperties.getHost(), redisProperties.getPort());  // properties에 저장한 host, port를 가지고 와서 연결
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate() {
        RedisTemplate<String, Object> redisTemplate = new RedisTemplate<>();
        redisTemplate.setConnectionFactory(redisConnectionFactory());
        redisTemplate.setKeySerializer(new StringRedisSerializer());
        redisTemplate.setValueSerializer(new StringRedisSerializer());
        return redisTemplate;
    }
}
```
<figcaption style="text-align:center; font-size:15px; color:#808080; margin-top:10px">
    RedisRepositoryConfig
</figcaption>

RedisConnectionFactory를 통해 LettuceConnectionFactory를 생성하여 반환합니다. setKeySerializer, setValueSerializer 설정을 통해 redis-cli로 데이터를 직접 확인할 수 있습니다.

![](https://velog.velcdn.com/images/sgn07124/post/d756ecb4-dc22-409c-91e9-74009385ab81/image.png)
<figcaption style="text-align:center; font-size:15px; color:#808080; margin-top:10px">
    redisTemplate.opsForValue().set()
</figcaption>

네 번째는 Redis에 사용자 정보와, RefreshToken, expirationTime을 저장하는 용도로 사용하며 이후에 토큰 갱신을 위해 사용하였습니다. 
Redis는 Key와 Value로 저장이 되며 Key값은 authentication에서 email을 가져와서 저장하고, Value값은 tokenDto에서 RefreshToken을 가져와서 저장합니다. 나머지 인자들로 timeout과 unit을 받습니다. expirationTime(timeout)은 RefreshToken의 만료 시간으로 JwtTokenProvider에서 RefreshToken 생성 시 설정했던 값을 가져와서 저장합니다.

<br>

#### 로그인 결과

![](https://velog.velcdn.com/images/sgn07124/post/0e6625fb-ce5f-48f4-b95c-b47fadb41d71/image.png)
<figcaption style="text-align:center; font-size:15px; color:#808080; margin-top:0px">
    Postman으로 확인
</figcaption>

![](https://velog.velcdn.com/images/sgn07124/post/c4fdd9e3-5658-4740-8114-1b99f2c73892/image.png)
<figcaption style="text-align:center; font-size:15px; color:#808080; margin-top:0px">
    Redis에 저장된 값 확인
</figcaption>


<br>
<br>


### 고민거리
중복 로그인 시 어떻게 처리해야되는지 고민해봐야 될 것 같다. 
하나의 계정으로 Computer A에서 로그인을 하면 Cookie에 AT와 RT가 저장되고 Redis에는 로그인한 이메일에 대한 RT가 저장된다.
Computer A가 로그인 되어있는 상태에서 Computer B가 로그인을 하면 새로 발급된 RT가 Redis에 저장된다.

이때, Computer A는 AT의 유효시간이 끝나기 전 까지는 api 요청이 가능하지만 유효시간이 끝난 후에 AT 갱신이 불가능하다.(Redis에 저장된 RT가 Computer A가 가지고 있는 RT와 달라졌기 때문).

여기서 고민은 A가 로그인 되어있는 상태에서 B가 로그인하면 유효시간이 만료되지 않더라도 A의 접근을 막을 수 있는가?
: GPT 응답으로 보면 Redis의 key값을 이메일이 아닌 AccessToken을 저장하도록 해야하며, 모든 api 요청을 할 때마다 Redis에 해당 key값과 A가 가지고 있는 AccessToken을 비교하여 일치하는 경우에만 접근을 허용하도록 하면 가능하다. 하지만 서버 부하의 성능 문제와 동시성 문제 등이 발생한다고 한다.

그러면 A가 로그인 되어있는 상태에서 B가 로그인하면 이미 로그인되어있는 것이니까 B의 중복 로그인을 막을 수 있는가?
: 로그인을 시도할 때, 이미 다른 사용자가 로그인되어 있는지를 확인해야 한다. 이를 위해서는 사용자가 로그인한 상태를 어떻게 추적하고 있는지에 따라 구현 방법이 달라질 수 있으며 일반적으로는 세션, 쿠키 또는 데이터베이스를 사용하여 사용자의 로그인 상태를 추적한다.

뭔가 첫 번째 방법으로 시도하면 될거 같긴 한데 성능 문제가 발생할 것 같아 좀 더 찾아봐야될 것 같다.

<br>


[출처]

전반적으로 참고 및 공부한 블로그
: https://wildeveloperetrain.tistory.com/57 <br>
https://wildeveloperetrain.tistory.com/58 <br>
https://wildeveloperetrain.tistory.com/59 <br>

이미지
: https://onejunu.tistory.com/137 <br>

spring security 버전 변경 
: https://frogand.tistory.com/208 <br>

