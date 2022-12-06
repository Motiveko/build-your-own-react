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

function createDom(fiber) {
  const dom =
    fiber.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type)

  const isProperty = key => key !== "children"
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = fiber.props[name]
    })

  return dom
}

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
  // set next unit of work
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
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if(!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performUnitOfWork(fiber) {
  // * add dom node
  if(!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  // * create new fibers
  const elements = fiber.props.children
  let index = 0
  let prevSibling = null

  while (index < elements.length) {
    const element = elements[index]

    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    }

    if (index === 0) {
      fiber.child = newFiber  // 부모-자식 연결은 첫번째 자식만 한다.
    } else {
      prevSibling.sibling = newFiber  // 나머지 자식은 첫번째 자식의 형제 - 그의 형제 - ... 이런식으로 이어진다.
    }

    prevSibling = newFiber
    index++
  }

  // * return next unit of work
  if (fiber.child) {
    return fiber.child  // 자식이 있으면 리턴
  }
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {  // 자식이 없으면 형재를 리턴한다.
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent  // 형재가 없으면 부모로 간다. 부모에서 while문이 돌아서 부모의 형재(uncle)이 있으면 리턴할것이다. 없다면 할아버지로 이동하겠지..
  }
  // 깊이 우선 탐색이 끝나고 #root의 자식을 다 돌고 나서 끝난다.
}

export default Didact = { createElement, render };
