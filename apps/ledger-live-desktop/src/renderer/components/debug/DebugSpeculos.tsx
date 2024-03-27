import React from "react";

export const DebugSpeculos = () => {
  return (
    <div
      style={{
        top: 0,
        left: 0,
        width: 303,
        height: 90,
      }}
    >
      <iframe src="http://127.0.0.1:5000" scrolling="no"></iframe>
    </div>
  );
};

export default DebugSpeculos;
