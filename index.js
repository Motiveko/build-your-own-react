/** @jsx Didact.createElement */
import Didact from "./Didact/index.js";

function ResultOdd({
  data
}) {
  const [name, _] = Didact.useState("Odd");
  return Didact.createElement("div", {
    style: {
      backgroundColor: 'yellow',
      fontSize: `${20 + data}px`,
      fontWeight: 'bold'
    }
  }, name, " - ", data);
}

function ResultEven({
  data
}) {
  const [name, _] = Didact.useState("Even");
  return Didact.createElement("div", {
    style: {
      backgroundColor: 'lightBlue',
      fontSize: `${20 + data}px`,
      fontWeight: 'bolder'
    }
  }, name, " - ", data);
}

function Result({
  data
}) {
  return Didact.createElement("h1", {
    style: {
      fontSize: `${25 + data}px`,
      backgroundColor: 'orange'
    }
  }, "RESULT...");
}

function Counter() {
  const [count, setCount] = Didact.useState(1);
  return Didact.createElement("div", null, Didact.createElement("button", {
    onClick: () => setCount(v => v + 1)
  }, "\uD074\uB9AD"), Didact.createElement(Result, {
    data: count
  }), count % 2 === 0 ? Didact.createElement(ResultEven, {
    data: count
  }) : Didact.createElement(ResultOdd, {
    data: count
  }));
}

const element = Didact.createElement(Counter, null);
const container = document.getElementById("root");
Didact.render(element, container);
