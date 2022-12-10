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

## Step 4. Fibers
- fiber는 createElement를 통해 만든 DOM 트리의 하나의 노드라고 보면 된다. 부모, 직계형재, 자식하나에 대한 참조를 가지고 있고, 이걸 이용해서 트리를 순회할 수 있다.
- `render()`함수는 fiber를 기반으로 분리된다.
  - `createDom(fiber)`: fiber를 받아서 DOM 객체를 만들고 프로퍼티를 등록한다. 자신만 하고 자식은 건들지 않는다.
  - `render(element, container)`: 인자로 fiber 객체를 만든다. dom과 자식하나만 가진다. 이걸 `nextUnitOfWork`에 할당한다. 즉 `nextUnitOfWork`는 fiber 객체로, 하나의 노드 랜더링 과정이라고 보면된다.
  - `performUnitOfWork(fiber)`: 총 세가지 역할을 한다.
    - DOM이 없으면 생성하고, 부모요소에 appendChild한다.
    - 자식을 순회하면서 `fiber`를 만들고 부모-자식, 형제-형제 참조를 넣어준다. 다 1:1이다.
    - 깊이 우선 탐색으로 fiber를 리턴한다. 자식이 있으면 리턴하고, 없으면 형재를, 없으면 부모의 형재를,.. 하는 식으로 fiber를 리턴하고 이는 `requestIdleCallback`에 의해 순서대로 처리될 것이다.

- 커밋 로그를 참고하자. 코드가 꽤 복잡하다!

<br>

## Step 5. Render and Commit Phases
- `performUnitOfWork()`의 아래 코드는 문제가 된다.
```js
function performUnitOfWork(fiber) {
  // ...
  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom)
  }
​
  // ...
}
```
- dfs로 fiber 트리를 탐색하면서 매번 부모요소에 `appendChild()`를 하는데, 이러면 root 노드부터 하나씩 랜더링 될 것이다. `requestIdleCallback()`로 랜더링을 수행하기 때문에 중간중간에 끊기면서 랜더링 될 수 있게 되는데, 이는 우리가 원하는게 아니다.
- 이를 위해서 `Render Phase`, `Commit Phase`를 만드는 것이다. `Render Phase`에서는 fiber 트리를 만들고, fiber 트리가 완성되면(`performUnitOfWork(fiber)`가 더이상 fiber를 반환하지 않는 순간!) commit 페이즈에서 한꺼번에 랜더링 하는 것이다. fiber 트리의 루트는 `render()`에서 만들어진다.
- commit 함수를 살펴보자
```js
function commitRoot() {
  commitWork(wippRoot.child);
  wipRoot = null;
}

function commitWork(fiber) {
  if(!fiber) {
    return
  }
  const domParent = fiber.parent.dom;
  domParent.appendChild(fiber.dom);
  commitWork(fiber,child);
  commitWork(fiber.sibling);
}

function render(element, container) {
  nextUnitOfWork = wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
  };
}
let nextUnitOfWork = null;
let wipRoot = null;

function workLoop(deadline) {
  // ...
    if(!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  // ...
}
```
- `commitWork()` 함수의 동작을 보면 루트 노드를 바로 컨테이너(`#app`)에 꽂고 그 뒤 자식을 꽂고.. 이런식으로 수행되는데, 이건 비효율 적이지 않을까? 루트 노드의 자식을 모두 `appendChild()` 한 뒤 마지막에 컨테이너에 루트 노드를 꽂으면 좋을 것 같은데.🤔
  - 이건 문제가 안된다. 왜냐면 `commitRoot()`는 동기적으로 호출되기 때문에, 이게 끝나야 DOM 트리를 다시 랜더링 하기 때문이다! `performUnitOfWork()`는 노드마다 쪼개서 수행되지만 `commitRoot()`는 재귀호출로 중간에 방해받지 않고 실행된다! 👍

<br>

