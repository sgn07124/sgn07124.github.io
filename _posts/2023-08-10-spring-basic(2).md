---
# 글 제목
title: 2. 스프링 핵심 원리 이해2
# 간단한 설명
description: 인프런 김영한님의 "스프링 기본편" 강의를 바탕으로 작성했습니다.
# 작성자
author: 
# 작성일자
date: 2023-08-10 13:00:00 +0800
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

# 새로운 할인 정책 개발
악덕 기획자 : 할인 정책을 고정 금액 할인에서 정률 할인 정책으로 서비스 오픈 직전에 바꿈
→  유연한 설계가 가능하도록 객체지향 설계 원칙을 준수함

=> 새로운 정률 할인 정책을 추가하겠다. (RateDiscountPolicy)

![](https://velog.velcdn.com/images/sgn07124/post/c7a74a84-add8-47ad-b2aa-cd22439bb57f/image.png)


### 정률 할인 정책 : RateDiscountPolicy

```java
package hello.core.discount;

import hello.core.member.Grade;
import hello.core.member.Member;

public class RateDiscountPolicy implements DiscountPolicy {

    private int discountPercent = 10;

    @Override
    public int discount(Member member, int price) {
        if (member.getGrade() == Grade.VIP) {
            return price * discountPercent / 100;
        } else {
            return 0;
        }
    }
}
```

#### Test 코드 작성
```java
package hello.core.discount;

import hello.core.member.Grade;
import hello.core.member.Member;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class RateDiscountPolicyTest {

    RateDiscountPolicy discountPolicy = new RateDiscountPolicy();

    @Test
    @DisplayName("VIP는 10% 할인이 적용되어야 한다")
    void vip_o() {
        //given
        Member member = new Member(1L, "memberVIP", Grade.VIP);
        //when
        int discount = discountPolicy.discount(member, 10000);
        //then
        Assertions.assertThat(discount).isEqualTo(1000);
    }

    @Test
    @DisplayName("VIP가 아니면 할인이 적용되지 않아야 한다.")
    void vip_x() {
        //given
        Member member = new Member(2L, "memberBASIC", Grade.BASIC);
        //when
        int discount = discountPolicy.discount(member, 10000);
        //then
        Assertions.assertThat(discount).isEqualTo(1000);  // 1000원이 아니라 0원이 되야 함
    }
}
```
![](https://velog.velcdn.com/images/sgn07124/post/1d84eed1-f200-4d3d-ad70-bd6f641cdd87/image.png)

---

# 새로운 할인 정책과 문제점
할인 정책을 변경하려면 OrderServiceImpl의 코드를 수정해야 한다.
```java
public class OrderServiceImpl implements OrderService {

    private final MemberRepository memberRepository = new MemoryMemberRepository();
    //private final DiscountPolicy discountPolicy = new FixDiscountPolicy();
    private final DiscountPolicy discountPolicy = new RateDiscountPolicy();
```

### 문제점 발견
>- 역할과 구현을 분리 → O
- 다형성 활용 & 인터페이스와 구현 객체를 분리 → O
- OCP, DIP 같은 객체지향 설계 원칙을 충실히 준수 → X (그렇게 보이지만 사실은 아니다.)

DIP
주문서비스 클라이언트(OrderServiceImpl)는 DiscountPolicy 인터페이스에 의존하면서 DIP를 지킨 거 같은데?

→ 클래스 의존 관계를 분석해보면 추상(인터페이스) 뿐만 아니라 구체(구현) 클래스에도 의존하고 있다.
- 추상(인터페이스) 의존 : DiscountPolicy
- 구체(구현) 클래스 : FixDiscountPolicy, RateDiscountPolicy

OCP 
변경하지 않고 확장할 수 있다고 했는데!

→ 지금의 코드는 기능을 확장해서 변경하면, 클라이언트 코드에 영향을 준다. 따라서 OCP를 위반한다.

### 클라이언트 코드를 변경해야되는 이유
#### 기대했던 의존관계
![](https://velog.velcdn.com/images/sgn07124/post/6e586455-1be2-416d-85e3-3128c368ac0d/image.png)

지금까지 단순히 DiscountPolicy 인터페이스만 의존한다고 생각

#### 실제 의존 관계
![](https://velog.velcdn.com/images/sgn07124/post/3b83ecd0-f427-4274-99ec-21e285b238db/image.png)

클라이언트인 OrderServiceImpl이 DiscountPolicy 인터페이스 뿐만 아니라 FixDiscountPolicy인 구체 클래스도 함께 의존 (DIP 위반)

#### 정책 변경
![](https://velog.velcdn.com/images/sgn07124/post/4e68a4a8-b855-4b09-85af-37c965ce5364/image.png)

FixDiscountPolicy를 RateDiscountPolicy로 변경하는 순간
OrderServiceImpl의 소스 코드도 함께 변경해야 한다! (OCP 위반)

### 해결 방법

- 클라이언트 코드인 OrderServiceImpl은 DiscountPolicy의 인터페이스 뿐만 아니라 구체 클래스도 함께 의존한다. 그래서 구체 클래스를 변경할 때 클라이언트 코드도 함께 변경해야 한다.
- DIP 위반 → 추상에만 의존하도록 변경(인터페이스에만 의존)
- DIP를 위반하지 않도록 인터페이스에만 의존하도록 의존관계를 변경

#### 인터페이스에만 의존하도록 설계를 변경
![](https://velog.velcdn.com/images/sgn07124/post/d6364b50-e01d-404a-b5ea-50e8e36e83cc/image.png)

인터페이스에만 의존 (O)

```java
public class OrderServiceImpl implements OrderService {

    private final MemberRepository memberRepository = new MemoryMemberRepository();
    //private final DiscountPolicy discountPolicy = new FixDiscountPolicy();
    //private final DiscountPolicy discountPolicy = new RateDiscountPolicy();
    private DiscountPolicy discountPolicy;  // 인터페이스를 의존
```
그러나 구현체가 없는데 어떻게 코드 실행이 가능할까? 실제 실행을 해보면 discountPolicy에 아무것도 할당되지 않기 때문에 NPE(null pointer exception)이 발생한다.

→ 이 문제를 해결하려면 누군가가 클라이언트인 OrderServiceImpl에 DiscountPolicy의 구현 객체를 대신 생성하고 주입해주어야 한다.

# 관심사의 분리

OrderServiceImpl은 OrderService와 관련된 일만 해야되는데, discount와 관련된 discountPolicy를 선택하는 구체적인 다른 작업까지 현재 하고 있다. 이는 배우가 연기 뿐만 아니라 초빙까지 하는것과 유사하다. 따라서 관심사 분리를 통해 배우는 연기만 해야하고, OrderServiceImpl은 Order와 관련된 일만 해야도록 기획자 즉, 전체 동작 방식을 구성하는 별도의 클래스를 설정해줘야 한다.

### AppConfig
애플리케이션의 전체 동작 방식을 구성(config)하기 위해, 구현 객체를 생성하고, 연결하는 책임을 가지는 별도의 설정 클래스
```java
package hello.core;

public class AppConfig {

    public MemberService memberService() {
        return new MemberServiceImpl(new MemoryMemberRepository());
    }
    
    public OrderService orderService() {
        return new OrderServiceImpl(new MemoryMemberRepository(), new FixDiscountPolicy());
    }
}
```
AppConfig는 애플리케이션의 실제 동작에 필요한 구현 객체를 생성
- MemberServiceImpl
- MemoryMemberRepository
- OrderServiceImpl
- FixDiscountPolicy

AppConfig는 생성한 객체 인스턴스의 참조(레퍼런스)를 생성자를 통해서 주입(연결)
- MemberServiceImpl → MemoryMemberRepository
- OrderServiceImpl → MemoryMemberRepository, FixDiscountPolicy

### MemberServiceImpl - 생성자 주입
```java
package hello.core.member;

public class MemberServiceImpl implements MemberService {

	/**
	* private final MemberRepository memberRepository = new MemoryMemberRepository();
    * new MemoryMemberRepository()를 제거함으로써, MemoryMemberRepository를 의존하지 않도록 변경하였다.
    **/
    private final MemberRepository memberRepository;

    public MemberServiceImpl(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    @Override
    public void join(Member member) {
        memberRepository.save(member);
    }

    @Override
    public Member findMember(Long memberId) {
        return memberRepository.findById(memberId);
    }
}
```
설계 변경으로 MemberServiceImpl은 MemoryMemberRepository를 의존하지 않는다. → 오직 MemberRepository 인터페이스만 의존
- MemberServiceImpl 입장에서 생성자를 통해 어떤 구현 객체가 들어올지(주입될지)는 알 수 없다.
- MemberServiceImpl의 생성자를 통해서 어떤 구현 객체를 주입할지는 오직 외부(AppConfig)에서 결정된다.
- MemberServiceImpl은 이제부터 의존관계에 대한 고민은 외부에 맡기고 실행에만 집중하면 된다.

#### 클래스 다이어그램
![](https://velog.velcdn.com/images/sgn07124/post/25779b3a-887d-4c00-90be-5207737c4907/image.png)

- AppConfig : 객체의 생성과 연결 담당
- DIP 완성 : MemberServiceImpl은 MemberRepository인 추상에만 의존하면 된다. (구체 클레스를 몰라도 된다.)
- 관심사의 분리 : 객체를 생성하고 연결하는 역할과 실행하는 역할이 명확히 분리되었다.

#### 회원 객체 다이어그램
![](https://velog.velcdn.com/images/sgn07124/post/5ac22908-53e8-4508-ba96-43f993e097b6/image.png)

- appConfig 객체는 memoryMemberRepository 객체를 생성하고 그 참조값을 memberServiceImpl을 생성하면서 생성자로 전달한다.
- 클라이언트인 memberServiceImpl 입장에서 보면 의존관계를 마치 외부에서 주입해주는 것 같다고 해서 DI(Dependency Injection) 우리말로 의존관계 주입 또는 의존성 주입이라 한다.

### OrderServiceImpl - 생성자 주입
```java
package hello.core.order;

public class OrderServiceImpl implements OrderService {
    // 객체 생성을 과감하게 지우고 생성자 생성
    private final MemberRepository memberRepository;
    //private final DiscountPolicy discountPolicy = new FixDiscountPolicy();
    //private final DiscountPolicy discountPolicy = new RateDiscountPolicy();
    private final DiscountPolicy discountPolicy;  // 인터페이스를 의존

    public OrderServiceImpl(MemberRepository memberRepository, DiscountPolicy discountPolicy) {  // 생성자
        this.memberRepository = memberRepository;
        this.discountPolicy = discountPolicy;
    }

    @Override
    public Order createOrder(Long memberId, String itemName, int itemPrice) {  // 단일 체계 원칙이 잘 지켜짐
        Member member = memberRepository.findById(memberId);
        int discountPrice = discountPolicy.discount(member, itemPrice);

        return new Order(memberId, itemName, itemPrice, discountPrice);
    }
}
```
설계 변경으로 OrderServiceImpl 은 FixDiscountPolicy를 의존하지 않는다. → 오직 DiscountPolicy 인터페이스만 의존

- OrderServiceImpl 입장에서 생성자를 통해 어떤 구현 객체가 들어올지(주입될지)는 알 수 없다.
- OrderServiceImpl의 생성자를 통해서 어떤 구현 객체을 주입할지는 오직 외부(AppConfig)에서 결정한다.
- OrderServiceImpl은 이제부터 실행에만 집중하면 된다.
- OrderServiceImpl에는 MemoryMemberRepository, FixDiscountPolicy 객체의 의존관계가 주입된다.

생성자 주입으로 추상화에만 의존하게 된다.

### AppConfig 실행

기본의 코드에서 AppConfig를 사용하도록 변경 필요

#### 사용 클래스 - MemberApp
```java
package hello.core;

public class MemberApp {
    public static void main(String[] args) {
        AppConfig appConfig = new AppConfig();
       
        // MemberService memberService = new MemberServiceImpl();
        MemberService memberService = appConfig.memberService(); // 기존의 memberServiceImpl을 appConfig에서 설정하도록 변경
        
        Member member = new Member(1L, "memberA", Grade.VIP);
        memberService.join(member);

        Member findMember = memberService.findMember(1L);
        System.out.println("new member = " + member.getName());
        System.out.println("find member = " + findMember.getName());
    }
}
```

#### 사용 클래스 - OrderApp
```java
package hello.core;

public class OrderApp {
    public static void main(String[] args) {

        AppConfig appConfig = new AppConfig();
        MemberService memberService = appConfig.memberService();
        OrderService orderService = appConfig.orderService();

        //MemberService memberService = new MemberServiceImpl(null);
        //OrderService orderService = new OrderServiceImpl(null, null);

        Long memberId = 1L;  // member을 저장해야되므로
        Member member = new Member(memberId, "memberA", Grade.VIP);
        memberService.join(member);

        Order order = orderService.createOrder(memberId, "itemA", 10000);

        System.out.println("order = " + order);

    }
}
```

#### 테스트 코드 오류 수정

```java
@BeforeEach
    public void beforeEach() {
        AppConfig appConfig = new AppConfig();
        memberService = appConfig.memberService();
    }
```
테스트 코드에서 @BeforeEach는 각 테스트를 실행하지 전에 호출한다.

![](https://velog.velcdn.com/images/sgn07124/post/0440eee9-0273-4853-bc5a-bee660707b5f/image.png)


---

# AppConfig 리팩터링
현재의 AppConfig를 보면 중복이 있고, 역할에 따른 구현이 잘 안 보인다.

### 리팩터링 전
```java
public class AppConfig {

    public MemberService memberService() {
        return new MemberServiceImpl(new MemoryMemberRepository());
    }
 
    public OrderService orderService() {
        return new OrderServiceImpl(
            new MemoryMemberRepository(),
            new FixDiscountPolicy());
    }
 
  }
```

### 리팩터링 후
```java
public class AppConfig {

    public MemberService memberService() {
        return new MemberServiceImpl(memberRepository());
    }

    private static MemoryMemberRepository memberRepository() {
        return new MemoryMemberRepository();  // 추후에 db가 변경되면 이 부분만 수정하면 된다.
    }

    public OrderService orderService() {
        return new OrderServiceImpl(memberRepository(), new FixDiscountPolicy());
    }

    public DiscountPolicy discountPolicy() {
        return new FixDiscountPolicy();
    }
}
````

- <code>new MemoryMemberRepository()</code> 이 부분이 중복 제거 되었다. 이제 <code>MemorymemberRepository</code>를 다른 구현체로 변경할 대 한 부분만 변경하면 된다.
- <code>AppConfig</code>를 보면 역할과 구현 클래스가 한 눈에 들어온다. 애플리케이션 전체 구성이 어떻게 되어있는지 빠르게 파악할 수 있다.

---

# 새로운 구조와 할인 정책 적용
정액 할인 정책을 정률 할인 정책으로 변경하는 것으로 FixDiscountPolicy에서 RateDiscountPolicy로 바꿔야 한다. AppConfig을 생성함으로 애플리케이션이 크게 사용 영역과, 객체를 생성하고 구성하는 영역으로 분리되었다.
![](https://velog.velcdn.com/images/sgn07124/post/8508c876-743a-4f02-9979-603b3ad1db88/image.png)

할인 정책을 바꿀 때, FixDiscountPolicy에서 RateDiscountPolicy로 변경해도 구성 영역만 영향을 받고, 사용 영역은 전혀 영향을 받지 않는다.

### 할인 정책 변경 코드 - AppConfig
```java
package hello.core;

public class AppConfig {

    public MemberService memberService() {
        return new MemberServiceImpl(memberRepository());
    }

    private static MemoryMemberRepository memberRepository() {
        return new MemoryMemberRepository();
    }

    public OrderService orderService() {
        return new OrderServiceImpl(memberRepository(), new FixDiscountPolicy());
    }

    public DiscountPolicy discountPolicy() {
        // return new FixDiscountPolicy();  // 여기만 변경하면 된다.
        return new RateDiscountPolicy();
    }
}
```
- AppConfig에서 할인 정책을 담당하는 구현을 FixDiscountPolicy에서 RateDiscountPolicy로 변경했다.
- 이제 할인 정책을 변경해도 구성 영역의 코드만 변경하면 되고, 사용 영역의 코드는 전혀 손댈 필요가 없다.
- 구성 영역은 당연히 변경되며 구성 역할을 담당하는 AppConfig를 애플리케이션이라는 공연의 기획자로 생각하자. 공연 기획자는 공연 참여자인 구현 객체들을 모두 알아야 한다.
- 현재 할인 정책을 FixDiscountPolicy에서 RateDiscountPolicy로 바꿨는데 DIP와 OCP 모두 지켜졌다.

--- 

# 전체 흐름 정리
- 새로운 할인 정책 개발
  - 다형성 덕분에 새로운 정률 할인 정책 코드를 추가로 개발하는 것 자체는 아무 문제가 없음
- 새로운 할인 정책 적용과 문제점
  - 새로 개발한 정률 할인 정책을 적용하려고 하니 클라이언트 코드인 주문 서비스 구현체도 함께 변경해야 함 → OCP 위반
  - 주문 서비스 클라이언트가 인터페이스인 DiscountPolicy 뿐만 아니라, 구체 클래스인 FixDiscountPolicy도 함께 의존 → DIP 위반 (추상화에만 의존해야되는데 구체화까지 의존하고 있음)
- 관심사의 분리
  - 기존에는 클라이언트가 의존한는 서버 구현 객체를 직접 생성하고, 실행함
    - 너무 다양한 책임자가 존재함
  - 책임을 분리하기 위해 AppConfig가 등장함
    - AppConfig는 애플리케이션의 전체 동작 방식을 구성(config)하기 위해, 구성 객체를 생성하고, 연결하는 책임
  - 이제부터 클라이언트 객체는 자신의 역할을 실행하는 것에만 집중하고, 권한이 줄어든다(책임이 명확해짐)
- AppConfig 리팩터링
  - 구성 정보에서 역할과 구현을 명확하게 분리
  - 역할이 잘 들어남
  - 중복 제거
- 새로운 구조오 할인 정책 적용
  - 정액 할인 정책 → 정률 할인 정책
  - AppConfig의 등장으로 애플리케이션이 크게 사용 영역과 구성 영역으로 변경됨
  - 할인 정책을 변경해도 AppConfig가 있는 구성 영역만 변경하면 됨, 사용 영역은 변경할 필요가 없음. 물론 클라이언트 코드인 주문 서비스 코드도 변경하지 않음
  
--- 

# 좋은 객체 지향 설계의 5가지 원칙의 적용
현재까지 여기서는 SRP, DIP, OCP가 적용되었다.

### SRP  단일 책임 원칙
한 클래스는 하나의 책임만 가져야 한다.
- 클라이언트 객체는 직접 구현 객체를 생성하고, 연결하고, 실행하는 다양한 책임을 가지고 있었는데 SRP 단일 책임 원칙을 따르면서 관심사를 분리함
- 구현 객체를 생성하고 연결하는 책임은 AppConfig가 담당했고, 클라이언트 객체는 실행하는 책임만 담당했다.

### DIP 의존관계 역전 원칙
프로그래머는 "추상화에 의존해야지, 구체화에 의존하면 안된다." 의존성 주입은 이 원칙을 따르는 방법 중 하나다.
- 새로운 할인 정책을 개발하고, 적용하려고 하니 클라이언트 코드도 함께 변경해야 한다. 왜냐하면 기존 클라이언트 코드(OrderServiceImpl)는 DIP를 지키며 DiscountPolicy 추상화 인터페이스에 의존하는 것 같았지만, FixDiscountPolicy 구체화 구현클래스에도 함께 의존했다. → 잘못된 그림이었다!!!
- 클라이언트 코드가 DiscountPolicy 추상화 인터페이스에만 의존하도록 코드를 변경했는데 null point exception이 떴으며 클라이언트 코드는 인터페이스만으로 아무것도 실행할 수 없다.
- AppConfig가 FixDiscountPolicy 객체 인스턴스를 클라이언트 코드 대신 생성해서 클라이언트 코드에 의존관계를 주입했다. 이렇게해서 DIP 원칙을 따르면서 문제도 해결했다.

### OCP
소프트웨어 요소는 확장에는 열려있으나 변경에는 닫혀 있어야 한다.
- 다형성 사용하고 클라이언트가 DIP를 지킴
- 애프릴케이션을 사용 영역과 구성 영역으로 나눔
- AppConfig가 의존관계를 FixDiscountPolicy에서 RateDiscountPolicy로 변경해서 클라이언트 코드에 주입하므로 클라이언트 코드는 변경하지 않아도 됬다.
- 소프트웨어 요소를 새롭게 확장해도 사용 영역의 변경은 닫혀 있다!!!

# IoC, DI 그리고 컨테이너
### 제어의 역전 IoC (Inversion of Control)
기존 프로그램은 클라이언트 구현 객체가 스스로 필요한 서버 구현 객체를 생성하고, 연결하고, 실행했다.
(구현 객체가 프로그램의 제어 흐름을 스스로 조종. 개발자 입장에서는 자연스러운 흐름)

반면에 AppConfig가 등장한 이후에 구현 객체는 자신의 로직을 실행하는 역할만 담당한다.
따라서 프로그램의 제어 흐름은 AppConfig가 가져가게 된다.

ex) OrderServiceImpl 은 필요한 인터페이스들을 호출하지만 어떤 구현 객체들이 실행될지 모른다. 프로그램에 대한 제어 흐름에 대한 권한은 모두 AppConfig가 가지고 있다.
OrderServiceImpl도 AppConfig가 생성하고, AppConfig는 OrderServiceImpl이 아닌 OrderService 인터페이스의 다른 구현 객체를 생성하고 실행할 수도 있다.

OrderServiceImpl은 이 사실을 모르고 단지 자신의 로직만 실행!

>프로그램의 제어 흐름을 직접 제어하는 것이 아니라 외부에서 관리하는 것을 제어의 역전(IoC)라고 한다.

#### 프레임워크 vs 라이브러리
- 내가 작성한 코드를 제어하고, 대신 실행 → 프레임워크(JUnit)
- 내가 작성한 코드가 직접 제어 흐름을 담당 → 라이브러리

### 의존관계 주입 DI (Dependency Infection)
OrderServiceImpl은 DiscountPolicy 인터페이스에 의존, 실제 어떤 구현 객체가 사용될지는 모른다. 정적인 클래스 의존 관계와, 실행 시점에 결정되는 동적인 객체(인스턴스) 의존 관계 두 가지를 분리해서 생각해야 한다.

>애플리케이션 실행 시점(런타임)에 외부에서 실제 구현 객체를 생성하고 클라이언트에 전달해서 클라이언 트와 서버의 실제 의존관계가 연결 되는 것을 의존관계 주입이라 한다.

#### 정적인 클래스 의존관계
- 클래스가 사용하는 import 코드만 보고 의존관계를 쉽게 판단할 수 있다.
- 정적인 의존관계는 애플리케이션을 실행하지 않아도 분석할 수 있다.
- 클래스 다이어그램을 보면 OrderServiceImpl은 MemberRepository, DiscountPolicy에 의존한다는 것을 알 수 있다. 그러나 이러한 클래스 의존관계 만으로는 실제 어떤 객체가 OrderServiceImpl에 주입 될지 알 수 없다.
![](https://velog.velcdn.com/images/sgn07124/post/a0c6ea05-e98b-4684-8e37-02065ef90091/image.png)

#### 동적인 객체 인스턴스 의존관계
애플리케이션 실행 시점에 실제 생성된 객체 인스턴스의 참조가 연결된 의존 관계다.

![](https://velog.velcdn.com/images/sgn07124/post/f861e51c-461d-4714-ac3f-8cea36c8d750/image.png)

- 객체 인스턴스를 생성하고, 그 참조값을 전달해서 연결된다.
- 의존관계 주입을 사용하면 클라이언트 코드를 변경하지 않고, 클라이언트가 호출하는 대상의 타입 인스턴스 를 변경할 수 있다.
- 의존관계 주입을 사용하면 정적인 클래스 의존관계를 변경하지 않고, 동적인 객체 인스턴스 의존관계를 쉽 게 변경할 수 있다.

### IoC 컨테이너, DI 컨테이너
>IoC(DI) 컨테이너 : AppConfig 처럼 객체를 생성하고 관리하면서 의존관계를 연결해주는 것

- 의존관계 주입에 초점을 맞추어 최근에는 주로 DI 컨테이너라고 한다.
- 또는 어샘블러, 오브젝트 팩토리 등으로 불리기도 한다.

---

# 스프링으로 전환하기
### AppConfig 스프링 기반으로 변경
AppCofig에 설정을 구성한다는 뜻의 @Configuration을 붙여주고, 각 메서드에 @Bean을 붙여주어 스프링 컨테이너에 스프링 빈으로 등록한다.
```java
package hello.core;

@Configuration
public class AppConfig {

    @Bean
    public MemberService memberService() {
        return new MemberServiceImpl(memberRepository());
    }

    @Bean
    public static MemoryMemberRepository memberRepository() {
        return new MemoryMemberRepository();
    }

    @Bean
    public OrderService orderService() {
        return new OrderServiceImpl(memberRepository(), new FixDiscountPolicy());
    }

    @Bean
    public DiscountPolicy discountPolicy() {
        // return new FixDiscountPolicy();  // 여기만 변경하면 된다.
        return new RateDiscountPolicy();
    }
}
```

### MemberApp에 스프링 컨테이너 적용
```java
package hello.core;

public class MemberApp {
    public static void main(String[] args) {
        //AppConfig appConfig = new AppConfig();
        //MemberService memberService = appConfig.memberService(); // memberService에는 memberServiceImpl이 들어감
        // MemberService memberService = new MemberServiceImpl();

        ApplicationContext applicationContext = new AnnotationConfigApplicationContext(AppConfig.class);  // ApplicationContext가 스프링의 모든것을 관리해준다.
        MemberService memberService = applicationContext.getBean("memberService", MemberService.class);

        Member member = new Member(1L, "memberA", Grade.VIP);  // 새로운 회원
        memberService.join(member);  // 새로운 회원인 memberA를 가입시킴

        Member findMember = memberService.findMember(1L);  // id가 1L인 회원을 find
        System.out.println("new member = " + member.getName());
        System.out.println("find member = " + findMember.getName());
    }
}
```
![](https://velog.velcdn.com/images/sgn07124/post/411f1575-7225-4e7c-8567-abdfe09b8f37/image.png)


### OrderApp에 스프링 컨테이너 적용
```java
package hello.core;

public class OrderApp {
    public static void main(String[] args) {

        //AppConfig appConfig = new AppConfig();
        //MemberService memberService = appConfig.memberService();
        //OrderService orderService = appConfig.orderService();

        ApplicationContext applicationContext = new AnnotationConfigApplicationContext(AppConfig.class);
        MemberService memberService = applicationContext.getBean("memberService", MemberService.class);
        OrderService orderService = applicationContext.getBean("orderService", OrderService.class);

        //MemberService memberService = new MemberServiceImpl(null);
        //OrderService orderService = new OrderServiceImpl(null, null);

        Long memberId = 1L;  // member을 저장해야되므로
        Member member = new Member(memberId, "memberA", Grade.VIP);
        memberService.join(member);

        Order order = orderService.createOrder(memberId, "itemA", 20000);

        System.out.println("order = " + order);

    }
}
```
![](https://velog.velcdn.com/images/sgn07124/post/18bee0f8-2d73-4c81-9814-193eb5425610/image.png)



### 스프링 컨테이너
- ApplicationContext를 스프링 컨테이너라 한다.
- 기존에는 개발자가 AppConfig 를 사용해서 직접 객체를 생성하고 DI를 했지만, 이제부터는 스프링 컨테이너를 통해서 사용한다.
- 스프링 컨테이너는 @Configuration이 붙은 AppConfig를 설정(구성) 정보로 사용한다. 여기서 @Bean이라 적힌 메서드를 모두 호출해서 반환된 객체를 스프링 컨테이너에 등록한다. 이렇게 스프링 컨테이너에 등록된 객체를 스프링 빈이라 한다.
스프링 빈은 @Bean이 붙은 메서드의 명을 스프링 빈의 이름으로 사용한다. (memberService, orderService)
- 이전에는 개발자가 필요한 객체를 AppConfig 를 사용해서 직접 조회했지만, 이제부터는 스프링 컨테이너를 통해서 필요한 스프링 빈(객체)를 찾아야 한다. 스프링 빈은 applicationContext.getBean() 메서드를 사용해서 찾을 수 있다.
- 기존에는 개발자가 직접 자바코드로 모든 것을 했다면 이제부터는 스프링 컨테이너에 객체를 스프링 빈으로 등록하고, 스프링 컨테이너에서 스프링 빈을 찾아서 사용하도록 변경되었다.

<br>
<br>

---

[출처]

[3 객체 지향 원리 적용](https://velog.io/@ziiyouth/스프링-기본-3-객체-지향-원리-적용-2#ioc-di-그리고-컨테이너)

인프런 김영한님의 [스프링 기본편](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%ED%95%B5%EC%8B%AC-%EC%9B%90%EB%A6%AC-%EA%B8%B0%EB%B3%B8%ED%8E%B8)을 바탕으로 작성했습니다.