import CurvedLoop from "./components/CurvedLoop";
import ClickSpark from "./components/ClickSpark";
import GridMotion from "./components/GridMotion";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  return (
    <>
      <ClickSpark
        sparkColor='#fff'
        sparkSize={10}
        sparkRadius={15}
        sparkCount={8}
        duration={400}
      >
        <CurvedLoop marqueeText="Welcome to Play-ON!✦" />
      </ClickSpark>
    </>
  );
}

export default App;
