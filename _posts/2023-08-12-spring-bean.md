---
# 글 제목
title: 3. 스프링 컨테이너와 스프링 빈
# 간단한 설명
description: 인프런 김영한님의 "스프링 기본편" 강의를 바탕으로 작성했습니다.
# 작성자
author: 
# 작성일자
date: 2023-08-12 13:00:00 +0800
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

# 스프링 컨테이너 생성
```java
// 스프링 컨테이너 생성
ApplicationContext applicationContext = new AnnotationConfigApplicationContext(AppConfig.class);
```
- <code>ApplicationContext</code>는 스프링 컨테이너이며 인터페이스이다.
- 스프링 컨테이너는 XML을 기반으로 만들 수 있고, 어노테이션 기반의 자바 설정 클래스로 스프링 컨테이너를 만들 수 있다.
- 스프링 컨테이너를 부를 때, BeanFactory, ApplicationContext로 구분해서 이야기 하는데 일반적으로 ApplicationContext를 스프링 컨테이너라 한다.

### 스프링 컨테이너 생성 과정

1. 스프링 컨테이너 생성
![](https://velog.velcdn.com/images/sgn07124/post/12ef3b86-e3a7-40f0-8682-55710bcbf273/image.png)

- <code>new AnnotationConfigApplicationContext(AppConfig.class)</code>
- 스프링 컨테이너를 생성할 때는 구성 정보를 지정해주어야 한다. → <code>AppConfig.class</code>를 구성 정보로 지정했다.

2. 스프링 빈 등록
![](https://velog.velcdn.com/images/sgn07124/post/f17c54d7-021e-4ef1-b882-1ce7b0d06b46/image.png)

- 스프링 컨테이너는 파라미터로 넘어온 설정 클래스 정보를 사용해서 스프링 빈을 등록한다.
- 빈 이름은 메서드 이름을 사용하며 빈 이름을 직접 부여할 수도 있지만 빈 이름은 항상 다른 이름을 부여해야 한다. 같은 이름을 부여하면 다른 빈이 무시되거나, 기존 빈을 덮어버리거나 설정에 따라 오류가 발생할 수 있다. -> 빈의 이름은 항상 다른 이름으로 부여하자!!

3. 스프링 빈 의존관계 설정 - 준비
![](https://velog.velcdn.com/images/sgn07124/post/ffad3be6-f53a-43ab-8ff5-1558514209b4/image.png)

4. 스프링 빈 의존관계 설정 - 완료
![](https://velog.velcdn.com/images/sgn07124/post/fca40477-bb55-49e9-bae5-fae4e7ab65af/image.png)

- 스프링 컨테이너는 설정 정보를 참조해서 의존관계를 주입(DI)한다.  

---

# 컨테이너에 등록된 모든 빈 조회
### 모든 빈 출력하기
```java
@Test
@DisplayName("모든 빈 출력하기")
void findAllBean() {
    String [] beanDefinitionNames = ac.getBeanDefinitionNames();
    for (String beanDefinitionName : beanDefinitionNames) {
        Object bean = ac.getBean(beanDefinitionName);
        System.out.println("name = " + beanDefinitionName + " object = " + bean);
    }
}
```
![](https://velog.velcdn.com/images/sgn07124/post/d4eebbb8-afa8-484e-8081-36b41aaaf9f3/image.png)

- 실행하면 스프링에 등록된 모든 빈 정보를 출력할 수 있다.
- <code>ac.getBeanDefinitionNames()</code> : 스프링에 등록된 모든 빈 이름을 조회한다.
- <code>ac.getBean()</code> : 빈 이름으로 빈 객체(인스턴스)를 조회한다.

### 애플리케이션 빈 출력하기
```java
@Test
@DisplayName("애플리케이션 빈 출력하기")  // AppConfig를 포함해서 등록한 Bean만 출력
void findApplicationBean() {
    String [] beanDefinitionNames = ac.getBeanDefinitionNames();
    for (String beanDefinitionName : beanDefinitionNames) {
        BeanDefinition beanDefinition = ac.getBeanDefinition(beanDefinitionName);
        if (beanDefinition.getRole() == BeanDefinition.ROLE_APPLICATION) {
            Object bean = ac.getBean(beanDefinitionName);
            System.out.println("name = " + beanDefinitionName + " object = " + bean);
        }
    }
}
```
![](https://velog.velcdn.com/images/sgn07124/post/c93182dd-2d7f-4a7f-8414-463f73549cfa/image.png)

- 스프링 내부에서 사용하는 빈은 제외하고, 내가 등록한 빈만 출력한다.
- 스프링 내부에서 사용하는 빈은 <code>getRole()</code>로 구분할 수 있다.
  - <code>ROLE_APPLICATION</code> : 직접 등록한 애플리케이션 빈
  - <code>ole ROLE_INFRASTRUCTURE</code> : 스프링 내부에서 사용하는 빈
  
---

# 스프링 빈 조회 - 기본
스프링 컨테이너에서 스프링 빈을 찾는 가장 기본적인 방법은 다음과 같다.

- <code>ac.getBean(빈이름, 타입)</code>
- <code>ac.getBean(타입)</code>

만약 조회하려는 스프링 빈이 없는 경우 예외 발생
- <code>NoSuchBeanDefinitionException: No bean named 'xxxxx' available</code>

### 스프링 빈 조회 - 빈 이름, 타입
```java
@Test
@DisplayName("빈 이름으로 조회")
void findBeanByName() {
    MemberService memberService = ac.getBean("memberService", MemberService.class);
    System.out.println("memberService = " + memberService);
    System.out.println("memberService.getClass() = " + memberService.getClass());
}
```
![](https://velog.velcdn.com/images/sgn07124/post/82d69bd2-57fd-401f-a4d3-853e0296f24f/image.png)

AppConfig.java에서 선언한 그대로 출력이 됨

### 빈 이름으로 조회
```java
@Test
@DisplayName("빈 이름으로 조회")
void findBeanByName() {
    MemberService memberService = ac.getBean("memberService", MemberService.class);
    assertThat(memberService).isInstanceOf(MemberServiceImpl.class);
}
```
![](https://velog.velcdn.com/images/sgn07124/post/3b2abd17-9ab1-4772-bf39-90a86e45abd3/image.png)

assertThat 메소드와 isInstanceOf()를 사용하여 memberService가 MemberServiceImpl의 인스턴스인지 검증한다.

### 타입으로만 조회
```java
@Test
@DisplayName("이름 없이 타입으로만 조회")
void findBeanByType() {
    MemberService memberService = ac.getBean(MemberService.class);
    assertThat(memberService).isInstanceOf(MemberServiceImpl.class);
}
```
![](https://velog.velcdn.com/images/sgn07124/post/506be9ed-5947-4d52-9864-dbf86a2edce3/image.png)

### 구체 타입으로 조회
```java
@Test
@DisplayName("구체 타입으로 조회")
void findBeanByName2() {
    MemberService memberService = ac.getBean("memberService", MemberServiceImpl.class);
    //System.out.println("memberService = " + memberService);
    //System.out.println("memberService.getClass() = " + memberService.getClass());
    assertThat(memberService).isInstanceOf(MemberServiceImpl.class);
}
```
![](https://velog.velcdn.com/images/sgn07124/post/1c97ccdb-cacb-4904-a358-4707c6b6a0a0/image.png)

정상적으로 테스트 되지만 역할과 구현을 구분해야하고, 역할에 의존해야하기 때문에 구체 이름으로 조회하는 것은 지향해야 한다. (현재는 구현에 의존)

### 실패 테스트
```java
@Test
@DisplayName("빈 이름으로 조회 X")
void findBeanByNameX() {
    //ac.getBean("xxxxx", MemberService.class);
    assertThrows(NoSuchBeanDefinitionException.class, () -> ac.getBean("xxxxx", MemberService.class));  // -> 오른쪽의 예외가 터져야 성공
}
```    
![](https://velog.velcdn.com/images/sgn07124/post/a9b139f6-c848-48b7-8c87-7c97e6264496/image.png)

Assertions(JUnit)의 assertThrows를 사용하여 람다식에서 오른쪽에 있는게 실행되어 예외가 이루어져야 성공이다.

---

# 스프링 빈 조회 - 동일한 타입이 둘 이상
타입으로 조회시 같은타입의 스프링 빈이 둘 이상이면 오류가 발생하는데 이때는 빈 이름을 지정해야 한다. 그리고 <code>ac.getBeanOfType()</code>으로 해당 타입의 모든 빈을 조회할 수 있다.

### 동일한 타입이 두 개일 때, 스프링 빈을 조회 - 검증
```java
@Test
@DisplayName("타입으로 조회 시 같은 타입이 둘 이상 있으면, 중복 오류가 발생한다.")
void findBeanByTypeDuplicate() {
    //ac.getBean(MemberRepository.class);
    assertThrows(NoUniqueBeanDefinitionException.class,
                () -> ac.getBean(MemberRepository.class));
@Configuration
static class SameBeanConfig {

    @Bean
    public MemberRepository memberRepository1() {
        return new MemoryMemberRepository();
    }

    @Bean
    public MemberRepository memberRepository2() {
        return new MemoryMemberRepository();
    }
}
```

### 빈 이름을 지정하여 중복 오류 발생 피하기
```java
@Test
@DisplayName("타입으로 조회시 같은 타입이 둘 이상 있으면, 빈 이름을 지정하면 된다.")
void findBeanByName() {
    MemberRepository memberRepository = ac.getBean("memberRepository1", MemberRepository.class);
    assertThat(memberRepository).isInstanceOf(MemberRepository.class);
}
```
![](https://velog.velcdn.com/images/sgn07124/post/c8e4a26f-7452-4849-a478-038129f3d0da/image.png)

### 특정 타입 모두 조회하기
```java
@Test
@DisplayName("특정 타입을 모두 조회하기.")
void findAllBeanByType() {
    Map<String, MemberRepository> beansOfType = ac.getBeansOfType(MemberRepository.class);
    for (String key : beansOfType.keySet()) {
        System.out.println("key = " + key + " value = " + beansOfType.get(key));
    }
    System.out.println("beansOfType = " + beansOfType);
    assertThat(beansOfType.size()).isEqualTo(2);
}
```    
![](https://velog.velcdn.com/images/sgn07124/post/e3deadeb-6f8f-4cb4-ab0c-c60195307764/image.png)

---

# 스프링 빈 조회 - 상속 관계
부모 타입으로 조회하면, 자식 타입도 함께 조회된다. 그래서 모든 자바 객체의 최고 부모인 "Object" 타입으로 조회하면 모든 스프링 빈을 조회한다.
![](https://velog.velcdn.com/images/sgn07124/post/9bd7a39e-8c75-4f05-a7a8-5a629d7d0702/image.png)

### 부모 타입으로 조회 시, 자식 둘 이상이 있으면 중복 오류가 발생
```java
public class ApplicationContextExtendsFindTest {

    AnnotationConfigApplicationContext ac = new AnnotationConfigApplicationContext(TestConfig.class);

    @Test
    @DisplayName("부모 타입으로 조회시, 자식이 둘 이상 있으면 중복 오류 발생")
    void findBeanByTypeDuplicate() {
        DiscountPolicy bean = ac.getBean(DiscountPolicy.class);
    }
    
    @Configuration
    static class TestConfig {
        @Bean
        public DiscountPolicy rateDiscountPolicy() {
            return new RateDiscountPolicy();
        }

        @Bean
        public DiscountPolicy fixDiscountPolicy() {
            return new FixDiscountPolicy();
        }
    }
}
```
![](https://velog.velcdn.com/images/sgn07124/post/9e7f9174-d7b8-4135-9b5a-8db2a909e4e4/image.png)

NoUniqueBeanDifinitionException 예외 발생

```java
@Test
@DisplayName("부모 타입으로 조회시, 자식이 둘 이상 있으면 중복 오류 발생")
void findBeanByTypeDuplicate() {
    assertThrows(NoUniqueBeanDefinitionException.class,
                () -> ac.getBean(DiscountPolicy.class));
}
```
예외가 발생하는지 검증하는 코드인 assertThrows를 사용하면 정상으로 테스트가 된다.
![](https://velog.velcdn.com/images/sgn07124/post/6e533a7c-ce96-4365-a725-51019afc9a29/image.png)

### 특정 하위 타입으로 조회
```java
@Test
@DisplayName("특정 하위 타입으로 조회")
void findBeanBySubType() {
    RateDiscountPolicy bean = ac.getBean(RateDiscountPolicy.class);
    assertThat(bean).isInstanceOf(RateDiscountPolicy.class);
}
```
![](https://velog.velcdn.com/images/sgn07124/post/b5628b04-8ee4-4cbb-9b83-50361e339953/image.png)

### 부모 타입으로 모두 조회
```java
@Test
@DisplayName("부모 타입으로 모두 조회하기")
void findAllBeanByParentType() {
    Map<String, DiscountPolicy> beansOfType = ac.getBeansOfType(DiscountPolicy.class);
    assertThat(beansOfType.size()).isEqualTo(2);
    for (String key : beansOfType.keySet()) {
        System.out.println("key = " + key + "value = " + beansOfType.get(key));
    }
}
```
![](https://velog.velcdn.com/images/sgn07124/post/1a02858f-76c9-480e-8464-6b6ae98a0a04/image.png)

### Object를 이용해서 부모 타입으로 모두 조회
```java
@Test
@DisplayName("부모 타입으로 모두 조회하기 - Object")
void findAllBeanByObjectType() {
    Map<String, Object> beansOfType = ac.getBeansOfType(Object.class);
    for (String key : beansOfType.keySet()) {
        System.out.println("key = "  + key + " value = " + beansOfType.get(key));
    }
}
```
![](https://velog.velcdn.com/images/sgn07124/post/97f747e8-d4d2-417e-b053-1d5d9e9d6aed/image.png)

Object.class는 최상위 클래스이므로 스프링에 관한 빈까지 모두 출력이 된다.

---

# BeanFactory와 ApplicationContext
![](https://velog.velcdn.com/images/sgn07124/post/b8d8130c-685f-4645-86be-f1e59def7d49/image.png)

### BeanFactory

스프링 컨테이너의 최상위 인터페이스로 스프링 빈을 관리하고 조회하는 역할을 담당한다.
getBean()을 제공하며 지금까지 사용했던 대부분의 기능은 BeanFactory가 제공하는 기능이다.

### ApplicationContext

![](https://velog.velcdn.com/images/sgn07124/post/c6f04435-756b-4317-8af7-13ca66b32576/image.png)

- BeanFactory의 기능을 상속받아서 제공하며  빈을 관리하고 조회하는 기능은 물론이고, 수 많은 부가 기능이 있다.
- 부가기능
  - MessageSource : 메시지소스를 활용한 국제화 기능
    - 예를 들어서 한국에서 들어오면 한국어로, 영어권에서 들얻오면 영어로 출력한다. 
    - ex) 해외에서 구글을 접속하면 영어로 나오지만 한국에서 구글에 접속하면 한국어로 나온다.
  - EnvironmentCapable : 환경변수
    - 로컬, 개발, 운영 등을 구분해서 처리
  - ApplicationEventPublisher : 애플리케이션 이벤트
    - 이벤트를 발생하고 구독하는 모델을 편리하게 지원
  - ResourceLoader : 편리한 리소스 조회
    - 파일, 클래스 패스, 외부 등에서 리소스를 편리하게 조회
    
### 정리
- ApplicationContext는 BeanFactory 기능을 상속받으며 빈 관리 기능 + 편리한 부가 기능을 제공한다. 
- BeanFactory를 직접 사용하는 일을 거의 없고, 부가 기능이 포함된 ApplicationContext를 사용한다.
- BeanFactory나 ApplicationContext를 스프링 컨테이너라고 한다.

---

# 다양한 설정 형식 지원 - 자바 코드, XML
![](https://velog.velcdn.com/images/sgn07124/post/579a98f9-90db-4366-b461-cd9a5a466875/image.png)

### Annotation 기반 자바 코드 설정
```java
new AnnotationConfigApplicationContext(AppConfig.class)
```
AnnotationConfigApplicationContext 클래스를 사용하면서 자바 코드로 된 설정 정보를 넘기면 된다.

### XML 설정
- 최근에는 스프링 부트를 사용하면서 XML 기반의 설정은 잘 사용하지 않지만 아직 많은 레거시 프로젝트들이 XML로 되어있다.
- XML을 사용하면 컴파일 없이 빈 설정 정보를 변경할 수 있는 장점이 있다.

#### XmlAppContext.java
```java
public class XmlAppContext {

    @Test
    void xmlAppContext() {
        ApplicationContext ac = new GenericXmlApplicationContext("appConfig.xml");
        MemberService memberService = ac.getBean("memberService", MemberService.class);
        assertThat(memberService).isInstanceOf(MemberService.class);
    }
}
```
#### appConfig.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">

    <bean id="memberService" class="hello.core.member.MemberServiceImpl" >
        <constructor-arg name="memberRepository" ref="memberRepository" />
    </bean>

    <bean id="memberRepository" class="hello.core.member.MemoryMemberRepository" />

    <bean id="orderService" class="hello.core.order.OrderServiceImpl">
        <constructor-arg name="memberRepository" ref="memberRepository" />
        <constructor-arg name="discountPolicy" ref="discountPolicy" />
    </bean>

    <bean id="discountPolicy" class="hello.core.discount.RateDiscountPolicy" />
</beans>
```

appconfig.java를 xml로 작성한 것이 appConfig.xml이다.
xml 기반의 설정 정보와 자바 코드 기반의 설정 정보를 비교해보면 거의 비슷한 것을 알 수 있다.
![](https://velog.velcdn.com/images/sgn07124/post/a82a20f7-91be-4ca5-9b70-6792790240ca/image.png)


---

# 스프링 빈 설정 메타 정보 - BeanDefinition
스프링이 다양한 설정 형식을 지원할 수 있었던 것은 BeanDefinition이라는 추상화 덕뿐이다. 이는 역할과 구현을 개념적으로 나눈 것이다
-XML을 읽어서 BeanDefinition을 만들면 된다. 또는 자바 코드를 읽어서 BeanDefinition을 만들면 된다.
- 스프링 컨테이너는 자바 코드인지 XML인지 몰라도 된다. 오직 BeanDefinition만 알면 된다.
- BeanDefinition은 빈 설정 메타 정보라 한다.
- @Bean, bean 태그 당 하나씩 메타 정보가 생성된다.
- 스프링 컨테이너는 이 메타정보를 기반으로 스프링 빈을 생성한다. (BeanDefinition 자체가 인터페이스이다.)
![](https://velog.velcdn.com/images/sgn07124/post/f8dc800a-0dd7-43ff-959e-0cb06cbd378d/image.png)

코드 레벨로 더 깊게 들어가면
![](https://velog.velcdn.com/images/sgn07124/post/4e68fb52-75d6-4505-acd9-280cf58003f8/image.png)




- AnnotationConfigApplicationContext는 AnnotatedBeanDefinitionReader를 사용해서 AppConfig.class를 읽고, BeanDefinition을 생성한다.
![](https://velog.velcdn.com/images/sgn07124/post/9789beff-da6a-4f41-8608-4609c3bb6d97/image.png)
- GenericXmlApplicationContext는 XmlBeanDefinitionReader를 사용해서 appConfig.xml 설정 정보를 읽고 BeanDefinition을 생성한다.
![](https://velog.velcdn.com/images/sgn07124/post/7045c859-f2d8-43ba-bfb4-38791610f8fc/image.png)
- GenericXmlApplicationContext를 사용하면 bean에 대한 정보가 명확하게 나타난다.
- 새로운 형식의 설정 정보가 추가되면, XxxBeanDefinitionReader를 만들어서 BeanDefinition을 생성하면 된다.

---





<br>
<br>



[출처]

인프런 김영한님의 [스프링 기본편](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%ED%95%B5%EC%8B%AC-%EC%9B%90%EB%A6%AC-%EA%B8%B0%EB%B3%B8%ED%8E%B8)을 바탕으로 작성했습니다.