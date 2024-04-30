---
# 글 제목
title: 6. 주문 도메인 개발
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

# 1. 주문, 주문상품 엔티티 개발

## 생성 메서드

### Order

```java
//== 생성 메서드==//
    public static Order createOrder(Member member, Delivery delivery, OrderItem... orderItems) {
        Order order = new Order();
        order.setMember(member);
        order.setDelivery(delivery);
        for (OrderItem orderItem : orderItems) {
            order.addOrderItem(orderItem);
        }
        order.setStatus(OrderStatus.ORDER);
        order.setOrderDate(LocalDateTime.now());
        return order;
    }
```

### OrderItem

```java
//==생성 메서드==//
    public static OrderItem createOrderItem(Item item, int orderPrice, int count) {
        OrderItem orderItem = new OrderItem();
        orderItem.setItem(item);
        orderItem.setOrderPrice(orderPrice);
        orderItem.setCount(count);

        item.removeStock(count);
        return orderItem;
    }
```

주문 상품을 생성할 때, `removeStock` 메소드로 재고가 줄어들게 설정했다.

## 취소 로직

주문을 취소할 때, 상품의 재고가 증가해야 한다.

### Order

```java
public void cancel() {
    if (delivery.getStatus() == DeliveryStatus.COMP) {  // 이미 배송이 시작된 경우
        throw new IllegalStateException("이 배송 완료된 상품은 취소가 불가능합니다.");
    }

    this.setStatus(OrderStatus.CANCEL);  // 취소되면 OrderStatus를 CANCEL로 설정
    for (OrderItem orderItem : orderItems) {
        orderItem.cancel();  // 상품을 여러개 주문했을 때, 상품 각각에 대하여 CANCEL을 해주는 것
    }
}
```

### OrderItem

```java
public void  cancel() {
    getItem().addStock(count);  // 취소하면 주문을 원복한다.
}
```

`addStock()`으로 주문 수량(count)만큼 재고를 증가시킨다.

## 조회 로직

### Order

```java
public int getTotalPrice() {
    int totalPrice = 0;
    for (OrderItem orderItem : orderItems) {
        totalPrice += orderItem.getTotalPrice();
    }
    return totalPrice;
}
```

### OrderItem

```java
public int getTotalPrice() {
    return getOrderPrice() * getCount();
}
```

주문상품 각각의 전체 가격을 더해서(`getOrderPrice()`) 총 주문 가격(`getTotalPrice()`)을 조회하는 로직이다.

# 2. 주문 리포지토리 개발

```java
@Repository
@RequiredArgsConstructor
public class OrderRepository {

    private final EntityManager em;

    public void save(Order order) {
        em.persist(order);
    }

    public Order findOne(Long id) {  // 검색 기능
        return em.find(Order.class, id);
    }

    //public List<Order> findAll(OrderSearch orderSearch) {}
}
```

# 3. 주문 서비스 개발

```java
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final MemberRepository memberRepository;
    private final ItemRepository itemRepository;

    // 주문
    @Transactional
    public Long order(Long memberId, Long itemId, int count) {

        // 엔티티 조회
        Member member = memberRepository.findOne(memberId);
        Item item = itemRepository.findOne(itemId);

        // 배송 정보 생성
        Delivery delivery = new Delivery();
        delivery.setAddress(member.getAddress());

        // 주문 상품 생성
        OrderItem orderItem = OrderItem.createOrderItem(item, item.getPrice(), count);

        // 주문 생성
        Order order = Order.createOrder(member, delivery, orderItem);

        // 주문 저장
        orderRepository.save(order);

        return order.getId();
    }

    // 취소
    @Transactional
    public void cancelOrder(Long orderId) {
        // 주문 엔티티 조회
        Order order = orderRepository.findOne(orderId);
        // 주문 취소
        order.cancel();
    }

    // 검색
}
```

### 상품 주문

주문은 회원, 주문 상품, 배송 엔티티와 연관되어 있다. 여기서 주문 상품과 배송은 영속성 전이(cascade) 설정을 했기 때문에 회원 리포지토리를 의존하여 회원 Id에 맞는 회원을 조회할 수 있도록 한다.

