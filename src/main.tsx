import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { GamePage } from "./components/GamePage";
import "./styles.css";

const isGameRoute = window.location.pathname.replace(/\/$/, "").endsWith("/game");
const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
if (isGameRoute) {
  themeColor?.setAttribute("content", "#151514");
  document.title = "Play Loto + Art";
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isGameRoute ? <GamePage /> : <App />}
  </React.StrictMode>,
);
