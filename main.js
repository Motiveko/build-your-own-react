/** @jsx Didact.createElement */
import Didact from "./Didact"


const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
)
const container = document.getElementById("root")
Didact.render(element, container)