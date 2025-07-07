import React from "react";

export const prepareCurrency = () => {
  console.log("preparing currency");
};

const DeviceAction = ({ onResult }: { onResult: (v: any) => void }) => (
  <h1>
    Connect Device
    <button onClick={() => onResult({ device: { deviceId: "stax" } })}>continue</button>
  </h1>
);
export default DeviceAction;

export const renderError = () => <h1>Error</h1>;

export const getCurrencyBridge = () => ({ scanAccounts: () => ({ subscribe: () => ({}) }) });
