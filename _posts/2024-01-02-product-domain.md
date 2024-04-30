---
# 글 제목
title: 5. 상품 도메인 개발
# 간단한 설명
description: 인프런 김영한님의 "실전! 스프링 부트와 JPA 활용1 - 웹 애플리케이션 개발" 강의를 바탕으로 작성했습니다.
# 작성자
author: 
# 작성일자
date: 2023-01-02 13:00:00 +0800
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

# 1. 상품 엔티티 개발(비즈니스 로직 추가)

### Item.java에 아래의 비즈니스 로직을 추가한다.

```java
// 비즈니스 로직
// 재고(stack) 수량 증가
public void addStock(int quantity) {
    this.stockQuantity += quantity;
}

// 재고(stack) 감소, 0보다 내려가면 안됨
public void removeStock(int quantity) {
    int restStock = this.stockQuantity - quantity;
    if (restStock < 0) {
        throw new NotEnoughStockException("need more stock");
    }
    this.stockQuantity = restStock;
}
```

위와 같은 비즈니스 로직은 서비스 로직에 넣어도 되고, 위처럼 도메인에 넣어도 된다. 여기서는 도메인 주도 설계 방식을 사용했다. 도메인 주도 설계는 도메인이 비즈니스 로직의 주도권을 가지고 개발하는 설계 방식을 말한다. 서비스는 엔티티를 호출하는 정도의 얇은 비즈니스 로직을 갖게 된다. `stockQuantity`같은 데이터를 가지고 있는 쪽에 비즈니스 메서드가 있는 것이 응집력이 좋다.

위처럼 도메인 주도 설계는 엔티티를 객체로서 사용하는 것이고, 엔티티가 아닌 서비스 로직에 비즈니스 로직을 넣는 것은 엔티티를 자료구조로서 사용하는 것이다.

# 2. 상품 리포지토리 개발

### ItemRepository

```java
@Repository
@RequiredArgsConstructor
public class ItemRepository {

    private final EntityManager em;

    public void save(Item item) {
        if (item.getId() == null) {  // item이 없다? -> 이건 새로 생성한 객체이다.
            em.persist(item);  // 신규로 등록
        } else {  // 뭔가 있다? -> 이미 db에 등록된걸 어디서 가져온 것이다.
            em.merge(item);
        }
    }

    public Item findOne(Long id) {
        return em.find(Item.class, id);
    }

    public List<Item> findAll() {
        return em.createQuery("select i from Item i", Item.class).getResultList();
    }
}
```

회원 리포지토리의 `save`는 단순히 `persist`를 했지만 상품 리포지토리의 `save`는 상품의 재고가 변하는 등 수정되는 상황을 고려한다. 처음 저장하는 상품(`id==null`)에 대해서는 `persist`를 하고 상품 id가 이미 있는 상황에 대해서는 `merge`(병합)를 사용한다. 

# 3. 상품 서비스 개발

### ItemService

```java
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;

    @Transactional  // 전체가 readOnly = true(읽기 전용)이므로 saveItem은 쓰기가 되야하므로 붙여줘야 함
    public void saveItem(Item item) {
        itemRepository.save(item);
    }

    public List<Item> findItems() {
        return itemRepository.findAll();
    }
    public Item findOne(Long itemId) {
        return itemRepository.findOne(itemId);
    }
}
```

`@Transactional(readOnly = true)`은 코드 전체를 읽기 전용으로 설정하지만 `saveItem` 메소드는 쓰기가 되야되므로`@Transactional`을 추가하여 저 부분만 쓰기가 가능하도록 설정했다.

<br>

---

<br>

[출처]

인프런 김영한님의 [JPA 활용 1편](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81%EB%B6%80%ED%8A%B8-JPA-%ED%99%9C%EC%9A%A9-1#curriculum)을 바탕으로 작성했습니다.