또한 주문 상품은 상품과 연관되어 있기 때문에 상품 리포지토리를 의존하여 상품 ID에 맞는 상품을 조회할 수 있도록 한다. 추가로 주문은 여러 주문 상품을 가질 수 있지만 여기서는 주문 상품을 하나만 넣을 수 있도록 했다.

앞에서 만든 생성 메서드를 사용해 주문을 생성하고 영속화한다.

### 상품 취소

미리 만들어둔 비즈니스 로직인 cancel을 호출하는 것으로 서비스 로직은 끝난다.

cancel 로직처럼 데이터가 변경되면(재고가 올라간다) JPA는 알아서 update 쿼리를 날려주기 때문에 서비스 로직은 엔티티 비즈니스 로직을 호출하는 정도의 기능만 하고 변경되는 데이터와 가장 가까운 엔티티에서 비즈니스 로직을 관리할 수 있다. 이를 도메인 주도 설계라고 한다.

만약 쿼리를 일일이 작성해줘야 한다면 서비스에 브즈니스 로직을 전부 추가해야 하는 어려움이 있다.

# 4. 주문 기능 테스트

```java
@SpringBootTest
@Transactional  // 테스트 끝나면 롤백
class OrderServiceTest {

    @Autowired EntityManager em;
    @Autowired OrderService orderService;
    @Autowired OrderRepository orderRepository;

    @Test
    public void 상품주문() throws Exception {
        //given
        Member member = createMember();
        Book book = createBook("시골 JPA", 10000, 10);

        int orderCount = 2;
        //when
        Long orderId = orderService.order(member.getId(), book.getId(), orderCount);

        //then
        Order getOrder = orderRepository.findOne(orderId);

        assertEquals(OrderStatus.ORDER, getOrder.getStatus(), "상품 주문시 상태는 ORDER");
        assertEquals(1, getOrder.getOrderItems().size(), "주문한 상품의 종류 수가 정확해야 한다.");
        assertEquals(10000*orderCount, getOrder.getTotalPrice(), "주문 가은 가격 * 수량이다.");
        assertEquals(8, book.getStockQuantity(), "주문 수량만큼 제고가 줄어야 한다.");
    }
    
    @Test()
    public void 상품주문_재고수량초과() throws Exception {
        //given
        Member member = createMember();
        Item item = createBook("시골 JPA", 10000, 10);

        int orderCount = 11;

        //when
        
        //then
        assertThrows(NotEnoughStockException.class, () -> {
            orderService.order(member.getId(), item.getId(), orderCount);});
        //fail("재고 수량 부족 예외가 발행해야 한다."); -> JUnit5는 fail이 안되서 위와 같이 assertThrows를 사용해야 함
    }

    @Test
    public void 주문취소() throws Exception {
        //given
        Member member = createMember();
        Book item = createBook("시골 JPA", 10000, 10);

        int orderCount = 2;

        Long orderId = orderService.order(member.getId(), item.getId(), orderCount);

        //when
        orderService.cancelOrder(orderId);

        //then
        Order getOrder = orderRepository.findOne(orderId);

        assertEquals(OrderStatus.CANCEL, getOrder.getStatus(), "주문 취소시 상태는 CANCEL 이다.");
        assertEquals(10, item.getStockQuantity(), "주문이 취소된 상품은 그만큼 재고가 증가해야 한다.");

    }

    private Book createBook(String name, int price, int stockQuantity) {
        Book book = new Book();
        book.setName(name);
        book.setPrice(price);
        book.setStockQuantity(stockQuantity);
        em.persist(book);
        return book;
    }

    private Member createMember() {
        Member member = new Member();
        member.setName("회원1");
        member.setAddress(new Address("서울", "걍가", "123-123"));
        em.persist(member);
        return member;
    }
}
```

### Member와 Book 객체에 메소드 추출

