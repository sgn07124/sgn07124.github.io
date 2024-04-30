---
# 글 제목
title: 4. 스프링 빈과 의존관계
# 간단한 설명
description: 인프런 김영한님의 "스프링 입문" 강의를 바탕으로 작성했습니다.
# 작성자
author: 
# 작성일자
date: 2023-08-06 13:00:00 +0800
# 카테고리 대주제 > 소주제
categories: [강의정리, 스프링 입문 - 코드로 배우는 스프링 부트, 웹 MVC, DB 접근 기술]
# 태그
tags: [spring, spring-introduction]
# 메인화면에 고정
pin: false
# 웹페이지의 성능적인 이유에서 mathematical 기능은 기본적으로 꺼져있음.
math: true
# 표 생성 도구로 true로 설정 시, ```mermaid 를 사용할 수 있다.
mermaid: false

---

# 1. 컴포넌트 스캔과 자동 의존관계 설정

## 로직

### MemberController
![](https://velog.velcdn.com/images/sgn07124/post/1c9021d5-3b5d-49d8-89e5-b7e2e8ca37d3/image.png)

<code>MemberService</code> 기능을 사용하기 위해 객체 생성 대신 생성자를 이용해 연결한다. -> 생성자에 @Autowired을 붙여준다.
스프링 컨테이너가 생성될 때, @Controller로 등록된 <code>MemberController</code> 객체를 생성해 스프링 빈으로 컨테이너에 등록한다.

<code>memberService</code> 생성 → 스프링 컨테이너에서 @Controller 확인 후, 스프링 컨테이너에 등록하면서 생성자 호출 → @Autowired가 있는지 확인해서 <code>memberController</code>가 <code>memberService</code>를 필요로 한다는 사실을 확인한다. → 컨테이너에 있는 <code>memberService</code>를 넣어준다.

![](https://velog.velcdn.com/images/sgn07124/post/d947bcdb-43a2-41e7-b8a5-3cf5ecbc5bb8/image.png)


<code>MemberService</code>의 @Service와 <code>MemoryMemberRepository</code>의 @Repository 간에도 같은 과정을 반복한다.

### MemberService
![](https://velog.velcdn.com/images/sgn07124/post/b04d5c55-44dd-40bf-b4e5-ace45c4e60d9/image.png)

### MemoryMemberRepository
![](https://velog.velcdn.com/images/sgn07124/post/3dc59023-3642-4e99-a4ab-545fa4638f5c/image.png)


## annotation

### @Controller
controller를 스프링 빈으로 등록하기 위해 사용한다.

### @Autowired(연관관계)
생성자에 @Autowired를 사용하면 <code>memberService</code>를 스프링이 스프링 컨테이너에 있는 연관된 객체를 찾아서 연결해준다. @Autowired를 그냥 추가해주면 오류가 발생하므로 회원 서비스<code>memberService</code>에는 @Service를 붙여주고 회원 저장소의 구현체인 <code>MemoryMemberRepository</code>에는 @Repository를 붙여줘야 한다.
객체 의존관계를 외부에서 넣어주는 것을 DI(Dependency Injection:의존성 주입)이라고 한다.

### @Service
스프링에서 서비스를 지정하는 어노테이션으로 비즈니스 로직을 수행하는 서비스 레이어 클래스이다. 

### @Repository


# 2. 자바 코드로 직접 스프링 빈 등록하기
이전의 방법은 어노테이션을 사용하여 스프링 빈에 등록하는 방식이지만 이번 장식은 자바 코드로 직접 스프링 빈을 등록하는 방법이다.

<code>MemberController</code>의 @Controller와 @AutoWired을 제외한 <code>MemberService</code>와 <code>MemoryMemberRepository</code>의 @Service, @Repository, @Autowired 어노테이션은 지우고 시작한다.

<code>hello/hellospring</code>에 <code>SpringConfig</code>를 생성한다.

## SpringConfig.java
![](https://velog.velcdn.com/images/sgn07124/post/abc1af43-37d3-4bc4-b878-52b1dac312e0/image.png)

MemberController -> memberService -> memberRepository 관계

## 이걸 사용하는 이유?
나중에 데이터베이스가 정해졌을 때, 데이터베이스를 바꿔야한다. 이 경우 다른 코드를 변경할 필요 없이 위 코드의 두 번째 @Bean의 코드를 아래처럼만 바꿔주면 간단하게 데이터베이스를 교체할 수 있다.
```java
@Bean
public MemberRepository memberRepository() {
	return new DBMemberRepository();  // 이 부분을 정해진 DB로 바꿔주기만 하면 됨
}
```

# 3. DI의 3가지 주입 방식
DI에는 필드 주입, setter 주입, 생성자 주입 이렇게 3가지 방법이 있다. 
## 1. 필드 주입
```java
@Controller
public class MemberController {
	@Autowired private MemberService memberService;
}
```
이 방식은 스프링이 올라갈 때, Spring Bean이 연결되는 작업 외에 다른 작업을 할 수 없다.
## 2. setter 주입
```java
@Controller
public class MemberController {
	private MemberService memberService;
    
    @Autowired
    public MemberController(MemberService memberService) {
    	this.memberService = memberService;
    }
}
```
객체 생성이 된 후에 setter가 호출되어 Di가 일어난다. 의존 관계가 실행 중에 동적으로 변하는 경우는 거의 없기 때문에 호출된 이후로 다시 호출될 일이 없다. setter가 public으로 열려 있어 <code>memberService.setMemberRepository()</code>를 아무 개발자나 접근하여 변경할 수 있기 때문에 좋은 방식이 아니다.

## 3. 생성자 주입
```java
@Controller
public class MemberController
{
    private MemberService memberService;

    @Autowired
    public MemberController(MemberService memberService)
    {
        this.memberService = memberService;
    }
}
```
의존관계가 실행 중에 동적으로 변하는 경우는 거의 없으므로 생성자 주입 방식을 권장한다.


<br>
<br>

---

[출처]

[컴포넌트 스캔과 자동 의존관계 설정](https://velog.io/@dydqja4582/10.-컴포넌트-스캔과-자동-의존관계-설정)<br><br>
인프런 김영한님의 [스프링 입문 - 코드로 배우는 스프링 부트, 웹 MVC, DB 접근 기술](https://www.inflearn.com/course/스프링-입문-스프링부트)을 바탕으로 작성했습니다.