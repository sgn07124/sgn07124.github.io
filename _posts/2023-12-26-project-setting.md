---
# 글 제목
title: 1. 프로젝트 환경설정
# 간단한 설명
description: 인프런 김영한님의 "실전! 스프링 부트와 JPA 활용1 - 웹 애플리케이션 개발" 강의를 바탕으로 작성했습니다.
# 작성자
author: 
# 작성일자
date: 2023-12-26 13:00:00 +0800
# 카테고리 대주제 > 소주제
categories: [강의정리, 실전! 스프링 부트와 JPA 활용1 - 웹 애플리케이션 개발]
# 태그
tags: [spring, JPA]
# 메인화면에 고정
pin: false
# 웹페이지의 성능적인 이유에서 mathematical 기능은 기본적으로 꺼져있음.
math: true
# 표 생성 도구로 true로 설정 시, ```mermaid 를 사용할 수 있다.
mermaid: false

---

# 1. 프로젝트 생성

![Untitled](![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/7a7b3090-df52-4a41-9b25-5773819baa99/bc9d21ef-53b3-428d-b5f0-e4a89ea37dea/Untitled.png))

### Dependencies

- Spring Web
- Thymeleaf
- Spring Data JPA
- H2 Database
- Validation
    - Springboot 3.x.x 버전은 Validation 모듈 추가

### Lombok 설정 필요

plugin → Lombok 설치 후 Setting → Annotation Processors에서 Enable Annotation Processing 체크

Lombok을 사용하면 getter setter와 같은 긴 코드를 `@Getter`와 `@Setter`와 같이 어노테이션으로 대체하여 사용할 수 있다.

# 2. 라이브러리 살펴보기

terminal에서 프로젝트 경로로 이동해서 `./gradlew deqendencies` → 의존관계 확인 가능

IntelliJ에서도 우측의 Gradle 탭으로 의존관계 확인 가능

# 3. View 환경 설정

**jpabook.jpashop.HelloController**

```java
@Controller
 public class HelloController {
     @GetMapping("hello") // mapping할 파일
     public String hello(Model model) {
         model.addAttribute("data", "hello!!");  // ${data} 부분
         return "hello";
     }
}
```

**thymeleaf 템플릿엔진 동작 확인(hello.html)**

```html
<!DOCTYPE HTML>
 <html xmlns:th="http://www.thymeleaf.org">
 <head>
     <title>Hello</title>
     <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
 </head>
<body>
<p th:text="'안녕하세요. ' + ${data}" >안녕하세요. 손님</p>  <!--data-->
</body>
</html>
```

- `hello.html`을 실행하면 화면에 “안녕하세요. 손님”이 띄워지는 것을 확인할 수 있다.
- `HelloController` 파일에서 `@GetMapping`으로 `hello.html`을 매핑하고 `model..addAttribute("data", "hello!!");`으로 `${data}` 부분에 hello!!를 넣어서 서버 사이드(JpashopApplication)로 실행 후 chrome에서 `localhost:8080/hello`로 실행 시, “안녕하세요. 손님”이 아닌 “안녕하세요. hello!!”가 화면에 띄워지는 것을 확인할 수 있다. 또한 코드 보기를 하면 서버 사이드에서 렌더링이 되서 html 코드로 `<p>안녕하세요. hello!!</p>`로 나오는 것을 확인할 수 있다.

> **매핑 방법(Controller가 hello.html을 찾는 방법)**
`resources:templates/` +{ViewName}+ `.html` 의 설정된 형식으로 thymeleaf가 templates 하위의 파일을 찾는다.
> 

### 서버 재시작 없이 html 변경 적용 확인 하는 방법

`build.gradle`에서 `implementation ‘org.springframework.boot:spring-boot-devtools’` 추가

### 만약 서버 사용 중이라는 에러가 뜨는 경우

1. terminal에 `lsof -i :포트번호` 입력
    
    ex) lsof -i:8080
    
