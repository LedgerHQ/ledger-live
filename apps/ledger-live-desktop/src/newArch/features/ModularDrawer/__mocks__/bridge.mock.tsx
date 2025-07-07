import React from "react";

export const prepareCurrency = () => {
  console.log("preparing currency");
};

const DeviceAction = ({ onResult }: { onResult: () => void }) => (
  <h1>
    Connect Device<button onClick={() => onResult()}>continue</button>
  </h1>
);
export default DeviceAction;
