import React, { useState } from "react";
import { Meta, StoryObj } from "@storybook/react";
import ModularDrawerAddAccountFlowManager, {
  ModularDrawerAddAccountFlowManagerProps,
} from "./ModularDrawerAddAccountFlowManager";
import { bitcoinCurrency } from "./__mocks__/useSelectAssetFlow.mock";
import { Provider } from "react-redux";
import { legacy_createStore as createStore } from "redux";
import { triggerComplete, triggerNext } from "./__mocks__/bridge.mock";
import { BTC_ACCOUNT } from "./__mocks__/accounts.mock";
import { Account } from "@ledgerhq/types-live";

let accountsStore: Account[] = [];

const store = createStore(() => ({
  accounts: accountsStore,
}));

const ScanControls = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [scanComplete, setScanComplete] = useState(false);

  const handleAddAccount = () => {
    const newAccount = {
      ...BTC_ACCOUNT,
      id: accounts.length + 1 + BTC_ACCOUNT.id.slice(1),
    };
    setAccounts([...accounts, newAccount]);

    triggerNext(newAccount);
  };

  const handleComplete = () => {
    setScanComplete(true);
    triggerComplete();
    accountsStore = accounts;
  };

  return (
    <div style={{ marginBottom: "16px", gap: "8px", display: "flex", flexDirection: "column" }}>
      Controls for mocking Blockchain account search
      <button
        onClick={handleAddAccount}
        style={{
          flex: 1,
          padding: "10px",
          background: scanComplete ? "grey" : "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: scanComplete ? "default" : "pointer",
        }}
        disabled={scanComplete}
      >
        Add Account #{accounts.length + 1}
      </button>
      <button
        onClick={handleComplete}
        style={{
          flex: 1,
          padding: "10px",
          background: "#28a745",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: scanComplete ? "default" : "pointer",
        }}
        disabled={scanComplete}
      >
        {scanComplete ? "Scan Complete" : "Finish Scan"}
      </button>
    </div>
  );
};

const meta: Meta<ModularDrawerAddAccountFlowManagerProps> = {
  title: "ModularDrawer/ModularDrawerAddAccountFlowManager",
  component: ModularDrawerAddAccountFlowManager,
  args: { currency: bitcoinCurrency },
  decorators: [
    Story => {
      return (
        <div
          style={{
            width: "500px",
            margin: "0 auto",
          }}
        >
          <ScanControls />
          <div
            style={{
              position: "relative",
              width: "450px",
              height: "80vh",
            }}
          >
            <Provider store={store}>
              <Story />
            </Provider>
          </div>
        </div>
      );
    },
  ],
};

export default meta;

export const ModularDrawerAddAccountFlow: StoryObj<ModularDrawerAddAccountFlowManagerProps> = {};
