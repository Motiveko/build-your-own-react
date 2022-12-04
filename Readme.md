# Build Your Own React
> 리액트 만들어보기

<br>

## 학습자료
> https://pomb.us/build-your-own-react/

<br>

## Step 0. Review
- 만들어 낼 리액트를 살펴보자. 아래와 같은 리액트 코드를 실행해서 간단한 웹 앱을 만들수 있게 된다.
  ```jsx
  const element = <h1 title="foo">Hello</h1>
  const container = document.getElementById("root")
  ReactDOM.render(element, container)
  ```
  1. 첫째줄은 JSX문법으로 작성되어있다. [babel을 이용해서 컴파일 하면](https://babeljs.io/docs/en/babel-plugin-transform-react-jsx#react-classic-runtime) 아래와 같이 된다.
  ```js
  // 1. React.createElement()로 변환
  const element = React.createElement(
    "h1",
    { title: "foo" },
    "Hello"
  )

  // 2. React.createElement()
  const element = {
    type: "h1",
    props: {
      title: "foo",
      children: "Hello",
    },
  }
  ```
    - JSX 컴파일 결과는 요소의 tag명인 `type`과 `props`를 가지는 객체가 된다. 나머지도 있지만 핵심은 두가지이기 때문에 이것까지만 구현한다.

  3. 셋째줄은 DOM Tree를 만드는 함수다. 실행은 아래와 같이 된다.
  ```js
  // ...

  const node = document.createElement(element.type)
  node["title"] = element.props.title
  ​
  const text = document.createTextNode("")
  text["nodeValue"] = element.props.children
  ​
  node.appendChild(text)
  container.appendChild(node)
  ```
    - JSX 파싱한것을 type에 맞춰 Node 객체를 만들고, 내부에 children값을 채워 넣은 뒤, `container`에 `appendChild()`를 이용해서 자식으로 추가한다.

<br>