Member와 Book 객체에 메소드 추출 단축키(command + option + M)로 createMember, createBook 메소드를 만들고 파라미터 추출 (command + option + P) 단축키로 setName, setAddress, setPrice, setStockQuantity 파라미터를 넣어준다.

```java
Member member = createMember();
Book book = createBook("시골 JPA", 10000, 10);

// 아래를 만들어서 위에처럼 사용 

private Book createBook(String name, int price, int stockQuantity) {
        Book book = new Book();
        book.setName(name);
        book.setPrice(price);
        book.setStockQuantity(stockQuantity);
        em.persist(book);
        return book;
    }

    private Member createMember() {
        Member member = new Member();
        member.setName("회원1");
        member.setAddress(new Address("서울", "걍가", "123-123"));
        em.persist(member);
        return member;
    }
```

# 5. 주문 검색 기능 개발

주문 검색은 동적 쿼리를 사용한다. 아무 조건도 없다면 전체 주문을 조회하고, 회원 이름과 주문 상태(ORDER, CANCEL)에 따라 동적으로 관련 주문 조회를 하는 기능이다.

주문 검색 조건 → OrderSearch.java 사용

### 쿼리 문자열을 상황에 따라 생성

```java
// 이 방법은 너무 복잡해서 실무에서 거의 사용 안함
    public List<Order> findAllByString(OrderSearch orderSearch) {

        String jpql = "select o from Order o join o.member m";
        boolean isFirstCondition = true;

        //주문 상태 검색
        if (orderSearch.getOrderStatus() != null) {
            if (isFirstCondition) {
                jpql += " where";
                isFirstCondition = false;
            } else {
                jpql += " and";
            }
            jpql += " o.status = :status";
        }

        //회원 이름 검색
        if (StringUtils.hasText(orderSearch.getMemberName())) {
            if (isFirstCondition) {
                jpql += " where";
                isFirstCondition = false;
            } else {
                jpql += " and";
            }
            jpql += " m.name like :name";
        }

        TypedQuery<Order> query = em.createQuery(jpql, Order.class)
                .setMaxResults(1000);  // 최대 1000건

        if (orderSearch.getOrderStatus() != null) {
            query = query.setParameter("status", orderSearch.getOrderStatus());
        }
        if (StringUtils.hasText(orderSearch.getMemberName())) {
            query = query.setParameter("name", orderSearch.getMemberName());
        }

        return query.getResultList();

    }
```

### JPA Criteria

```java
//  JPA Criteria -> 이것도 권장하는 방법이 아님
    public List<Order> findAllByCriteria(OrderSearch orderSearch) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Order> cq = cb.createQuery(Order.class);
        Root<Order> o = cq.from(Order.class);
        Join<Object, Object> m = o.join("member", JoinType.INNER);

        List<Predicate> criteria = new ArrayList<>();

        //주문 상태 검색
        if (orderSearch.getOrderStatus() != null) {
            Predicate status = cb.equal(o.get("status"), orderSearch.getOrderStatus());
            criteria.add(status);
        }

        //회원 이름 검색
        if (StringUtils.hasText(orderSearch.getMemberName())) {
            Predicate name =
                    cb.like(m.<String>get("name"), "%" +
                            orderSearch.getMemberName() + "%");
            criteria.add(name);
        }

        cq.where(cb.and(criteria.toArray(new Predicate[criteria.size()])));
        TypedQuery<Order> query = em.createQuery(cq).setMaxResults(1000);
        return query.getResultList();
    }
```

두 방법 모두 복잡하고 유지보수가 어렵기 때문에 사용하지 않는다.

따라서 동적 쿼리에 대해서는 QueryDSL을 많이 사용한다. QueryDSL를 사용하면 보다 간단해진다.

<br>

---

<br>

[출처]

인프런 김영한님의 [JPA 활용 1편](https://www.inflearn.com/course/%EC%8A%A4%ED%94%84%EB%A7%81%EB%B6%80%ED%8A%B8-JPA-%ED%99%9C%EC%9A%A9-1#curriculum)을 바탕으로 작성했습니다.