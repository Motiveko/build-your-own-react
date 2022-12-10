/** @jsx Didact.createElement */
import Didact from "./Didact/index.js";

function ResultOdd({ data }) {
  const [name, _] = Didact.useState("Odd");
  return (
    <div>
      Result {name}: {data}
    </div>
  );
}

function ResultEven({ data }) {
  const [name, _] = Didact.useState("Even");
  return (
    <div>
      Result {name}: {data}
    </div>
  );
}

function Counter() {
  const [count, setCount] = Didact.useState(1);
  return (
    <div>
      <button onClick={() => setCount((v) => v + 1)}>클릭</button>
      {count % 2 === 0 ? (
        <ResultEven data={count} />
      ) : (
        <ResultOdd data={count} />
      )}
    </div>
  );
}

const element = <Counter />;
const container = document.getElementById("root");

Didact.render(element, container);
