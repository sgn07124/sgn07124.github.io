---
# 글 제목
title: 5. 컴포넌트 스캔
# 간단한 설명
description: 인프런 김영한님의 "스프링 기본편" 강의를 바탕으로 작성했습니다.
# 작성자
author: 
# 작성일자
date: 2023-08-14 13:00:00 +0800
# 카테고리 대주제 > 소주제
categories: [강의정리, 스프링 핵심 원리 - 기본편]
# 태그
tags: [spring, spring-basic]
# 메인화면에 고정
pin: false
# 웹페이지의 성능적인 이유에서 mathematical 기능은 기본적으로 꺼져있음.
math: true
# 표 생성 도구로 true로 설정 시, ```mermaid 를 사용할 수 있다.
mermaid: false

---

# 컴포넌트 스캔과 의존관계 자동 주입 시작하기
지금까지는 스프링 빈을 등록할 때 자바 코드의 `@Bean`이나 bean 태그 등을 통해서 설정 정보에 직접 등록할 스프링 빈을 나열했지만 이 방법은 등록해야 할 빈의 개수가 수백 개가 되면 일일이 등록해야되서 누락 등의 문제가 발생한다.

스프링은 설정 정보가 없어도 자동으로 스프링 빈을 등록하는 컴포넌트 스캔이라는 기능을 제공하고, 의존 관계도 자동으로 주입하는 `@Autowired`라는 기능도 제공한다.

### 컴포넌트 스캔과 자동 주입
#### AutoAppConfig.java
```java
@Configuration
@ComponentScan(
        excludeFilters = @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = Configuration.class) // AppConfig의 설정 정보를 제외하기 위해서
)
public class AutoAppConfig { 

}
```
- 설정 정보이므로 `@Configuration` 어노테이션을 달았다.
- 컴포넌트 스캔을 사용하려면 `@ComponentScan` 어노테이션을 설정 정보에 붙여주면 된다.
  - excludeFilters를 사용해서 `@Configuration` 어노테이션에 있는 설정 정보 부분을 제외하고 CompnentScan을 한다. (여기서는 AppConfig의 설정 정보를 제외한다.)
- 기존 AppConfig와는 다르게 `@Bean`으로 등록한 클래스가 하나도 없다.

### 컴포넌트 스캔
컴포넌트 스캔은 `@Component` 애노테이션이 붙은 클래스를 스캔해서 스프링 빈으로 등록한다. `@Configuration`도 컴포넌트 스캔의 대상에 포함이 되는데 이유는 `@Configuration` 소스코드를 열어보면 `@Component` 애노테이션이 붙어있기 때문이다.

각 클래스가 컴포넌트 스캔의 대상이 되도록 `@Component` 애노테이션을 붙여준다.
```java
@Component
public class MemoryMemberRepository implements MemberRepository {
...
}
```
```java
@Component
public class RateDiscountPolicy implements DiscountPolicy {
...
}
```
```java
@Component
public class MemberServiceImpl implements MemberService {

    private final MemberRepository memberRepository;

    @Autowired  //ac.getBean(MemberRepository.class)
    public MemberServiceImpl(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }
}
```
```java
@Component
public class OrderServiceImpl implements OrderService {
    // 객체 생성을 과감하게 지우고 생성자 생성
    private final MemberRepository memberRepository;
    private final DiscountPolicy discountPolicy;  // 인터페이스를 의존

    @Autowired
    public OrderServiceImpl(MemberRepository memberRepository, DiscountPolicy discountPolicy) {  // 생성자
        this.memberRepository = memberRepository;
        this.discountPolicy = discountPolicy;
    }
}
```
- 이전에는 AppConfig에서는 `@Bean`으로 직접 설정 정보를 작성했고, 의존 관계도 직접 명시했지만 이제는 이런 설정 정보가 없기 때문에 의존관계 주입도 안에서 해결해야 한다.
- `@AutoWired`는 의존관계를 자동으로 주입해주며, 여러 의존관계도 한 번에 주입이 가능하다.

