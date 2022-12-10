/** @jsx Didact.createElement */
import Didact from "./Didact/index.js";

function ResultOdd({ data }) {
  const [name, _] = Didact.useState("Odd");
  return (
    <div style={{
      backgroundColor: 'yellow',
      fontSize: `${20 + data}px`,
      fontWeight: 'bold'
    }}>
      {name} - {data}
    </div>
  );
}

function ResultEven({ data }) {
  const [name, _] = Didact.useState("Even");
  return (
    <div style={{
      backgroundColor: 'lightBlue',
      fontSize: `${20 + data}px`,
      fontWeight: 'bolder'
    }}>
      {name} - {data}
    </div>
  );
}

function Result({data}) {
  return (
    <h1 style={{fontSize: `${25 + data}px`, backgroundColor: 'orange'}}>RESULT...</h1>
  )
}

function Counter() {
  const [count, setCount] = Didact.useState(1);
  return (
    <div>
      <button onClick={() => setCount((v) => v + 1)}>클릭</button>
      <Result data={count} />
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
