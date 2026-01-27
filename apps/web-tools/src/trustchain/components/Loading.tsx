import React from "react";
import { Spinner } from "./Spinner";

export function Loading() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 10,
        color: "#666",
      }}
    >
      <div style={{ position: "relative", width: 40 }}>
        <Spinner />
      </div>{" "}
      Loading...
    </div>
  );
}
