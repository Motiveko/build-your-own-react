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

function render(element, container) {
  const dom =
    element.type !== "TEXT_ELEMENT"
      ? document.createElement(element.type)
      : document.createTextNode("");

  const isProperty = (key) => key !== 'children'

  Object.keys(dom.props)
    .filter(isProperty)
    .forEach(key => dom[key] = element.props[key]);

  element.props.children.forEach(child => render(child, dom));
  
  container.appendChild(dom);
}

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
  // TODO
}

export default Didact = { createElement, render };
