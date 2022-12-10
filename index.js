/** @jsx Didact.createElement */
import Didact from "./Didact/index.js";

function ResultOdd({
  data
}) {
  const [name, _] = Didact.useState("Odd");
  return Didact.createElement("div", null, "Result ", name, ": ", data);
}

function ResultEven({
  data
}) {
  const [name, _] = Didact.useState("Even");
  return Didact.createElement("div", null, "Result ", name, ": ", data);
}

function Counter() {
  const [count, setCount] = Didact.useState(1);
  return Didact.createElement("div", null, Didact.createElement("button", {
    onClick: () => setCount(v => v + 1)
  }, "\uD074\uB9AD"), count % 2 === 0 ? Didact.createElement(ResultEven, {
    data: count
  }) : Didact.createElement(ResultOdd, {
    data: count
  }));
}

const element = Didact.createElement(Counter, null);
const container = document.getElementById("root");
Didact.render(element, container);
