import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { Account, Operation } from "@ledgerhq/types-live";
import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { closeModal, openModal } from "~/renderer/actions/modals";
import { getLLDCoinFamily } from "~/renderer/families";
import EditOperationPanel from "../EditOperationPanel";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({}),
}));

jest.mock("~/renderer/actions/modals", () => ({
  ...jest.requireActual("~/renderer/actions/modals"),
  closeModal: jest.fn(),
  openModal: jest.fn(),
}));

jest.mock("~/renderer/families", () => ({
  getLLDCoinFamily: jest.fn(() => ({})),
}));

const evmAccount = genAccount("edit-operation-panel-account", {
  currency: getCryptoCurrencyById("ethereum"),
}) as Account;
const bitcoinAccount = {
  ...genAccount("edit-operation-panel-bitcoin-account", {
    currency: getCryptoCurrencyById("bitcoin"),
  }),
  freshAddress: "bc1qfreshaddress",
} as Account;
const parentAccount = undefined;
const operation = {
  hash: "tx-hash",
  blockHeight: undefined,
  transactionRaw: undefined,
} as unknown as Operation;

const renderComponent = (account: Account, overrideInitialState?: Record<string, unknown>) =>
  render(
    <EditOperationPanel account={account} parentAccount={parentAccount} operation={operation} />,
    {
      initialState: overrideInitialState,
    },
  );

describe("EditOperationPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (closeModal as jest.Mock).mockImplementation((modal: string) => ({
      type: "closeModal",
      payload: modal,
    }));
    (openModal as jest.Mock).mockImplementation((modal: string, data: unknown) => ({
      type: "openModal",
      payload: { modal, data },
    }));
    (getLLDCoinFamily as jest.Mock).mockReturnValue({});
  });

  it("should not render panel when no edit flow is supported", () => {
    renderComponent(evmAccount);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("should open family modal with family params when supported by coin family", async () => {
    const familyParams = { accountId: "acc-1", transactionHash: "family-tx-hash" };
    (getLLDCoinFamily as jest.Mock).mockReturnValue({
      handlesEditTransaction: () => ({
        modalName: "MODAL_EVM_EDIT_TRANSACTION",
        params: familyParams,
      }),
    });

    const { user } = renderComponent(evmAccount);

    await user.click(screen.getByText("Speed up or Cancel"));

    expect(closeModal).toHaveBeenCalledWith("MODAL_SEND");
    expect(openModal).toHaveBeenCalledWith("MODAL_EVM_EDIT_TRANSACTION", familyParams);
  });

  it("should open bitcoin modal with family params", async () => {
    const familyParams = {
      account: bitcoinAccount,
      parentAccount,
      transactionRaw: {
        family: "bitcoin" as const,
        amount: "0",
        recipient: "bc1qfreshaddress",
        rbf: true,
        replaceTxId: "tx-hash",
        utxoStrategy: { strategy: 0, excludeUTXOs: [] },
        feePerByte: null,
        networkInfo: null,
      },
      transactionHash: "tx-hash",
    };
    (getLLDCoinFamily as jest.Mock).mockReturnValue({
      handlesEditTransaction: () => ({
        modalName: "MODAL_BITCOIN_EDIT_TRANSACTION",
        params: familyParams,
      }),
    });
    const { user } = renderComponent(
      bitcoinAccount,
      withFlagOverrides({
        editBitcoinTx: { enabled: true, params: { supportedCurrencyIds: ["bitcoin"] } },
      }),
    );

    await user.click(screen.getByText("Speed up or Cancel"));

    expect(openModal).toHaveBeenCalledWith("MODAL_BITCOIN_EDIT_TRANSACTION", familyParams);
  });
});
