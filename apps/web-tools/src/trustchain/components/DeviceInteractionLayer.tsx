import React from "react";
import { Spinner } from "./Spinner";

export function DeviceInteractionLayer({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "fixed",
        zIndex: 99,
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "#ffffffaa",
        boxSizing: "border-box",
        padding: "10%",
        fontSize: "2em",
        textAlign: "center",
      }}
    >
      <div
        style={{
          color: "black",
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          maxWidth: 400,
        }}
      >
        {"⚠︎ Please accept the interaction on your device"}
      </div>
    </div>
  );
}
