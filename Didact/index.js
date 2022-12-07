import { DEFAULT_EXTENSIONS } from "@babel/core";

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
      : document.createElement(fiber.type);

  updateDom(fiber.dom, {}, fiber.props);

  return dom;
}
const is1 = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (prev, next) => (key) => !(key in next);
function updateDom(dom, prevProps, nextProps) {
  // Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvnet)
    .filter(
      (key) =>
        // isGone or isNew, 업데이트가 안되기 때문에 무조건 지운다.
        !(key in next) || prev[key] !== next[key]
    ).forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    })
  // Remove old props
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = "";
    });

  // set new or changed props
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dome[name] = nextProps[name];
    });

  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}

function commitRoot() {
  deletions.forEach(commitWork);  // old fiber의 deletion 되는 애들은 다 제거한다.
  commitWork(wippRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  const domParent = fiber.parent.dom;

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

  domParent.appendChild(fiber.dom);
  commitWork(fiber, child);
  commitWork(fiber.sibling);
}

function render(element, container) {
  // set next unit of work
  nextUnitOfWork = wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };
  deletions = [];
}

let nextUnitOfWork = null;
let currentRoot = null;
let wipRoot = null;
let deletions = null;

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performUnitOfWork(fiber) {
  // * add dom node
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  // * create new fibers
  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);

  // * return next unit of work
  if (fiber.child) {
    return fiber.child; // 자식이 있으면 리턴
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      // 자식이 없으면 형재를 리턴한다.
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent; // 형재가 없으면 부모로 간다. 부모에서 while문이 돌아서 부모의 형재(uncle)이 있으면 리턴할것이다. 없다면 할아버지로 이동하겠지..
  }
  // 깊이 우선 탐색이 끝나고 #root의 자식을 다 돌고 나서 끝난다.
}

function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  while (index < elements.length || oldFiber != null) {
    // * oldFiber not null은 왜 있는걸까..
    const element = elements[index];
    const newFiber = null;

    // * compare oldFiber to element
    const sameType = oldFiber && element && element.type === oldFiber.type;
    if (sameType) {
      // update node
      newFiber = {
        type: oldFiber.type,
        props: element.props, // props는 새걸 쓴다.
        dom: oldFiber.dom, // document.createElement()를 새로 하지 않는다.
        parent: wipFiber,
        alternate: oldFiber, // 자식들도 old와 계속 비교한다.
        effectTag: "UPDATE", // commit phase에서 사용한다.
      };
    }

    if (element && !sameType) {
      // add this node
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null, // 자식도 전부 새로 만들어야 한다.
        effectTag: "PLACEMENT",
      };
    }

    if (oldFiber && !sameType) {
      // delete old fiber's node
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber; // 부모-자식 연결은 첫번째 자식만 한다.
    } else {
      prevSibling.sibling = newFiber; // 나머지 자식은 첫번째 자식의 형제 - 그의 형제 - ... 이런식으로 이어진다.
    }

    prevSibling = newFiber;
    index++;
  }
}

export default Didact = { createElement, render };
