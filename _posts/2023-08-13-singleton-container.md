---
# 글 제목
title: 4. 싱글톤 컨테이너
# 간단한 설명
description: 인프런 김영한님의 "스프링 기본편" 강의를 바탕으로 작성했습니다.
# 작성자
author: 
# 작성일자
date: 2023-08-13 13:00:00 +0800
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

# 웹 애플리케이션과 싱글톤
스프링은 태생이 기업용 온라인 서비스 기술을 지원하기 위해 탄생되었으며, 대부분의 스프링 애플리케이션은 웹 애플리케이션이다. 웹 애플리케이션은 보통 여러 고객이 동시에 요청을 한다.
![](https://velog.velcdn.com/images/sgn07124/post/670ccf60-cbb2-47d0-b938-78c381b7d316/image.png)

위의 그림에서 알 수 있듯이 고객이 3번 요청하면 객체도 3개가 생성된다. 웹 애플리케이션은 여러 고객이 동시에 요청하는 형태인데, 계속 요청이 들어오면 그만큼 객체가 계속 생성되어야 한다는 문제점이 있다.

위 그림처럼 객체가 계속 생성되는지 확인해보겠다.
```java
public class SingletonTest {

    @Test
    @DisplayName("스프링 없는 순수 DI 컨테이너")
    void pureContainer() {
        AppConfig appConfig = new AppConfig();
        // 1. 조회 : 호출할 때마다 객체를 생성
        MemberService memberService1 = appConfig.memberService();

        // 2. 조회 : 호출할 때마다 객체를 생성
        MemberService memberService2 = appConfig.memberService();

        // 참조값이 다른 것을 확인
        System.out.println("memberService1 = " + memberService1);
        System.out.println("memberService2 = " + memberService2);

        // memberService1 != memberService2
        Assertions.assertThat(memberService1).isNotSameAs(memberService2);

    }
}
```
![](https://velog.velcdn.com/images/sgn07124/post/241f51bf-b1bc-4998-9e9f-27b2d304fa65/image.png)

위의 결과를 보면 AppConfig는 요청을 할 때마다 객체를 새로 생성하는 것을 확인할 수 있다(서로 다른 것 확인 가능). 만약, 고객 트래픽이 초당 100이 나오면 초당 100개의 객체가 생성되고 소멸된다. 이는 메모리 낭비가 심하다. 이를 해결하기 위한 방안은 해당 객체가 1개만 생성되고, 공유하도록 설계하는 "**싱글톤 패턴**"을 사용하는 것이다.

---

# 싱글톤 패턴
- 클래스의 인스턴스가 1개만 생성되는 것을 보장하는 디자인 패턴
- 객체 인스턴스를 2개 이상 생성하지 못하도록 막아야 한다.
  - `private` 생성자를 사용해서 외부에서 임의로 `new` 키워드를 사용하지 못하도록 해야 한다.
```java
public class SingletonService {

    // 자기 자신을 선언
    // static을 사용했으므로, 클래스 내에 1개만 존재
    private static final SingletonService instance = new SingletonService();

    // 조회할 때 사용
    public static SingletonService getInstance() {
        return instance;
    }

    // 외부에서 new 키워드를 사용하지 못하도록 private 생성자 생성
    private SingletonService() {
    }

    public void logic() {
        System.out.println("싱글톤 객체 로직 호출");
    }
}
```
1. `static` 영역에 객체 instance를 미리 하나 생성해서 올려둔다
2. 이 객체의 인스턴스가 필요하면 오직 `getInstance()` 메서드를 통해서만 조회가 가능하다. 이 메서드를 호출하면 항상 같은 인스턴스를 반환한다.
3. 1개의 객체 인스턴스만 존재해야하므로 생성자를 private으로 해서 혹시라도 외부에서 `new` 키워드로 객체 인스턴스가 생성되는 것을 막는다.

> 싱글톤 패턴을 구현하는 방법은 여러가지가 있으며 여기서는 객체를 미리 생성해두는 가장 단순하고 안전한 방법을 적용했다. 단, 스프링 사용 시 스프링이 다 해결해준다.

위에서 만든 싱글톤 패턴 코드를 적용 시, 객체 인스턴스가 1개만 존재하는지 테스트
```java
@Test
@DisplayName("싱글톤 패턴을 적용한 객체 사용")
void singletonServiceTest() {
    // new SingletonService() // 에러
    SingletonService singletonService1 = SingletonService.getInstance();
    SingletonService singletonService2 = SingletonService.getInstance();

    System.out.println("singletonService1 = " + singletonService1);
    System.out.println("singletonService2 = " + singletonService2);

    // memberService1 == memberService2
    assertThat(singletonService1).isSameAs(singletonService2); // 객체 하나이므로 같아야됨(isSameAs())
}
```
![](https://velog.velcdn.com/images/sgn07124/post/aafe92fe-bda3-4527-840c-f4cccbf570ff/image.png)

같은 인스턴스가 반환된 것을 확인할 수 있다.

### 싱글톤 패턴의 문제점
싱글톤 패턴을 적용하면 고객의 요청이 올 때마다 객체를 생성하는 것이 아니라, 이미 만들어진 객체를 공유해서 효율적으로 사용할 수 있다. 하지만 아래 같은 문제점들이 있다.
- 싱글톤 패턴을 구현하는 코드 자체가 많이 들어간다.(위에서 작성한 SingletonService로 모든 클래스에 다 따로 설정을 해줘야한다.)
- 의존 관계상 클라이언트가 구체 클래스에 의존함 → DIP 위반
- 클라이언트가 구체 클래스에 의존해서 OCP 원칙을 위반할 가능성이 높음
- 테스트하기 어려움
- 내부 속성을 변경하거나 초기화하기 어려움
- 자식 클래스를 만들기 어려움 (private 생성자를 사용하기 때문)
- 유연성이 떨어짐
- 안티 패턴으로 불리기도 함

---

# 싱글톤 컨테이너
- 스프링 컨테이너는 싱글톤 패턴의 문제점을 해결하면서, 객체 인스턴스를 싱글톤(1개만 생성)으로 관리한다. 
- 스프링 빈은 싱글톤으로 관리되는 빈
- 스프링 컨테이너에 싱글톤 패턴을 적용하지 않아도, 객체 인스턴스를 싱글톤으로 관리한다.
- 스프링 컨테이너는 싱글톤 컨테이너 역할을 한다. → 싱글톤 객체를 생성하고 관리하는 기능을 싱글톤 레지스트리라고 한다.
- 스프링 컨테이너의 이런 기능 덕분에 싱글톤 패턴의 단점을 해결하면서 객체를 싱글톤으로 유지할 수 있다. 
  - 싱글톤 패턴을 위한 지저분한 코드가 안 들어가도 된다.
  - DIP, OCP, Test, private 생성자로부터 자유롭게 싱글톤을 사용할 수 있다.

### 스프링 컨테이너를 사용하는 테스트 코드
```java
@Test
@DisplayName("스프링 컨테이너와 싱글톤")
void springContainer() {
    // AppConfig appConfig = new AppConfig();
    ApplicationContext ac = new AnnotationConfigApplicationContext(AppConfig.class);
    // 1. 조회 : 호출할 때마다 객체를 생성
    MemberService memberService1 = ac.getBean("memberService", MemberService.class);

    // 2. 조회 : 호출할 때마다 객체를 생성
    MemberService memberService2 = ac.getBean("memberService", MemberService.class);

    // 참조값이 다른 것을 확인
    System.out.println("memberService1 = " + memberService1);
    System.out.println("memberService2 = " + memberService2);

    // memberService1 == memberService2
    assertThat(memberService1).isSameAs(memberService2);  // 객체가 두 개 생성되므로 같아야됨 (isSameAs)
}
```
![](https://velog.velcdn.com/images/sgn07124/post/a1cdbb6f-e221-4c66-ad70-0773c67507d4/image.png)

스프링 컨테이너 덕분에 고객의 요청이 올 때마다 객체를 생성하는 것이 아니라, 이미 만들어진 객체(memberService)를 공유해서 효율적으로 재사용하는 것이다.

![](https://velog.velcdn.com/images/sgn07124/post/30afba66-32d1-44c7-945b-3d120d275644/image.png)

---

# 싱글톤 방식의 주의점
싱글톤 패턴이든, 스프링 같은 싱글톤 컨테이너를 사용하든, 객체 인스턴스를 하나만 생성해서 공유하는 싱글톤 방식은 여러 클라이언트가 하나의 같은 객체 인스턴스를 공유하기 때문에 싱글톤 객체는 상태를 유지(stateful)하게 설계하면 안되고 **무상태(stateless)**로 설계해야 한다.

무상태로 설계하는 조건
- 특정 클라이언트에 의존적인 필드가 있으면 안된다.
- 특정 클라이언트가 값을 변경할 수 있는 필드가 있으면 안된다.
- 필드 대신에 자바에서 공유되지 않는 지역변수, 파라미터, ThreadLocal 등을 사용해야 한다.

스프링 빈의 필드에 공유 값을 설정하면 정말 큰 장애가 발생할 수 있다.

### 싱글톤 객체의 상태를 유지할 경우 발생하는 문제점의 예시 코드
#### StatefulService.java
```java
public class StatefulService {

    private int price;  // 상태를 유지하는 필드

    public void order(String name, int price) {
        System.out.println("name = " + name + " price = " + price);
        this.price = price;  // 여기가 문제!!!
    }

    public int getPrice() {
        return price;
    }
}
```
#### StatefulServiceTest.java
```java
class StatefulServiceTest {

    @Test
    void statefulServiceSingleton() {
        ApplicationContext ac = new AnnotationConfigApplicationContext(TestConfig.class);
        StatefulService statefulService1 = ac.getBean(StatefulService.class);
        StatefulService statefulService2 = ac.getBean(StatefulService.class);

        //ThreadA : A 사용자 10000원 주문
        statefulService1.order("userA", 10000);
        //ThreadB : B 사용자 20000원 주문 → 사용자A가 주문을 하고 주문 금액을 조회하는 도중 사이에 사용자B가 끼어들어서 주문을 하는 상황
        statefulService2.order("userB", 20000);

        //ThreadA : 사용자A 주문 금액 조회
        int price = statefulService1.getPrice();
        System.out.println("price = " + price);  // A를 조회했으므로 10000원을 기대했지만 20000원이 나온다.

        Assertions.assertThat(statefulService1.getPrice()).isEqualTo(20000); // 이러면 서비스 망함!!!
    }

    static class TestConfig {

        @Bean
        public StatefulService statefulService() {
            return new StatefulService();
        }
    }
}
```
![](https://velog.velcdn.com/images/sgn07124/post/b53979d9-d819-46f8-bc65-8780055e97c6/image.png)

- 사용자A가 주문을 하고 주문 금액을 조회하는 도중에 사용자B가 주문을 했다. 이 상황에서 price의 값은 어떤 값이 들어가는지 확인을 해보면 10000원이 아닌 B의 주문 금액인 20000원이 나온다.
- StatefulService의 price 필드는 공유되는 필드인데, 특정 클라이언트가 값을 변경한다.
- 위의 예시에서 봤듯이, 공유 필드는 조심해야 한다. 스프링 빈은 항상 **무상태(stateless)** 로 설계해야 한다.

---

# @Configuration과 싱글톤
AppConfig.java 코드를 보면
```java
Configuration
public class AppConfig {

    @Bean
    public MemberService memberService() {
        return new MemberServiceImpl(memberRepository());
    }

    @Bean
    public OrderService orderService() {
        return new OrderServiceImpl(memberRepository(), discountPolicy());
    }

    @Bean
    public MemberRepository memberRepository() {
        return new MemoryMemberRepository();
    }

    @Bean
    public DiscountPolicy discountPolicy() {
        return new RateDiscountPolicy();
    }
}
```
memberService 빈을 만드는 코드에서는 memberRepository()를 호출해서 new MeomoryMemberRepository를 호출한다. 그리고 orderService 빈을 만드는 코드에서는 memberRepository()를 호출해서 new MemoryMemberRepository를 호출한다. 결과적으로 각각 다른 2개의 MemoryMemberRepository가 생성되면서 싱글톤이 깨지는 것처럼 보이는데 스프링 컨테이너는 이 문제를 어떻게 해결할까??

MemberServiceImpl.java와 OrderServiceImpl.java에 아래의 코드(MemberRepository를 조회하는 기능)를 추가한다.
```java
// 테스트 용도
public MemberRepository getMemberRepository() {
    return memberRepository;
}
```
테스트 코드
```java
public class ConfigurationSingletonTest {

    @Test
    void ConfigurationTest() {
        ApplicationContext ac = new AnnotationConfigApplicationContext(AppConfig.class);

        MemberServiceImpl memberService = ac.getBean("memberService", MemberServiceImpl.class);
        OrderServiceImpl orderService = ac.getBean("orderService", OrderServiceImpl.class);
        MemberRepository memberRepository = ac.getBean("memberRepository", MemberRepository.class);

        MemberRepository memberRepository1 = memberService.getMemberRepository();
        MemberRepository memberRepository2 = orderService.getMemberRepository();

        System.out.println("memberService -> memberRepository = " + memberRepository1);
        System.out.println("orderService -> memberRepository = " + memberRepository2);
        System.out.println("memberRepository = " + memberRepository);
        
        Assertions.assertThat(memberService.getMemberRepository()).isSameAs(memberRepository);
        Assertions.assertThat(orderService.getMemberRepository()).isSameAs(memberRepository);
    }
}
```
![](https://velog.velcdn.com/images/sgn07124/post/fd398c98-199f-4e3e-8117-f19c570e46f6/image.png)


실행 결과를 보면  memberRepository 인스턴스는 모두 같은 인스턴스가 공유되어 사용된다.

Appconfig.java에 호출 로그를 남겨보면
```java
@Configuration
public class AppConfig {

    @Bean
    public MemberService memberService() {
        System.out.println("call AppConfig.memberService");
        return new MemberServiceImpl(memberRepository());
    }

    @Bean
    public OrderService orderService() {
        System.out.println("call AppConfig.orderService");
        return new OrderServiceImpl(memberRepository(), discountPolicy());
    }

    @Bean
    public MemberRepository memberRepository() {
        System.out.println("call AppConfig.memberRepository");
        return new MemoryMemberRepository();
    }

    @Bean
    public DiscountPolicy discountPolicy() {
        return new RateDiscountPolicy();
    }
}
```
출력 결과를 예상해보면 아래와 같다. (순서 상관 x)
```java
// call AppConfig.memberService
// call AppConfig.memberRepository
// call AppConfig.memberRepository
// call AppConfig.orderService
// call AppConfig.memberRepository
```
하지만 실제 결과를 보면 아래와 같다.
```java
// call AppConfig.memberService
// call AppConfig.memberRepository
// call AppConfig.orderService
```
memberRepository()가 3번 호출될 거 같았는데 1번만 호출이 된다.

![](https://velog.velcdn.com/images/sgn07124/post/e9257688-0900-4248-ae07-2074c815eae8/image.png)


---

# @Configuration과 바이트코드 조작의 마법
스프링 컨테이너는 싱글톤 레지스트리이다. 따라서 스프링 빈이 싱글톤이 되도록 보장해주어야한다. 그런데 스프링 빈이 자바 코드까지 어떻게 하기는 어렵다. AppConfig.java에서 작성한 코드만 봐도 memoryRepository가 3번이 아닌 1번만 호출되었다.

AppConfig의 클래스 타입이 무엇인지 출력해보면
```java
@Test
void configurationDeep() {
    ApplicationContext ac = new AnnotationConfigApplicationContext(AppConfig.class);
    AppConfig bean = ac.getBean(AppConfig.class);

    System.out.println("bean = " + bean.getClass());
}
```
![](https://velog.velcdn.com/images/sgn07124/post/535e2f9a-8a19-43b5-8e31-7d326d65de3d/image.png)

class 이름이 hello.core.AppConfig가 아닌 뒤에 뭔가가 더 붙어서 출력이 되었다.

이것은 내가 만든 클래스가 아니라 CGLIB라는 바이트코드 조작 라이브러리를 사용해서 AppConfig 클래스를 상속받은 임의의 다른 클래스를 만들고, 그 다른 클래스를 스프링 빈으로 등록한 것이다.

![](https://velog.velcdn.com/images/sgn07124/post/8528fcb9-3f94-4417-9262-e201bf32f23a/image.png)

그 임의의 다른 클래스가 바로 싱글톤이 보장되도록 해준다.

### @Configuration을 적용하지 않고 @Bean만 적용하는 경우 

AppConfig.java에서 붙였던 @Configuration은 바이트코드를 조작하는 CGLIB 기술을 사용해서 싱글톤을 보장했었다. 그런데 만약에 @Configuration 없이 @Bean만 적용하면 어떻게 될까?
![](https://velog.velcdn.com/images/sgn07124/post/82e1e5b0-5c11-4fe8-823b-27ebaf8b7e7e/image.png)

위 결과를 분석해 보면
```text
bean = class hello.core.AppConfig
```
AppConfig가 CGLIB 기술없이 순수한 AppConfig로 스프링 빈에 등록된 것을 확인할 수 있다.(마지막 출력 라인)

```text
call Appconfig.memberService
call Appconfig.memberRepository
call Appconfig.memberRepository
call AppConfig.orderService
call Appconfig.memberRepository
```
여기서는 memberRepository가 3번 호출되었는데, 첫 번째는 @Bean에 의해 스프링 컨테이너에 등록하기 위함이고, 두 번째, 세 번째는 각각 memberRepository()를 호출하면서 발생한 코드다.

### 정리

- @Bean만 사용해도 스프링 빈으로 등록되지만, 싱글톤으로 보장하지 않는다.
  - memberRepository()처럼 의존관계 주입이 필요해서 메서드를 직접 호출할 때 싱글톤을 보장하지 않는다.
- 스프링 설정 정보는 항상 @configuration을 사용하면 된다.




---

<br>
<br>

[출처]

인프런 김영한님의 [스프링 기본편](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%ED%95%B5%EC%8B%AC-%EC%9B%90%EB%A6%AC-%EA%B8%B0%EB%B3%B8%ED%8E%B8)을 바탕으로 작성했습니다.