2. 내역 확인 후, `kill -9 pid번호`
    
    ex) kill -9  84670
    
    ```bash
    COMMAND   PID       USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
    java    84670 kimkyungho   78u  IPv6 0xb72bc1a60697edc9      0t0  TCP *:http-alt (LISTEN)
    ```
    

# 4. H2 데이터베이스 설치

### 실행

1. `kimkyungho/Desktop/study/infern_spring/h2/bin`에서 `ll` 하면 아래와 같이 나온다.
    
    ![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/7a7b3090-df52-4a41-9b25-5773819baa99/0dc2957a-40f0-462b-a477-4c911d5877c9/Untitled.png)
    
2. `./h2.sh`로 실행
    
    만약 permission denied가 뜨면 `chmod 755 h2.sh`로 권한을 부여해주면 된다.
    

# 5. JPA와 DB 설정, 동작확인

### JPA 및 DB 설정 파일 → application.yml

```yaml
spring:
  datasource:
    url: jdbc:h2:tcp://localhost/~/jpashop;
    username: sa
    password:
    driver-class-name: org.h2.Driver

  jpa:
    hibernate:
      ddl-auto: create
    properties:
      hibernate:
#        show_sql: true
        format_sql: true

logging:
  level:
    org.hibernate.SQL: debug
    org.hibernate.orm.jdbc.bind: trace
```

 db 설정 파일의 `url: jdbc:h2:tcp://localhost/~/jpashop;` 와 h2 데이터베이스의 JDBC URL을 맞춰줘야 한다. 또한 최근 버전의 h2 데이터베이스에서는 MVCC 옵션을 db 설정 파일에 포함시키면 오류가 발생한다.

회원 엔티티와 회원 레포지토리 생성 후 아래와 같이 테스트 케이스 작성하면

```java
@SpringBootTest
class MemberRepositoryTest {

    @Autowired MemberRepository memberRepository;

    @Test
    @Transactional
    @Rollback(value = false)
    public void testMember() throws Exception {
        //given
        Member member = new Member();
        member.setUsername("memberA");
        //when
        Long saveId = memberRepository.save(member);
        Member findMember = memberRepository.find(saveId);
        //then
        assertThat(findMember.getId()).isEqualTo(member.getId());
        assertThat(findMember.getUsername()).isEqualTo(member.getUsername());
    }
}
```

아래와 같이 DB 설정 파일에서 연결한 데이터베이스에 테이블을 생성했다는 로그를 확인할 수 있으며, DB에 접속해보면 member 테이블이 생성된 것을 확인할 수 있다.

테스트는 성공/실패 여부만 확인하기 때문에 데이터는 추가되었다가 다시 삭제되는 것이 기본값이다. 하지만 테스트 후 db에 저장된 데이터를 확인하고 싶다면 `@Rollback(false)`를 위 코드와 같이 `@Test` 위치에 포함시키면 된다. `@Rollback(false)`를 붙이면 데이터가 아래와 같이 남아 있는다. 

```bash
2023-12-27T14:20:49.230+09:00 DEBUG 94685 --- [    Test worker] org.hibernate.SQL                        : 
    drop table if exists member cascade 
2023-12-27T14:20:49.232+09:00 DEBUG 94685 --- [    Test worker] org.hibernate.SQL                        : 
    drop sequence if exists member_seq
2023-12-27T14:20:49.235+09:00 DEBUG 94685 --- [    Test worker] org.hibernate.SQL                        : 
    create sequence member_seq start with 1 increment by 50
2023-12-27T14:20:49.237+09:00 DEBUG 94685 --- [    Test worker] org.hibernate.SQL                        : 
    create table member (
        id bigint not null,
        username varchar(255),
        primary key (id)
    )
```

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/7a7b3090-df52-4a41-9b25-5773819baa99/b587df78-c4f3-46e8-a2a3-eac188745117/Untitled.png)

[출처]

인프런 김영한님의 [JPA 활용 1편](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81%EB%B6%80%ED%8A%B8-JPA-%ED%99%9C%EC%9A%A9-1#curriculum)을 바탕으로 작성했습니다.