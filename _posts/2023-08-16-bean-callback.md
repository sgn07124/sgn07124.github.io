---
# 글 제목
title: 7. 빈 생명주기 콜백
# 간단한 설명
description: 인프런 김영한님의 "스프링 기본편" 강의를 바탕으로 작성했습니다.
# 작성자
author: 
# 작성일자
date: 2023-08-16 13:00:00 +0800
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

# 빈 생명주기 콜백 시작
데이터베이스 커넥션 풀이나 네트워크 소켓처럼 애플리케이션 시작 시점에 필요한 연결을 미리 해두고, 애플리케이션 종료 시점에 연결을 모두 종료하는 작업을 진행하려면, 객체의 초기화와 종료 작업이 필요하다.

### 예제
```java
public class NetworkClient {

    private String url;

    // default constructor
    public NetworkClient() {
        System.out.println("생성자 호출, url = " + url);
        connect();
        call("초기화 생성 메시지");
    }

    public void setUrl(String url) {
        this.url = url;
    }

    // 서비스 시작 시 호출
    public void connect() {
        System.out.println("connect: " + url);

    }

    public void call(String message) {
        System.out.println("call : " + url + " message = " + message);
    }

    // 서비스 종료 시 호출
    public void disconnect() {
        System.out.println("close: " + url);
    }
}
```
```java
public class BeanLifeCycleTest {

    @Test
    public void lifeCycleTest() {
        ConfigurableApplicationContext ac = new AnnotationConfigApplicationContext(LifeCycleConfig.class);
        NetworkClient client = ac.getBean(NetworkClient.class);
        ac.close();
    }

    @Configuration
    static class LifeCycleConfig {
        @Bean
        public NetworkClient networkClient() {
            NetworkClient networkClient = new NetworkClient();
            networkClient.setUrl("http://hello-spring.dev");
            return networkClient;
        }
    }
}
```
![](https://velog.velcdn.com/images/sgn07124/post/dfe07e3f-641d-46a1-876c-1b778edc1f82/image.png)

#### 과정
`NetworkClient()` 메서드에서 `NetworkClient()` 생성자 호출 → `NetworkClient()`에는 url이 없으니 `null`이 들어감 → 생성자에서 `connect()` 호출 → `connect()`에는 url이 없으므로 url에 `null`이 출력됨 → 생성자에서 `call()`을 호출하고, url에는 값이 없으니 `null`이, 메시지에는 "초기화 연결 메시지"가 출력됨

### 스프링 빈의 이벤트 라이프사이클
스프링 빈은 아래와 같은 라이프 사이클을 가진다.

> 객체 생성 → 의존관계 주입

스프링 빈은 객체를 생성하고, 의존관계 주입이 끝난 후에야 필요한 데이터를 사용할 수 있는 준비가 완료된다. 따라서 초기화 작업은 의존관계 주입이 모두 완료되고 난 다음에 호출해야 한다.

**스프링은 의존관계 주입이 완료되면 스프링 빈에게 콜백 메서드를 통해서 초기화 시전을 알려주는 다양한 기능을 제공**한다. 또한 **스프링 컨테이너가 종료되기 직전에 소멸 콜백을 준다**. 따라서 안전하게 종료 작업을 진행할 수 있다. 

> 스프링 컨테이너 생성 → 스프링 빈 생성 → 의존관계 주입 → 초기화 콜백(빈이 생성되고, 빈이 의존관계 주입이 완료된 후 호출) → 사용 → 소멸 전 콜백(빈이 소멸되기 직전에 호출) → 스프링 종료

- **초기화 콜백** : 빈이 생성되고, 빈의 의존관계 주입이 완료된 후 호출
- **소멸 전 콜백** : 빈이 소멸되기 직전에 호출

#### 스프링의 빈 생명주기 콜백 지원 방법
- 인터페이스(InitializingBean, DisposableBean)
- 설정 정보에 초기화 메서드, 종료 메서드 지정
- `@PostConstruct`, `@PreDestory` 애노테이션 지원

---

# 인터페이스 InitializingBean, DisposableBean
```java
public class NetworkClient implements InitializingBean, DisposableBean {

    private String url;

    // default constructor
    public NetworkClient() {
        System.out.println("생성자 호출, url = " + url);
    }

    public void setUrl(String url) {
        this.url = url;
    }

    // 서비스 시작 시 호출
    public void connect() {
        System.out.println("connect: " + url);

    }

    public void call(String message) {
        System.out.println("call : " + url + " message = " + message);
    }

    // 서비스 종료 시 호출
    public void disconnect() {
        System.out.println("close: " + url);
    }

    @Override
    public void afterPropertiesSet() throws Exception {
        System.out.println("NetworkClient.afterPropertiesSet");
        connect();
        call("초기화 생성 메시지");
    }

    @Override
    public void destroy() throws Exception {
        System.out.println("NetworkClient.destroy");
        disconnect();
    }
}
```
>`InitializingBean` : `afterPropertiesSet()` 메서드로 초기화를 지원한다.
`DisposableBean` : `destroy()` 메서드로 소멸을 지원한다.

![](https://velog.velcdn.com/images/sgn07124/post/1bd36d26-c9c3-4293-a66c-c71d516f6032/image.png)

출력 결과를 보면 초기화 메서드가 주입 완료 후에 적절하게 호출된 것을 확인할 수 있고, 스프링 컨테이너의 종료가 호출되자 소멸 메서드가 호출된 것도 확인할 수 있다.

#### 초기화, 소멸 인터페이스 단점
- 이 인터페이스는 스프링 전용 인터페이스로 해당 코드가 스프링 전용 인터페이스에 의존한다.
- 초기화, 소멸 메서드의 이름을 변경할 수 없다.
- 내가 코드를 고칠 수 없는 외부 라이브러리에 적용할 수 없다.

> 해당 방법은 스프링 초창기(2003)에 나온 방법으로 지금은 거의 사용하지 않는다.

---

# 빈 등록 초기화, 소멸 메서드 지정
설정 정보에 <code>@Bean(initMetod = "init", destroyMethod = "close")</code>처럼 초기화, 소멸 메서드를 지정할 수 있다.

#### 설정 정보를 사용하도록 변경
```java
public class NetworkClient {

    private String url;

    // default constructor
    public NetworkClient() {
        System.out.println("생성자 호출, url = " + url);
    }

    public void setUrl(String url) {
        this.url = url;
    }

    // 서비스 시작 시 호출
    public void connect() {
        System.out.println("connect: " + url);

    }

    public void call(String message) {
        System.out.println("call : " + url + " message = " + message);
    }

    // 서비스 종료 시 호출
    public void disconnect() {
        System.out.println("close: " + url);
    }

	// init()과 close()
    public void init() {
        System.out.println("NetworkClient.init");
        connect();
        call("초기화 생성 메시지");
    }

    public void close() {
        System.out.println("NetworkClient.close");
        disconnect();
    }
}
```
#### 설정 정보에 초기화 소멸 메서드 지정
```java
@Configuration
static class LifeCycleConfig {
    @Bean(initMethod = "init", destroyMethod = "close")
    public NetworkClient networkClient() {
        NetworkClient networkClient = new NetworkClient();
        networkClient.setUrl("http://hello-spring.dev");
        return networkClient;
    }
}
```
![](https://velog.velcdn.com/images/sgn07124/post/7caaa1a9-e7fe-4e66-b257-db11806e7fe8/image.png)

### 설정 정보 사용 특징
- 메서드 이름을 자유롭게 줄 수 있고, 스프링 빈이 스프링 코드에 의존하지 않는다.
- **코드가 아니라 설정 정보를 사용하기 때문에 코드를 고칠 수 없는 외부 라이브러리에서도 초기화, 종료 메서드를 적용할 수 있다.**

### 종료 메서드 추론
- 라이브러리는 대부분 close, shutdown 이라는 이름의 종료 메서드를 사용한다.
- `@Bean`의 `destroyMethod`는 기본값이 **(inferred)**(추론)으로 등록되어 있다.
- 이 추론 기능은 `close`, `shutdown`이라는 이름의 메서드를 자동으로 호출해준다. 이름 그대로 종료 메서드를 추론해서 호출해 준다. 따라서 직접 스프링 빈으로 등록하면 종료 메서드는 따로 적어주지 않아도 잘 동작한다.
- 추론 기능을 사용하기 싫으면 `destroymethod = ""` 처럼 빈 공백을 지정하면 된다.

---

# 애노테이션 @PostConstruct, @PreDestroy
```java
public class NetworkClient {

    private String url;

    // default constructor
    public NetworkClient() {
        System.out.println("생성자 호출, url = " + url);
    }

    public void setUrl(String url) {
        this.url = url;
    }

    // 서비스 시작 시 호출
    public void connect() {
        System.out.println("connect: " + url);

    }

    public void call(String message) {
        System.out.println("call : " + url + " message = " + message);
    }

    // 서비스 종료 시 호출
    public void disconnect() {
        System.out.println("close: " + url);
    }

    @PostConstruct
    public void init() {
        System.out.println("NetworkClient.init");
        connect();
        call("초기화 생성 메시지");
    }

    @PreDestroy
    public void close() {
        System.out.println("NetworkClient.close");
        disconnect();
    }
}
```
```java
@Configuration
static class LifeCycleConfig {
    @Bean
    public NetworkClient networkClient() {
        NetworkClient networkClient = new NetworkClient();
        networkClient.setUrl("http://hello-spring.dev");
        return networkClient;
    }
}
```
![](https://velog.velcdn.com/images/sgn07124/post/9865d88a-2ec0-4576-97ec-84e58b4c976c/image.png)

`@PostConstruct`, `@PreDestroy` 이 두 애노테이션을 사용하면 가장 편리하게 초기화와 종료를 실행할 수 있다.

### @PostConstruct, @PreDestroy 애노테이션 특징
- 최신 스프링에서 가장 권하는 방법으로 애노테이션 하나만 붙이면 되므로 매우 편리하다.
- 패키지를 잘 보면 <code>import jakarta.annotation.PostConstruct;</code>(jdk 17기준으로 11에서는 jakarta가 아니라 javax로 뜸)이다.  스프링에 종속적인 기술이 아니므로 스프링이 아닌 다른 컨테이너에서도 동작한다.
- 컴포넌트 스캔과 잘 어울린다.
- 유일한 단점은 **외부 라이브러리에는 적용하지 못 한다**는 것이다. 외부 라이브러리를 초기화, 종료 해야 하면 `@Bean`의 기능을 사용하자

### 결론
> `@PostConstruct`, `@PreDestroy` 애노테이션 사용하면 된다.



<br>
<br>

---

[출처]

인프런 김영한님의 [스프링 기본편](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%ED%95%B5%EC%8B%AC-%EC%9B%90%EB%A6%AC-%EA%B8%B0%EB%B3%B8%ED%8E%B8)을 바탕으로 작성했습니다.