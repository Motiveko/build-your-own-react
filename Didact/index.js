// FOR JEST ENVIROMENT
if (!window.requestIdleCallback) {
  window.requestIdleCallback = () => {};
}

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
      nodeValue: text,
      children: [],
    },
  };
}

function createDom(fiber) {
  const dom =
    fiber.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);
  updateDom(dom, {}, fiber.props);

  return dom;
}
const isEvent = (key) => key.startsWith("on");
const isProperty = (key) =>
  key !== "children" && !isEvent(key) && key !== "style";
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (prev, next) => (key) => !(key in next);

function updateDom(dom, prevProps, nextProps) {
  // Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(
      (key) =>
        // isGone or isNew, 업데이트가 안되기 때문에 무조건 지운다.
        !(key in nextProps) || prevProps[key] !== nextProps[key]
    )
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

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
      dom[name] = nextProps[name];
    });

  const prevStyle = prevProps.style || {};
  const nextStyle = nextProps.style || {};

  // Remove old style
  Object.keys(prevStyle)
    .filter(isGone(prevStyle, nextStyle))
    .forEach((name) => {
      delete dom.style[name];
    });

  // set new style
  Object.keys(nextStyle)
    .filter(isNew(prevStyle, nextStyle))
    .forEach((name) => {
      dom.style[name] = nextStyle[name];
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
  deletions.forEach(commitWork); // old fiber의 deletion 되는 애들은 다 제거한다.
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }

  // parent fiber가 FC인 경우 fiber.dom이 없기 때문에 dom을 가진 fiber가 나올때까지 계속 트리 위로 올라간다.
  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;

  if (
    fiber.effectTag === "PLACEMENT" &&
    fiber.dom != null // null check.. => FC의 경우 dom이 없을수도 있다.
  ) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    // 이미 사용중인 dom의 properties만 바꾸는것. appendChild 할 필요가없다.(자식을 update한다는건 부모도 update 했다는 뜻)
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    /**
     * * old fiber의 경우에만 실행됨
     * * 강의에 버그가 있는데, return을 해줘서 더이상 commitWork가 실행되지 않도록 해야 한다. 왜냐면 oldfiber는 지우기만 할 뿐이기 때문이다.
     */
    return commitDeletion(fiber, domParent);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber, domParent) {
  /**
   * FC의 경우 지우려고 해도 dom이 없기 때문에 dom이 나올때까지 자식 노드로 접근해서 지운다.
   * 이게 가능한 이유는, React의 FC는 dom이든 FC든 **하나의 요소**만 반환할 수 있기 때문이다.(트리상 자식은 하나)
   */
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
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
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

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

let wipFiber = null;
let hookIndex = null;
function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const children = [fiber.type(fiber.props)]; // fc 실행
  reconcileChildren(fiber, children);
}

function useState(initial) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  };

  /**
   * * setState에 전달한 상태변경 action수행.
   * * setState 호출시 hook(결국 다음 랜더의 oldHook)의 queue에 액션을 넣고 nextUnitOfWork 재할당으로 render phase가 재실행된다.
   * * 이 때 FC 노드를 만나면 useState()가 호출되는데, 이 때 oldHook의 queue를 참조해야 setState()에서 전달한 action을 호출할 수 있게 된다.(다음 랜더이기 때문이다.. 복잡하다..)
   */
  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = action(hook.state);
  });

  const setState = (action) => {
    hook.queue.push(action);
    // * setState 호출시 랜더 페이즈가 다시 시작될 수 있게 한다.
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
}

function updateHostComponent(fiber) {
  // * add dom node
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  // * create new fibers(by reconcile)
  reconcileChildren(fiber, fiber.props.children);
}

function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  while (index < elements.length || oldFiber != null) {
    // * oldFiber not null은 왜 있는걸까..
    const element = elements[index];
    let newFiber = null;

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

const Didact = { createElement, render, useState };
export default Didact;
