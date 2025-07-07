import { Account } from "@ledgerhq/types-live";
import React from "react";

export const prepareCurrency = () => {};

const DeviceAction = ({
  onResult,
}: {
  onResult: (res: { device: { deviceId: string } }) => void;
}) => (
  <div
    style={{
      background: "#f9f9f9",
      padding: "20px",
      borderRadius: "6px",
      maxWidth: "400px",
      margin: "40px auto",
      textAlign: "center",
    }}
  >
    <h2 style={{ marginBottom: "12px" }}>Mocked DeviceAction</h2>
    <button
      onClick={() => onResult({ device: { deviceId: "stax" } })}
      style={{
        padding: "10px 16px",
        background: "#007bff",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
      }}
    >
      Trigger device connected and unlocked
    </button>
  </div>
);
export default DeviceAction;

export const renderError = () => <h1>Error</h1>;

export let triggerNext: (account: Account) => void = () => null;
export let triggerComplete: () => void = () => null;

export const getCurrencyBridge = () => ({
  scanAccounts: () => ({
    subscribe: ({
      next,
      complete,
    }: {
      next: ({ account }: { account: Account }) => void;
      complete: () => void;
    }) => {
      triggerNext = account => next({ account });
      triggerComplete = () => complete();
    },
  }),
});
