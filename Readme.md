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

## Step 1. The createElement Function
- 아래 코드를 [`@babel/plugin-transform-react-jsx`](https://babeljs.io/docs/en/babel-plugin-transform-react-jsx#usage) 플러그인을 통해 `createElement()` 컴파일되게 한다.
```js
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
)
```
- 우리는 가짜 리액트이기 때문에 `Didact`모듈을 만들고 여기다가 `createElement()`를 구현한다.
```js
// Didact/indexx.js
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      children: text,
    },
  };
}

export default Didact = { createElement };
```
- `children`은 여러개가 될 수 있기 때문에 배열이 된다. 이 때, `children`은 텍스트, 숫자 등 원시값이 들어올 수 있는데, 이것도 `createTextElement()` 함수를 통해 `"TEXT_ELEMENT"` 타입의 객체로 만들어준다.(이 객체의 children에는 무조건 원시값이 들어가게 된다.) 
- `plugin-transform-react-jsx`플러그인은 JSX를 컴파일해서 `React.createElement()`로 바꿔주는데, 주석을 통해 사용 함수를 바꿔줄 수 있다.
```js
/** @jsx Didact.createElement */
import Didact from "./Didact"

const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
)
```

- 바벨 설치한다.
```bash
npm i --save @babel/plugin-transform-react-jsx @babel/core
```
- 바벨 설정파일을 작성한다.(`babelrc.json`)
```json
{
  "plugins": ["@babel/plugin-transform-react-jsx"]
}
```
- 컴파일해본다.
```bash
babel main.js
```
- 결과는 아래와 같다.
```js
/** @jsx Didact.createElement */
import Didact from "./Didact";
const element = Didact.createElement("div", {
  id: "foo"
}, Didact.createElement("a", null, "bar"), Didact.createElement("b", null));
```

<br>

## Step 2. The render Function
- 우선 DOM을 추가하는 기능만 구현한다. update, delete는 나중에..
- `ReactDOM.render()`는 DOM tree를 만들어주는 함수다. React Element 객체를 재귀적으로 호출하여 트리 구조를 만든다.
```js
// Didact/index.js

// ...

function render(element, container) {
  // TEXT_ELEMENT는 textNode로 만든다.
  const dom =
    element.type !== "TEXT_ELEMENT"
      ? document.createElement(element.type)
      : document.createTextNode("");

  const isProperty = (key) => key !== 'children'

  Object.keys(dom.props)
    .filter(isProperty)
    .forEach(key => dom[key] = element.props[key]);

  // 자식들을 재귀적으로 호출
  element.props.children.forEach(child => render(child, dom));
  
  container.appendChild(dom);
}

export default Didact = { createElement, render };
```

<br>

## Step 3. Concurrent Mode
- Step2에서 구현한 `render()` 함수는 동기적으로 동작한다. 호출시 메인스레드를 블로킹한다는 의미인데, DOM tree가 클 경우 이게 동작하는동안 웹이 멈추게된다.
- [`window.requestIdleCallback()`](https://developer.mozilla.org/ko/docs/Web/API/Window/requestIdleCallback)은 메인스레드가 idle(쉬는) 상태 일 때에만 작업을 하도록 할 수 있는 함수다. 따라서 사용자가 input을 주거나 애니메이션이 동작하는 등의 상황을 피해서 원하는 작업을 할 수 있는 함수. 이 메서드를 이용해서 랜더링을 수행한다.
  - 참고로 리액트도 원래 `requestIdelCallback`을 썼으나 현재는 [`scheduler packages`](https://github.com/facebook/react/tree/main/packages/scheduler)라는걸 사용한다고 한다. 어쨋든 목적은 똑같다.

- 대략 아래와 같이 구현한다.
```js
let nextUnitOfWork = null;

function workLoop(deadline) {
  let shouldYield = false;
  while(nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performUnitOfWork(nextUnitOfWork) {
  // TODO...
}
```
  - `nextUnitOfWork`는 수행해야할 작업이다.
  - `workLoop`는 `requestIdleCallback()`에 전달할 콜백으로, deadline의 조건에 따라 nextUnitOfWork(랜더링)을 수행한다. 인자로 `IdleDeadLine`을 받는데, 이게 하는 역할은 브라우저가 메인스레드를 사용해야할 시간 같은것들을 알려준다. `shouldYield`는 브라우저가 메인스레드 가져가기까지 1ms 이내로 남았는지 여부로, 1ms 이내면 랜더링을 잠깐 멈추고 다시 `requestIdleCallback()`을 통해 랜더링 작업을 등록하게 된다.
  - `requestIdleCallback(workLoop);`를 호출해서 workLoop를 최초 등록해줘야한다.
  - `performUnitOfWork()`는 랜더링 일부를 실행하고 다음 작업을 돌려준다. 구현해야한다.

<br>
