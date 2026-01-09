import { Account } from "@ledgerhq/types-live";
import { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "@storybook/test";
import React, { useState } from "react";
import { Provider } from "react-redux";
import { legacy_createStore as createStore } from "redux";
import { accountsSelector, BTC_ACCOUNT } from "../__mocks__/accounts.mock";
import { bitcoinCurrency } from "../__mocks__/useSelectAssetFlow.mock";
import { triggerComplete, triggerNext } from "./__mocks__/bridge.mock";
import ModularDrawerAddAccountFlowManager, {
  ModularDrawerAddAccountFlowManagerProps,
} from "./ModularDrawerAddAccountFlowManager";

const store = createStore(() => ({
  accounts: [],
  modularDrawer: {
    source: "",
  },
  devices: { currentDevice: null },
  settings: { vaultSigner: { enabled: false } },
  currency: bitcoinCurrency,
}));

const ScanControls = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [scanComplete, setScanComplete] = useState(false);

  const handleAddAccount = () => {
    const newAccount = {
      ...BTC_ACCOUNT,
      id: accounts.length + 1 + BTC_ACCOUNT.id.slice(1),
      freshAddress: `id${accounts.length + 1}-${BTC_ACCOUNT.freshAddress.slice(4)}`,
    };
    triggerNext([...accounts, newAccount]);
    setAccounts([...accounts, newAccount]);
  };

  const handleComplete = () => {
    setScanComplete(true);
    triggerComplete();
    accountsSelector.mockImplementation(() => accounts);
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
  title: "ModularDialog/ModularDrawerAddAccountFlowManager",
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
              paddingTop: "50px",
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

export const testAddSingleAccountFlow: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByText("Trigger device connected and unlocked"));
    expect(canvas.getByText("Checking the blockchain...")).toBeInTheDocument();

    await userEvent.click(canvas.getByText("Add Account #1"));
    await userEvent.click(canvas.getByText("Finish Scan"));

    expect(canvas.getByText("We found 1 account")).toBeInTheDocument();
    await userEvent.click(canvas.getByText("Confirm"));

    expect(canvas.getByText("Account added to your portfolio")).toBeInTheDocument();

    await userEvent.click(canvas.getByText("Add funds to my account"));
    expect(canvas.getByText("Receive")).toBeInTheDocument();
  },
};

export const testAddMultipleAccountsFlow: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const waitForAnimationExit = (text: RegExp) =>
      waitFor(() => {
        const [el] = canvas.queryAllByText(text);
        if (canvas.queryAllByText(text).length !== 1) throw new Error();
        return el;
      });

    await userEvent.click(canvas.getByText("Trigger device connected and unlocked"));
    expect(canvas.getByText("Checking the blockchain...")).toBeInTheDocument();

    await userEvent.click(canvas.getByText("Add Account #1"));
    await userEvent.click(canvas.getByText("Add Account #2"));
    await userEvent.click(canvas.getByText("Finish Scan"));

    expect(canvas.getByText("We found 2 accounts")).toBeInTheDocument();

    await userEvent.click(canvas.getByText("Confirm"));
    expect(canvas.getByText("2 Accounts added to your portfolio")).toBeInTheDocument();

    await userEvent.click(canvas.getByText("Add funds to my account"));
    await waitForAnimationExit(/id1-/);
    await userEvent.click(canvas.getByText(/id1-/));
    expect(canvas.getByText("Receive")).toBeInTheDocument();
  },
};

export const ModularDrawerAddAccountFlow: StoryObj<ModularDrawerAddAccountFlowManagerProps> = {};
