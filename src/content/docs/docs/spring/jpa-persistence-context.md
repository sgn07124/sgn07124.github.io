---
title: "3. 영속성 관리 - 내부 동작 방식"
date: 2024-05-14
lastUpdated: 2024-05-14
tags: [JPA]
description: "영속성 관리와 내부 동장 방식에 대해 설명한다."
---

### JPA에서 중요한 것 2가지?

1. 객체와 RDB 매핑
2. 영속성 컨텍스트

<br>

## 영속성 컨텍스트?

: <b>엔티티를 영구 저장하는 환경으로 논리적인 개념이다.</b>

엔티티 매니저를 통해서 영속성 컨텍스트에 접근한다.
(엔티티 매니저와 영속성 컨텍스트가 J2SE 환경에서 1:1관계이고, J2EE, 스프링 프레임워크 같은 컨테이너 환경에서는 N:1 관계이다.)

## 엔티티 생명주기


<img width="1100" height="798" alt="Image" src="https://github.com/user-attachments/assets/47eb1828-1a00-4226-8eb5-0e5835cb6fa4" />

- <b>비영속 상태 (new/transient)</b> : 객체를 생성만 하고 엔티티와 연결하지 않음

- <b>영속 상태 (managed)</b> : 객체를 생성하고 저장한 상태로 영속성 컨텍스트가 관리하는 엔티티

<img width="1280" height="361" alt="Image" src="https://github.com/user-attachments/assets/a902b899-aa59-4d63-8570-72faeee72641" />

- <b>준영속 상태 (detached)</b> : 엔티티를 영속성 컨텍스트에서 분리 ex) em.detach(member);
- <b>삭제 (removed)</b> : 객체를 삭제한 상태 ex) em.remove(member);

## 영속성 컨텍스트의 이점

### 1. 1차 캐시

엔티티 조회 시?

1. 1차 캐시에서 조회
2. 만약, 1차 캐시에 없다면 DB에서 조회 → 조회한 데이터를 다시 1차 캐시에 저장한 후 반환

<img width="1280" height="648" alt="Image" src="https://github.com/user-attachments/assets/13db96d1-81f3-4141-be84-b8d1e70fa954" />

entityManager는 트랜잭션 단위이므로 트랜잭션이 끝나면 1차 캐시도 지워진다.
(2차 캐시 : 애플리케이션 전체에서 공유하는 캐시)

<img width="1280" height="378" alt="Image" src="https://github.com/user-attachments/assets/80353b9f-420d-4696-ab6f-d801c7ab8e6f" />

위 코드를 보면 findMember를 출력한 결과가 정상적으로 출력됬지만 SELECT 쿼리가 나가지 않은 것을 확인할 수 있다. 이는 1차 캐시에 저장된 것을 조회했기 때문이다.

<img width="1280" height="305" alt="Image" src="https://github.com/user-attachments/assets/bd352fee-ace6-48cd-ad58-c4a4f1f41380" />

이 코드는 같은걸 두 번 조회하는 코드이지만 SELECT 쿼리는 한 번만 실행한 것을 확인할 수 있다. 이는 findMember1에서 DB에서 1회 조회했기 때문에 해당 데이터는 1차 캐시에 저장된다. 두 번째로 findMember2를 조회할 때는 1차 캐시에서 조회하므로 SELECT 쿼리로 DB에서 조회하지 않는다.

### 2. 영속 엔티티의 동일성 보장

<img width="1236" height="288" alt="Image" src="https://github.com/user-attachments/assets/e32683e6-1c61-48a9-a5c4-a0061261ef87" />

같은 트랜젝션 안에서 같은 호출을 반복해도 1차 캐시에 있는 같은 엔티티를 반환하여 동일성을 보장한다.
(1차 캐시로 반복 가능한 읽기(REPEATABLE READ) 등급의 트랜잭션 격리 수준을 데이터베이스가 아닌 애플리케이션 차원에서 제공)

### 3. 엔티티 등록 (쓰기 지연)

<img width="1280" height="456" alt="Image" src="https://github.com/user-attachments/assets/13defaf5-17c1-406e-9f31-e3a1a5a54dd2" />

<img width="1236" height="464" alt="Image" src="https://github.com/user-attachments/assets/60d89060-9559-4fc5-aa65-a6dc5967793f" />

em.persist()를 하면 SQL 쿼리를 쓰기 지연 SQL 저장소에 모아놨다가 commit()되는 순간에 한 번에 DB에 SQL 쿼리를 한 번에 보낸다. 

### 4. 엔티티 수정 (변경 감지:Dirty Checking)

데이터를 수정할 때, 개발자가 업데이트 쿼리를 날리면 안된다.

```java
Member member = em.find(Member.class, 150L);
member.setName("ZZZZ");  // 데이터 변경

//em.persist(member);  // 적용? 변경? 하라는 update 쿼리를 날릴 필요가 없다.
//em.update(member);  // 이런 코드 필요 없다.

tx.commit();
```

<img width="1280" height="751" alt="Image" src="https://github.com/user-attachments/assets/ed7eff24-5322-4384-a133-25b9224c5e3c" />

내부 동작 방식을 보면, flush()를 했을 때 엔티티와 스냅샷(값을 읽어온 시점, 최초 시점의 상태를 떠둔것)을 모두 비교해서 바뀐 엔티티를 찾는다. 바뀐 엔티티가 있으면 update 쿼리를 쓰기 지연 SQL 저장소에 저장한다. 그리고 DB에 반영한다.

### 5. 엔티티 삭제

```java
// 삭제 대상 엔티티 조회
Member memberA = em.find(Member.class, "memberA");

em.remove(memberA);  // 엔티티 삭제
```

## 플러시

- 영속성 컨텍스트의 변경 내용을 데이터베이스에 반영(동기화) 
- 트랜젝션이라는 작업 단위가 중요 → 커밋 직전에만 동기화하면 된다.
- 영속성 컨텍스트를 비우는 것이 아니다.

영속성 컨텍스트를 플러시하는 방법 → em.flush()로 직접 호출, 트랜잭션 커밋과 JPQL 쿼리 실행으로 플러시 자동 호출

### 플러시가 발생하면?

- 변경 감지(dirty checking)
- 수정된 엔티티 쓰기 지연 SQL 저장소에 등록
- 쓰기 지연 SQL 저장소의 쿼리를 데이터베이스에 전송(등록, 수정, 삭제 쿼리)

1차 캐시와는 상관이 없으며, 쓰기 지연 SQL 저장소의 쿼리들이 데이터베이스에 반영되는 과정이다.
→ 1차 캐시는 삭제되지 않는다.

<img width="1220" height="270" alt="Image" src="https://github.com/user-attachments/assets/bfa48d61-add8-4250-a97b-2c5cb88d825e" />

## 준영속 상태

영속 상태의 엔티티가 영속성 컨텍스트에서 분리(detached) → 영속성 컨텍스트가 제공하는 기능을 사용하지 못함.

### 준영속 상태로 만드는 방법

- em.detach(entity) : 특정 엔티티만 준영속 상태로 전환
- em.clear() : 1차 캐시(영속성 컨텍스트)를 모두 지움. → 테스트 케이스 볼 때, 확인용으로 사용
- em.close() : 영속성 컨텍스트를 종료