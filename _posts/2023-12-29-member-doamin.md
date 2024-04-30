---
# 글 제목
title: 4. 회원 도메인 개발
# 간단한 설명
description: 인프런 김영한님의 "실전! 스프링 부트와 JPA 활용1 - 웹 애플리케이션 개발" 강의를 바탕으로 작성했습니다.
# 작성자
author: 
# 작성일자
date: 2023-12-29 13:00:00 +0800
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

# 1. 회원 레포지토리 개발

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/7a7b3090-df52-4a41-9b25-5773819baa99/6f20b270-b909-4715-9d55-0504549e050a/Untitled.png)

`result`에 커서 올리고 `option + command + n`을 누르면 아래와 같이 한 줄로 정리된다.

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/7a7b3090-df52-4a41-9b25-5773819baa99/4b74101a-a9f6-49fc-862c-bcf74b39095a/Untitled.png)

```java
@Repository  // 컴포넌트 스캔으로 자동으로 스프링에서 스프링 빈으로 관리
public class MemberRepository {

    @PersistenceContext  // 엔티티 매니저를 스프링이 생성한 엔티티 매니저에 주입을 해준다.
    private EntityManager em;  // entity manager 생성

		// 저장 로직
    public void save(Member member) {
        em.persist(member);  // jpa가 member 객체를 저장
    }  // 영속성 컨텍스트에 객체를 주입(insert 쿼리 생성)

    public Member findOne(Long id) {
        return em.find(Member.class, id);  // 단건 조회(id는 PK)
    }  // member를 찾아서 반환

    public List<Member> findAll() {
        return em.createQuery("select m from Member m", Member.class)
						.getResultList();  // jpa 쿼리 작성 = jpql (sql과는 다르지만 기능적으로는 동일)
				// sql은 테이블 중심으로 처리하지만, jpql은 객체 중심으로 처리
				// Member.class는 반환 타입
			  // getResultList()로 멤버를 리스트로 만들어준다. 
}

    public List<Member> findByName(String name) {
        return em.createQuery("select m from Member m where m.name = :name", Member.class)
                .setParameter("name", name).getResultList();
    }  // 파라미터 바인딩을 통해 특정 이름을 가진 객체를 가져온다.
}
```

# 2. 회원 서비스 개발

```java
@Service  // 컴포넌트 스캔으로 스프링 빈에 등록
@Transactional(readOnly = true)  // 트랜젝션 처리가 가능하기 위해 어노테이션 추가
@RequiredArgsConstructor  // lombok에서 생성자 자동 생성
public class MemberService {

    // 생성자 인젝션 시
    private final MemberRepository memberRepository;

    // 회원 가입
    @Transactional  // 쓰기 -> readonly = false(default)
    public Long join(Member member) {
        validateDuplidateMember(member);  // 중복 회원 검증
        memberRepository.save(member);
        return member.getId();
    }

    private void validateDuplidateMember(Member member) {
				// 문제가 있으면 예외 터뜨리고, 문제 없으면 넘어가서 정상적으로 save하고 id 반환
        List<Member> findMembers = memberRepository.findByName(member.getName());
				// 매개변수에 들어온 member 객체가 findMember에 존재하면 중복된 회원이므로 에러 메시지 출력
        if (!findMembers.isEmpty()) {
            throw new IllegalStateException("이미 존재하는 회원입니다.");
        }
    }

    // 회원 전체 조회
    //@Transactional(readOnly = true)  // 조회하는 성능을 최적화(읽기 전용)
    public List<Member> findMembers() {
        return memberRepository.findAll();
    }
    //@Transactional(readOnly = true)
    public Member findOne(Long memberId) {
        return memberRepository.findOne(memberId);
    }
}
```

모든 데이터 변경은 트랜젝션 안에서 수행되어야 하기 때문에 일반적으로 직접 비즈니스 로직을 사용하는 서비스에 `@Transactional` 어노테이션을 걸어준다.(각 메소드의 결과가 성공 → commit, 런타임 예외 발생 → rollback)

또한, 트랜젝션에서 `readOnly=true` 옵션을 사용하면 영속선 컨텍스트를 `flush` 하지 않아서 약간의 성능 향상이 있다. 읽기 전용 메소드에서 사용하면 좋다. → `@Transactional(readOnly=true)`를 글로벌하게 사용하고 데이터를 write하는 메소드에는 따로 `@Transactional(readOnly=false)`를 붙여준다.(`readOnly`는 default가 `false`이기 때문에 `readOnly`는 생략해도 된다.)

## 스프링 필드를 주입하는 방법

### 1) 필드 주입

```java
public class MemberService {
	@Autowired
	MemberRepository memberRepository;
	...
}
```

`@Autowired`를 사용하여, `memberRepository`와 `memberService` 필드간의 의존성을 주입한다.

### 2) 생성자 주입

```java
public class MemberService {

	private final MemberRepository memberRepository;

	public MemberService(MemberRepository memberRepository) {
		this.memberRepository = memberRepository;
	 }
 ...
}
```

필드를 `final`로 지정한 다음에, 생성자를 만들어준다. `MemberService` 내의 멤버 변수 `memberRepository`를 초기화 시키는 코드를 생성자에 넣어주어서 injection 한다.

### 3) lombok 라이브러리 활용

```java
@RequiredArgsConstructor
public class MemberService {
	private final MemberRepository memberRepository;
...
}
```

필드를 `final`로 지정한 다음, 클래스를 `@RequiredArgsConstructor` 어노테이션을 이용해 `final` 키워드가 붙은 필드의 생성자를 자동 생성한다. → 생성자 주입을 간단히 수행하는 방법이라고 할 수 있다.

# 3. 회원 기능 테스트

```java
@SpringBootTest
@Transactional
class MemberServiceTest {

    @Autowired MemberService memberService;
    @Autowired MemberRepository memberRepository;
    @Autowired EntityManager em;

    @Test
    public void 회원가입() throws Exception {
        //given
        Member member = new Member();
        member.setName("kim");

        //when
        Long saveId = memberService.join(member);

        //then
        em.flush();  // 영속성 컨텍스트에 있는 내용을 데이터베이스에 반영하는 명령 -> insert문 확인 가능
        Assertions.assertEquals(member, memberRepository.findOne(saveId));
    }

    @Test
    public void 중복_회원_예외() throws Exception {
        //given
        Member member1 = new Member();
        member1.setName("kim");
        Member member2 = new Member();
        member2.setName("kim");

        //when
        memberService.join(member1);
        assertThrows(IllegalStateException.class, () -> memberService.join(member2));
        /*
        try {
            memberService.join(member2);  // member1과 member2가 동일하므로 예외가 발생해야됨
        } catch (IllegalStateException e) {
            return;
        }
*/
        //then
        //fail("예외가 발생해야 한다.");
    }

}
```

<br><br>

---

[출처]

인프런 김영한님의 [JPA 활용 1편](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81%EB%B6%80%ED%8A%B8-JPA-%ED%99%9C%EC%9A%A9-1#curriculum)을 바탕으로 작성했습니다.