---
# 글 제목
title: 1. 스프링 핵심 원리 이해1
# 간단한 설명
description: 인프런 김영한님의 "스프링 기본편" 강의를 바탕으로 작성했습니다.
# 작성자
author: 
# 작성일자
date: 2023-08-09 13:00:00 +0800
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

# 비즈니스 요구사항과 설계

- 회원 : 가입/조회, 등급, 자체 DB 구축
- 주문과 할인 정책 : 할인 정책 차등 적용, 변경 가능성 높음

회원 데이터와 할인 정책 같은 부분은 지금 결정하기 어려움 → 객체지향 설계 방법 적용
> 인터페이스를 만들고 구현체를 언제든지 갈아끼우는 방법

---

# 회원 도메인 설계

### 회원 도메인 요구 사항

- 회원 가입/조회
- 회원 등급 분류 (일반/VIP)
- 데이터 자체 DB 구축, 외부 시스템 연동

### 회원 도메인 협력 관계
![](https://velog.velcdn.com/images/sgn07124/post/8d19e0f1-7b52-4e0c-b5fa-71ffed03d798/image.png)

### 회원 클래스 다이어그램
![](https://velog.velcdn.com/images/sgn07124/post/1a3fcf9a-cbb1-4c03-9e25-ac93b8a3e674/image.png)

실제 서버를 실행하지 않고 클래스들만 볼 수 있음

### 회원 객체 다이어그램
![](https://velog.velcdn.com/images/sgn07124/post/0f4bfe11-5aac-44a1-be9d-2326506d7878/image.png)

객체 간의 메모리 참조가 어떻게 되는지 그린 것으로 실제 View한 인스턴스끼리의 참조
회원 서비스 : MemberServiceImpl
메모리 회원 저장소 : MemoryMemberRepository

---

# 회원 도메인 개발
![](https://velog.velcdn.com/images/sgn07124/post/bc3938a7-3d4d-4a98-a1a9-b2095bdf5aea/image.png)

`src/main/java/hello.core/member`에 회원 등급, 회원 엔티티, 회원 서비스 interface, 회원 서비스 구현체, 회원 저장소 interface, 회원 저장소 구현체를 만든다.



---

# 회원 도메인 실행과 테스트
회원 객체 다이어그램에서 실제 서버가 동작 할 때, 클라이언트가 회원 서비스(MemberServiceImpl)을 사용하게 되고, 실제 회원 서비스는 메모리 회원 저장소를 사용하게 된다.


애플리케이션 로직을 통한 테스트는 좋지 않기 때문에 JUnit을 사용한다.

### 회원 도메인 : test

```java
package hello.core.member;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;

public class MemberServiceTest {

    MemberService memberService = new MemberServiceImpl();

    @Test
    void join() {
        //given
        Member member = new Member(1L, "memberA", Grade.VIP);  

        //when
        memberService.join(member);  // 가입
        Member findMember = memberService.findMember(1L);  // id로 검색

        //then
        Assertions.assertThat(member).isEqualTo(findMember);  // 가입한 member가 id로 검색한 findMember와 동일한지 확인
    }
}
```
만약에 findMember가 2L이면 equal하지 않으므로 에러 발생!

>테스트를 잘 작성하는게 매우 중요함❗️

### 회원 도메인 설계의 문제점

- 다른 저장소로 변경 시 OCP 원칙 지켜지지 않는다.
- DIP가 잘 지켜지지 않는다.
- 의존관계가 인터페이스와 구현 두 가지에 모두 의존

![](https://velog.velcdn.com/images/sgn07124/post/c78af9fe-341d-44d5-bed4-665b57f3d7d4/image.png)

추상화(MemberRepository memberRepository)와 구체화(new MemoryMemberRepository()) 모두 의존하고 있다.

---

# 주문과 할인 도메인 설계

### 주문과 할인 정책
- 회원 등급에 따라 할인 등급 차등
- 할인 정책 변경 가능성 높음

### 주문 도메인 협력, 역할, 책임
![](https://velog.velcdn.com/images/sgn07124/post/b18fd606-c5f1-4e07-bd6f-877b80170706/image.png)

1. 주문 생성 : 클라이언트는 주문 서비스에 주문 생성을 요구한다.
2. 회원 조회 : 할인을 위해서는 회원 등급이 필요하다. 그래서 주문 서비스는 회원 저장소에서 회원을 조회한다.
3. 할인 적용 : 주문 서비스는 회원 등급에 따른 할인 여부를 할인 정책에 위임한다.
5. 주문 결과 반환 : 주문 서비스는 할인 결과를 포함한 주문 결과를 반환한다.

### 주문 도메인 전체 - 역할과 구현 모두 적용
![](https://velog.velcdn.com/images/sgn07124/post/d414cfe8-8fbd-43bb-92ab-2142d885bcdc/image.png)

역할과 구현을 분리했기 때문에 자유롭게 구현 객체를 조립할 수 있게 설계되어 회원 저장소(메모리 회원 저장소, DB 회원 저장소), 할인 정책(정액 할인 정책, 정률 할인 정책) 등을 유연하게 변경할 수 있다.

### 주문 도메인 클래스 다이어그램
![](https://velog.velcdn.com/images/sgn07124/post/21289276-d828-4ea3-a10c-647e186dae77/image.png)

### 주문 도메인 다이어그램1
![](https://velog.velcdn.com/images/sgn07124/post/533bac1b-5784-4a43-ba94-ebeef6368c57/image.png)

회원을 메모리에서 조회하고, 정액 할인 정책을 지원해도 주문 서비스를 변경하지 않아도 된다.역할들의 협력 관계를 그대로 재사용 할 수 있다.

### 주문 도메인 다이어그램2
![](https://velog.velcdn.com/images/sgn07124/post/aa55479e-4a1a-41c7-b559-6b79e8bfb8dd/image.png)

회원을 메모리가 아닌 DB에서 조회하고, 정률 할인 정책을 지원해도 주문 서비스를 변경하지 않아도 된다. 협력 관계를 그대로 재사용 할 수 있다.

---

# 주문과 할인 도메인 개발

### 할인 정책 인터페이스 : DiscountPolicy
```java
package hello.core.discount;

import hello.core.member.Member;

public interface DiscountPolicy {
    
    /* @return 할인 대상 금액 */
    int discount(Member member, int price);
}
```

### 정액 할인 정책 구현체 : FixDiscountPolicy
```java
package hello.core.discount;

import hello.core.member.Grade;
import hello.core.member.Member;

public class FixDiscountPolicy implements DiscountPolicy {
    
    private int discountFixAmount = 1000;  // 1000원 할인
    
    @Override
    public int discount(Member member, int price) {
        if (member.getGrade() == Grade.VIP) {  // enum 타입은 == 사용해야 됨 
            return discountFixAmount;  // 1000원 할인
        } else {
            return 0;  // 할인 x
        }
    }
}
```

### 주문 엔티티 : Order
```java
package hello.core.order;

public class Order {

    private Long memberId;  // 회원 id
    private String itemName;  // 제품 이름
    private int itemPrice;  // 제품 가격
    private int discountPrice;  // 할인 가격

    public Order(Long memberId, String itemName, int itemPrice, int discountPrice) {  // 생성자 생성
        this.memberId = memberId;
        this.itemName = itemName;
        this.itemPrice = itemPrice;
        this.discountPrice = discountPrice;
    }

    /* 비즈니스 개산 로직 */
    public int calculatePrice() {
        return itemPrice - discountPrice;  // 최종 결과
    }

    public Long getMemberId() {
        return memberId;
    }

    public void setMemberId(Long memberId) {
        this.memberId = memberId;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public int getItemPrice() {
        return itemPrice;
    }

    public void setItemPrice(int itemPrice) {
        this.itemPrice = itemPrice;
    }

    public int getDiscountPrice() {
        return discountPrice;
    }

    public void setDiscountPrice(int discountPrice) {
        this.discountPrice = discountPrice;
    }

    @Override
    public String toString() {
        return "Order{" +
                "memberId=" + memberId +
                ", itemName='" + itemName + '\'' +
                ", itemPrice=" + itemPrice +
                ", discountPrice=" + discountPrice +
                '}';
    }
}
```
생성자, getter & setter, toString()을 (control+Enter)로 생성한다.

### 주문 서비스 인터페이스 : OrderService
```java
package hello.core.order;

public interface OrderService {
    Order createOrder(Long memberId, String itemName, int itemPrice);
}
```

4번의 주문 결과(회원id, 상품명, 상품 가격)를 반환한다.

### 주문 서비스 구현체 : OrderServiceImpl
```java
package hello.core.order;

public class OrderServiceImpl implements OrderService {

    private final MemberRepository memberRepository = new MemoryMemberRepository();
    private final DiscountPolicy discountPolicy = new FixDiscountPolicy();

    @Override
    public Order createOrder(Long memberId, String itemName, int itemPrice) {  // 단일 체계 원칙이 잘 지켜짐
        Member member = memberRepository.findById(memberId);
        int discountPrice = discountPolicy.discount(member, itemPrice);
        
        return new Order(memberId, itemName, itemPrice, discountPrice);
    }
}
```
- 주문 생성 요청 → 회원 정보 조회 → 할인 정책 적용 → 주문 객체를 생성 후 반환
- 메모리 회원 리포지토리와, 고정 금액 할인 정책을 구현체로 생성
- @override 부분에서 단일 체계 원칙이 잘 지켜짐 → OrderService는 할인에 대한 정보는 전혀 모르고 결과만 알려주기 때문 (할인 정책을 수정할 때, OrderService는 건드리지 않아도 됨)

---

# 주문과 할인 도메인 실행과 테스트

### 주문과 할인 정책 실행 - test
```java
package hello.core.order;

public class OrderServiceTest {

    MemberService memberService = new MemberServiceImpl();
    OrderService orderService = new OrderServiceImpl();

    @Test
    void createOrder() {
        Long memberId = 1L;
        Member member = new Member(memberId, "memberA", Grade.VIP);
        memberService.join(member);

        Order order = orderService.createOrder(memberId, "itemA", 10000);
        Assertions.assertThat(order.getDiscountPrice()).isEqualTo(1000);
    }
}
```
![](https://velog.velcdn.com/images/sgn07124/post/05559edd-e6ab-4b80-86c3-0b134f697232/image.png)

자바 단일 테스트(순수 자바 코드)를 하는게 중요



<br>
<br>

[출처]

[스프링 기본 2 객체 지향 원리 적용](https://velog.io/@ziiyouth/스프링-기본-2-객체-지향-원리-적용)

인프런 김영한님의 [스프링 기본편](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81-%ED%95%B5%EC%8B%AC-%EC%9B%90%EB%A6%AC-%EA%B8%B0%EB%B3%B8%ED%8E%B8)을 바탕으로 작성했습니다.