import { Counter } from "./Counter.js";
import electron from "electron";

export default function App({ name = "Anonymous" }) {
  return (
    <div style={{ border: "3px red dashed", margin: "1em", padding: "1em" }}>
      <h1>Hello {name}!!</h1>
      <h3>
        This is a server component running on Electron v
        {electron.app.getVersion()}.
      </h3>
      <p>{Math.random()}</p>
      <Counter />
    </div>
  );
}
