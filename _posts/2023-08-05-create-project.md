---
# 글 제목
title: 1. 프로젝트 생성
# 간단한 설명
description: 인프런 김영한님의 "스프링 입문" 강의를 바탕으로 작성했습니다.
# 작성자
author: 
# 작성일자
date: 2023-08-05 13:00:00 +0800
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

# 1. 프로젝트 생성
프로젝트 생성은 [spring.io](https://start.spring.io/)에서 설정 후 파일을 다운로드 하면 된다.

![](https://velog.velcdn.com/images/sgn07124/post/54fae616-6c3d-4068-a9b3-ca2384c70ed8/image.png)



- Project : 필요한 라이브러리를 땡겨오고, lifecycle까지 관리해주는 툴?을 선택
  - 요즘에는 Gradle을 사용함
- Language : Java
- Spring Boot : 3.1.2 선택
  - SNAPSHOT : 만들고 있는 버전
  - M1 : 정식 릴리즈되지 않은 버전
- Project Metadata
  - Group : 기업명 같은거 작성
  - Artifact : 빌드됬을 때의 결과물(프로젝트 명)
- Dependencies : 어떤 라이브러리를 가져와서 사용할지 고르는 것
  - Spring Web
  - Thymeleaf

### Gradle 설정
따로 설정하지 않아도 된다.
```
plugins {
	id 'java'
	id 'org.springframework.boot' version '3.1.2'
	id 'io.spring.dependency-management' version '1.1.2'
}

group = 'hello'
version = '0.0.1-SNAPSHOT'

java {
	sourceCompatibility = '17'
}

repositories {
	mavenCentral()
}

dependencies {  // 프로젝트 생성 시 가져온 web과 thymeleaf
	implementation 'org.springframework.boot:spring-boot-starter-thymeleaf'
	implementation 'org.springframework.boot:spring-boot-starter-web'
	testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

tasks.named('test') {
	useJUnitPlatform()
}
```
### 실행
1. main 메서드 좌측의 실행 누르면 됨.
![](https://velog.velcdn.com/images/sgn07124/post/8f691f76-c2c2-4a36-85dc-c95a5472447f/image.png)
2. 웹 브라우저에서 [localhost:8080](localhost:8080) 접속
![](https://velog.velcdn.com/images/sgn07124/post/e01d0bf7-faa9-4012-9bb3-8e7b8c6a30bf/image.png)

# 2. 라이브러리
Gradle은 의존관계가 있는 라이브러리를 함께 다운로드 한다.

### 스프링 부트 라이브러리

1) Spring-boot-starter-web
  - spring-boot-starter-tomcat : 톰캣(웹서버(8080))
  - spring-webmvc : 스프링 웹 MVC
  
2) spring-boot-starter-thymeleaf : 타임리프 템플릿 엔진(view)

3) spring-boot-starter(공통) : 스프링부트(\*) + 스프링 코어(\*) + 로깅
- spring-boot
- spring-core
- spring-boot-starter-logging(logback, slf4j)

### 테스트 라이브러리

1) Spring-boot-starter-test
- junit : 테스트 프레임워크(Junit5를 많이 사용하는 추세)
- mockito : 목 라이브러리
- assertj : 테스트 코드를 좀 더 편하게 작성하게 도와주는 라이브러리
- spring-test : 스프링 통합 테스트 지원

# 3. View 환경설정
### Welcome Page 만들기

스프링부트가 제공하는 Welcome Page 기능으로 <code>resources/static/index.html</code>을 올려두면 된다.
```html
<!DOCTYPE HTML>
<html>
<head>
    <titie>Hello</titie>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
</head>
<body>
Hello
<a href="/hello">hello</a>
</body>
</html>
```
<code>index.html</code>를 작성 후, 다시 [localhost:8080](localhost:8080)을 실행하면 방금 작성한 html 페이지가 나온다.
![](https://velog.velcdn.com/images/sgn07124/post/8d93d441-5515-494d-bcaa-b55bc46fcb19/image.png)

<code>hello</code>의 경로에는 아무것도 없으므로 에러 페이지가 뜬다.

### Thymeleaf 엔진 (컨트롤러)
![HelloController.java](https://velog.velcdn.com/images/sgn07124/post/ec8db4ea-4c26-4aa1-9dbf-465a7d13acf4/image.png)
⬆️ 컨트롤러로 @Controller 어노테이션을 붙여줘야한다. @GetMapping 어노테이션은 http Method인 GET과 매핑될 수 있도록 하는 어노테이션이다.
![hello.html](https://velog.velcdn.com/images/sgn07124/post/e4032060-342f-4477-8d45-3100c8997487/image.png)
⬆️ <code>xmlns:th="http://www.thymeleaf.org"</code>를 <code>th</code>로 가져왔으므로 Thymeleaf를 th로 사용할 수 있다.

위 코드는 <code>HelloController.java</code>이고, 아래의 코드는 <code>hello.html</code>이다. 코드 실행 시, <code>hello.html</code>의 <code>${data}</code>의 부분이 <code>HelloController.java</code>의 key값인 "data"와 대응하여 value값인 "hello"가 들어가게 된다.
[localhost:8080/hello](localhost:8080/hello) 실행 시, 아래와 같이 화면에 보인다.
![](https://velog.velcdn.com/images/sgn07124/post/898f43a1-4ad3-4876-a386-3871f44bc985/image.png)

# 4. 빌드하고 실행하기
![](https://velog.velcdn.com/images/sgn07124/post/f08ff0dc-17f2-4e2d-bf74-d94f6ba67a9f/image.jpeg)

<br>
<br>


---

인프런 김영한님의 [스프링 입문 - 코드로 배우는 스프링 부트, 웹 MVC, DB 접근 기술](https://www.inflearn.com/course/스프링-입문-스프링부트) 을 바탕으로 작성했습니다.