## Step 6. Reconciliation
- `React.render()`를 하면 render phase를 동해 fiber 트리(가상돔)를 생성하고, commit phase를 통해 가상돔을 리얼돔에 반영한다. 하지만 리액트는 여기서 Reconciliation이라는 과정의 최적화를 한다.
- 최적화를 하는 이유는 기본적으로 `document.createElement()`를 하는데 비용이 많이 들기 때문이다. 이를 줄이기 위해 이전에 사용했던 dom을 재활용한다.
- 이전에 commit 된 fiber tree(`old fiber`)를 참조로 가지고 있다가 다음 다음 Render Phase에서 새로운 fiber tree를 각 fiber node마다 같은 위치의 old fiber node와 `type`을 비교한다.
```js
function reconcileChildren(wipFiber, elements) {
  // ...

  const sameType = oldFiber && element && element.type === oldFiber.type;
  
  // ...
}
```
- 같은 타입이라면, `document.createElement()`,`parentdom.appendChild(childDom)`같은 메서드를 호출할 필요가 없다. old fiber node에는 이미 dom객체의 참조를 가지고 있기 때문에 여기다가 새로운 fiber의 props를 업데이트 해주기만 하면 된다.(=> `effectTag: UPDATE`)
```js
function updateDom(dom, prevProps, nextProps) {
  // dom의 프로퍼티를 prevProps => nextProps로 업데이트
}
```
- 다른 타입이라면, 해당 fiber node의 자식요소 전체가 변경이 이뤄졌다고 판단하고, 자식 요소에서는 old fiber node와 타입 비교를 수행하지 않는다.(=> 새로 node 생성, `effectTag: REPLACEMENT`)
- 그리고 old fiber 에는 `effectTag: DELETION`를 붙이고, commit Phase에서 `parent.removeChild(fiber.dom)`을 통해 화면에서 제거하는 작업을 수행한다.
```js
function commitRoot() {
  // 커밋 페이즈 시작
  deletions.forEach(commitWork);  // 먼저 effectTag: DELETION를 먼저 지운다. 재귀호출로 자식요소 전체를 제거할것이다.
  commitWork(wippRoot.child);
  
  // ...
}
function commitWork(fiber) {
  // ...
  if (
    fiber.effectTag === "PLACEMENT" &&
    fiber.dom != null // null check..?
  ) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    // 이미 사용중인 dom의 properties만 바꾸는것. appendChild 할 필요가없다.(자식을 update한다는건 부모도 update 했다는 뜻)
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") { // old fiber의 경우에만 실행됨
    domParent.removeChild(fiber.dom);
  }
  // ...
}
```

> 리액트는 Reconciliation에 fiber의 타입 비교 외에 `key`값을 이용해서 비교하게 된다. 여기서 알 수 있는건, `key`값은 같은  위치에 있는 형제노드들 내에서만 고유하면 된다는 것이다. 결국 `Array.prototype.map()`으로 랜더링시 쓰이는건데, 중요한점은 key값이 같은 형제를 비교하기 때문에 순서는 정확하게 모른단거다. array index를 `key`값에 포함시키면 위험한 이유다.

- 이외 상세한 코드는 커밋로그 참고. 

<br>

## Step 7. Function Components
### 7.1 함수형 컴포넌트 특징
- 함수형 컴포넌트의 특징은 `children`이란걸 `props`로 받는다는 것이다. 예를들면..
```jsx
const element = <App>
  <Component1 />
  <Component2 />
  <div>div</div>
</App>
```
- 이 element는 `props.children`은 `[<Component1 />, <Component2 />, <div>div</div>]`가 된다. 중요한건 ***`children`은 fiber 트리의 children이 아니라는것이다.*** ***함수형 컴포넌트는 오로지 하나의 자식(element or component)만 반환할 수 있기 때문에 fiber 트리에서 자식은 하나다!***
```jsx
const App = ({children}) => {
  return (
    <div>
      {children}
    </div>
  )
}
```
- 이 App 컴포넌트의 자식은 결국 div 요소 하나다! 이 제약사항이 앞으로 함수 구현에 중요하게 사용된다.

<br>

### 7.2 구현
- 함수형 컴포넌트는 반환값이 `jsx`다. 아래와 같은 간단한 함수형 컴포넌트를 babel로 컴파일해보면..
```jsx
// fc.js
/** @jsx Didact.createElement */
import Didact from "./Didact"

// 1
function App(props) {
  return <h1>Hi {props.name}</h1>
}

// 2
const element = <App name="foo" />
const container = document.getElementById("root")

Didact.render(element, container)

// 바벨로 컴파일한 결과

// 2
function App(props) { 
  return Didact.createElement("h1", null, "Hi ", props.name);
}

// 2
const element = Didact.createElement(App, {
  name: "foo"
});
```

- element의 타입은 `App`이라는 `Function`이다. fiber 타입이 string이 아니게 되었는데, 이에 대한 처리를 해줘야 한다. `performUnitOfWork`에서..
```js
function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function;
  if(isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  // ...
}

function updateFunctionComponent(fiber) {
  const children = [fiber.type(fiber.props)]; // fc 실행.. => [ 요소한개 ] 가 반환될거다.
  reconcileChildren(fiber, children);
}

function updateHostComponent(fiber) {
  // 원래 하던거 그대로..
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
}
```

- `reconcileChildren()`는 기능 변화가 없다. 즉 sameType을 똑같은 방식으로 검사하게 되는데, 결국 트리상의 같은 위치에 있던 함수형 컴포넌트가 다른 함수형 컴포넌트로 바뀌면(!sameType) oldFiber에 `DELETION` 태그를 붙이고 재활용 하지 않는다는것이다.(설령 다른 두 컴포넌트가 같은 dom 요소를 반환하는것이라고 해도)

<br>