#### 테스트 코드
```java
public class AutoAppConfigTest {

    @Test
    void basicScan() {
        AnnotationConfigApplicationContext ac = new AnnotationConfigApplicationContext(AutoAppConfig.class);

        MemberService memberService = ac.getBean(MemberService.class);
        assertThat(memberService).isInstanceOf(MemberService.class);
    }
}
```
![](https://velog.velcdn.com/images/sgn07124/post/8d2aacbb-f996-40bd-bfa9-799cbcb02e8d/image.png)

설정 정보로 AutoAppConfig 클래스를 넘겨주었고 로그를 확인해보면 컴포넌트 스캔이 잘 동작하는 것을 확인할 수 있다.

### @ComponentScan의 동작 과정
![](https://velog.velcdn.com/images/sgn07124/post/d0bdbbd6-7c11-41ea-a6c3-6042ecb9be58/image.png)

- `@ComponentScan`은 `@Component`가 붙은 모든 클래스를 스프링 빈으로 등록한다.
- 이때, 스프링 빈의 기본 이름은 클래스 명을 사용하되, 맨 앞글자만 소문자를 사용한다. 만약, 스프링 빈의 이름을 직접 지정하고 싶다면 아래와 같이 작성하면 된다.
```java
@Component("memberSevice3")
```

### @AutoWired 동작 과정
![](https://velog.velcdn.com/images/sgn07124/post/196a7014-dcae-4f82-86bd-1c4fe4770ae8/image.png)

생성자에 `@AutoWired`를 지정하면 스프링 컨테이너가 자동으로 해당 스프링 빈을 찾아서 주입한다. 이때, 기본 전략은 타입이 같은 빈을 찾아서 주입한다.

![](https://velog.velcdn.com/images/sgn07124/post/e6a01e73-d46b-413e-b918-fbd5e5c23b00/image.png)

생성자에 파라미터가 많아도 다 찾아서 자동으로 주입한다.

---

# 탐색 위치와 기본 스캔 대상
모든 자바 클래스를 컴포넌트 스캔하면 시간이 오래걸리므로 꼭 필요한 위치부터 탐색하도록 시작 위치를 지정할 수 있다.
```java
@ComponentScan(
    basePackages = "hello.core",
)
```
- basePackages는 탐색할 패키지의 시작 위치를 지정하며, 이 패키지를 포함하여 하위 패키지를 모두 탐색한다. ','를 사용해서 시작 위치를 여러 개 지정할 수도 있다.
- basePackageClasses는 지정한 클래스의 패키지를 탐색 시작 위치로 지정한다. 
- 만약 지정하지 않으면, `@ComponentScan`이 붙은 설정 정보 클래스의 패키지가 시작 위치가 된다.

### 권장하는 방법
> 패키지 위치를 지정하지 않고, 설정 정보 클래스의 위치를 프로젝트 최상단에 두는 것으로 스프링부트도 이 방법을 기본으로 제공한다.

만약 프로젝트가 아래와 같은 구조로 되어있다고 하면
- `com.hello`
- `com.hello.serivce`
- `com.hello.repository`

프로젝트 시작 루트인 `com.hello`에 AppConfig와 같은 메인 설정 정보를 두고, `@ComponentScan` 애노테이션을 붙이고, basePackages 지정은 생략한다.
이렇게 하면 `com.hello`를 포함한 하위는 모두 자동으로 컴포넌트 스캔의 대상이 된다. 그리고 프로젝트의 메인 설정 정보는 프로젝트를 대표하는 정보이기 때문에 **프로젝트 시작 루트 위치**에 두는 것이 좋다.

### 컨테이너 스캔 기본 대상

컴포넌트 스캔은 `@Component` 뿐만 아니라 다음과 내용도 추가로 대상에 포함한다. 
- `@Component` : 컴포넌트 스캔에서 사용
- `@Controller` : 스프링 MVC 컨트롤러에서 사용
- `@Service` : 스프링 비즈니스 로직에서 사용
- `@Repository` : 스프링 데이터 접근 계층에서 사용 
- `@Configuration` : 스프링 설정 정보에서 사용

컴포넌트 스캔의 용도 뿐만 아니라 다음 애노테이션이 있으면 스프링은 부가 기능을 수행한다. 
- `@Controller` : 스프링 MVC 컨트롤러로 인식
- `@Repository` : 스프링 데이터 접근 계층으로 인식하고, 데이터 계층의 예외를 스프링 예외로 변환해준다. 
- `@Configuration` : 앞서 보았듯이 스프링 설정 정보로 인식하고, 스프링 빈이 싱글톤을 유지하도록 추가 처리를 한다.
- `@Service` : `@Service` 는 특별한 처리를 하지 않는다. 대신 개발자들이 핵심 비즈니스 로직이 여기에 있겠구나 라고 비즈니스 계층을 인식하는데 도움이 된다.

---

# 필터
- includeFilters : 컴포넌트 스캔 대상을 추가로 등록
- excludeFilters : 컴포넌트 스캔에서 제외할 대상을 지정

### 예제
#### 컴포넌트 스캔 대상에 추가할 애노테이션
```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface MyIncludeComponent {
}
```
#### 컴포넌트 스캔 대상에서 제외할 애노테이션
```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface MyExcludeComponent {
}
```
#### 컴푸넌트 스캔 대상에 추가할 클래스
```java
@MyIncludeComponent
public class BeanA {
}
```
#### 컴포넌트 스캔 대상에 제외할 클래스
```java
@MyExcludeComponent
public class BeanB {
}
```
#### 설정 정보와 전체 테스트 코드
```java
public class ComponentFilterAppConfigTest {

    @Test
    void filterScan() {
        ApplicationContext ac = new AnnotationConfigApplicationContext(ComponentFilterAppConfig.class);
        BeanA beanA = ac.getBean("beanA", BeanA.class);
        assertThat(beanA).isNotNull();

        assertThrows(
                NoSuchBeanDefinitionException.class,
                () -> ac.getBean("beanB", BeanB.class)
        );
    }

    @Configuration
    @ComponentScan(
            includeFilters = @ComponentScan.Filter(classes = MyIncludeComponent.class),
            excludeFilters = @ComponentScan.Filter(classes = MyExcludeComponent.class)
    )
    static class ComponentFilterAppConfig {

    }
}
```
![](https://velog.velcdn.com/images/sgn07124/post/641b41f2-825a-4d28-8d95-89115c254588/image.png)

- includeFilter에 MyIncludeComponent 애노테이션을 추가해서 BeanA가 스프링 빈에 등록된다.
- excludeFilter에 MyExcludeComponent 애노테이션을 추가해서 BeanB가 스프링 빈에 등록되지 않는다.

### FilterType 옵션

- ANNOTATION : 기본값, 애노테이션을 인식해서 동작
- ASSIGNABLE_TYPE : 지정한 타입과 자식 타입을 인식해서 동작
- ASPECTJ : AspectJ 패턴 사용
- REGEX : 정규 표현식
- CUSTOM : TypeFilter이라는 인터페이스를 구현해서 처리

---

# 중복 등록과 충돌
아래와 같은 상황이 있다.

### 자동 빈 등록 vs 자동 빈 등록
컴포넌트 스캔에 의해 자동으로 스프링 빈이 등록되는데, 그 이름이 같은 경우 스프링은 아래와 같은 오류를 발생시킨다.
```text
ConflictingBeanDefinitionException
```

### 수동 빈 등록 vs 자동 빈 등록
만약 수동 빈 등록과 자동 빈 등록에서 빈 이름이 충돌이 되면 어떻게 될까?
```java
public class MemoryMemberRepository implements MemberRepository {}
```
```java
@Configuration
@ComponentScan(
        excludeFilters = @ComponentScan.Filter(type = FilterType.ANNOTATION, classes = Configuration.class) // AppConfig의 설정 정보를 제외하기 위해서
)
public class AutoAppConfig {

    @Bean(name = "memoryMemberRepository")
    MemberRepository memberRepository() {
        return new MemoryMemberRepository();
    }
}
```
이 경우, 수동 빈 등록이 우선권을 가진다. (수동 빈이 자동 빈을 오버라이딩 해버린다.)

스프링부트에서는 수동 빈 등록과 자동 빈 등록이 충돌나면 오류가 발생하도록 기본 값을 바꾸었다.


---

<br>
<br>

[출처]

인프런 김영한님의 [스프링 기본편](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%ED%95%B5%EC%8B%AC-%EC%9B%90%EB%A6%AC-%EA%B8%B0%EB%B3%B8%ED%8E%B8)을 바탕으로 작성했습니다.