- `updateFunctionComponent()`를 보면 fiber.dom에 돔 요소를 할당하지 않는다. 즉 ***fiber 트리에서 타입이 Function인 노드는 dom을 가지고 있지 않게 된다!*** 따라서 commit phase에도 수정이 필요하다.
```js
function commitWork(fiber) {
  // ...


  // const domParent = fiber.parent.dom; 
  // parent fiber가 FC인 경우 fiber.dom이 없기 때문에 dom을 가진 fiber가 나올때까지 계속 트리 위로 올라간다.
  let domParentFiber = fiber.parent;
  while(!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;

  if(...) {
    // ....

  } else if (fiber.effectTag === "DELETION") { // old fiber의 경우에만 실행됨
    // domParent.removeChild(fiber.dom);
    commitDeletion(fiber, domParent);
  }
}

function commitDeletion(fiber, domParent) {
  /**
   * FC의 경우 지우려고 해도 dom이 없기 때문에 dom이 나올때까지 자식 노드로 접근해서 지운다. 
   * 이게 가능한 이유는, React의 FC는 dom이든 FC든 **하나의 요소**만 반환할 수 있기 때문이다.(트리상 자식은 하나)
   */
  if (fiber.dom) {
    domParent.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber.child, domParent)
  }
}
```
- FC에는 dom이 없는것과, FC의 자식은 무조건 하나라는 특징을 이용해 `domParent`를 조회하고, old fiber의 deletion을 수행한다.

<br>


## Step 8. Hooks
- 훅 중 가장 가장 중요한 상태를 관리하는 `useState()`을 구현한다. 

<br>

### 8.1 setState의 특징
- `useState()`는 스펙은 아래와 같다.
```js
const [state, setState] = useState(initialState);
```
- 인자로 초기 상태값을 전달하고, 현재 `state`와 state를 변경할 수 있는 `setState()`를 인자로 받는다. `setState`는 상태값을 받을 수도 있는데, 여기서는 `action( prevState => void )`을 인자로 받는 훅을 구현한다.

- 리액트 훅에는 몇가지 특징/제약사항이 있다. 구현에 반영되어야 한다.
  - `setState()`호출시 반드시 랜더링이 다시 되어야 한다.
  - 훅은 반드시 매번 순서를 지켜서 실행되어야한다.(조건부 실행과 같은건 허용하지 않는다)
  - 훅은 한꺼번에 모아서 처리한다. 아래 코드에서 버튼 클릭시 `setState()`가 여러번 호출되었지만 이건 결국 랜더링을 한번만 호출시킨다.
  ```js
  const App = () => {
    const [count, setCount] = useState(0);
    const onClick = () => {
      setCount(c => c + 1);
      setCount(c => c + 1);
    }
    return <button onClick={}>버튼</button>
  }
  ```

<br>

### 8.2 구현
- `updateFunctionComponent()`함수에서 함수형 컴포넌트를 실행한다. 이 때 훅이 실행되는데, 여기서 훅에서 참조할 몇가지 `global 변수`가 필요하다. 현재 fiber node인 `wipFiber`, 훅의 순서를 참조할 `wipFiber.hooks`, 그리고 현재 훅의 index인 `hookIndex`다.
```js
// Didact/index.js
let wipFiber = null;
let hookIndex = null;
function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const children = [fiber.type(fiber.props)]; // fc 실행
  reconcileChildren(fiber, children);
}
```
- `setState`훅은 대략 아래와 같이 구현한다.
```js
function useState(initial) {
  // 1
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  // 2
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  }

  // 3
  const actions = oldHook ? oldHook.queue : []
  actions.forEach(action => {
    hook.state = action(hook.state)
  })

  // 4
  const setState = (action) => {
    hook.queue.push(action);
    // 4.1
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    }
    nextUnitOfWork = wipRoot
    deletions = []
  }

  // 5
  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
}
```
- 각각에 대한 설명은 아래와 같다.
  1. `fiber.alternate`은 이전 fiber다. 여기서 훅이 있는지를 확인하고 가져온다. 동일 컴포넌트(same type)가 다시 랜더링 되었다면 oldHook을 가져올 것이다. ***old hook을 `hookIndex`를 이용해서 가져오기 때문에 hook의 호출 순서가 일관되어야 한다는 제약이 있는것이다!***
  2. 새로운 훅을 맨든다. state는 이전 상태가 있으면 가져오고 없으면 초기값을쓴다. `queue`는 `setState`에 action 전달시 쌓이게 된다!
  3. queue에 쌓인 action을 모두 실행한다. action이 있고 상태를 변경시킨다면, 상태가 업데이트 될 것이고, 업데이트 된 상태를 가지고 컴포넌트를 랜더링을 할 것이다. 
  4. `setState는` 랜더링 이후 사용자 액션에 의해 호출될것이다. hook의 queue에 action을 넣는다.
    - 4.1에서는 `render()`함수의 내용을 수행한다. `currentRoot`라는 old fiber root을 가지고 새로운 fiber를 할당한다. 이렇게 해서 `re render`를 발생시키면, setState가 참조하는 `hook`는 다음 랜더링에서 `oldHook`이 되고 `oldHook.queue`를 순회하면서 상태 업데이트를 칠것이다. `queue`는 버퍼 역할을 해서 setState를 리랜더 한번에 모두 실행하게 한다.
  5. `setState`훅을 `wipFiber.hook`에 넣고, `[state, setState]`를 반환한다.

- 여기까지가 `setState`훅의 구현이다. `old fiber`를 활용하는 코드가 꽤 복잡한데, 디버깅을 해보면서 동작을 이해해야 한다.

<br>

