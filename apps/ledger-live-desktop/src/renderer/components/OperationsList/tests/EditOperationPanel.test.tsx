import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { Account, Operation } from "@ledgerhq/types-live";
import React from "react";
import { render, screen } from "tests/testSetup";
import { closeModal, openModal } from "~/renderer/actions/modals";
import { getLLDCoinFamily } from "~/renderer/families";
import EditOperationPanel from "../EditOperationPanel";

jest.mock("@ledgerhq/live-common/account/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/account/index"),
  getMainAccount: jest.fn(),
}));

jest.mock("~/renderer/actions/modals", () => ({
  ...jest.requireActual("~/renderer/actions/modals"),
  closeModal: jest.fn(),
  openModal: jest.fn(),
}));

jest.mock("~/renderer/families", () => ({
  getLLDCoinFamily: jest.fn(() => ({})),
}));

const account = genAccount("edit-operation-panel-account") as Account;
const parentAccount = undefined;
const operation = {
  hash: "tx-hash",
  blockHeight: undefined,
  transactionRaw: undefined,
} as unknown as Operation;

const renderComponent = (overrideInitialState?: Record<string, unknown>) =>
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
    (getMainAccount as jest.Mock).mockReturnValue({
      ...account,
      currency: { ...account.currency, family: "evm", id: "ethereum" },
    });
    renderComponent();

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("should open family modal with family params when supported by coin family", async () => {
    const familyParams = { accountId: "acc-1", transactionHash: "family-tx-hash" };
    (getMainAccount as jest.Mock).mockReturnValue({
      ...account,
      currency: { ...account.currency, family: "evm", id: "ethereum" },
    });
    (getLLDCoinFamily as jest.Mock).mockReturnValue({
      handlesEditTransaction: () => ({
        modalName: "MODAL_EVM_EDIT_TRANSACTION",
        params: familyParams,
      }),
    });

    const { user } = renderComponent();

    await user.click(screen.getByText("Speed up or Cancel"));

    expect(closeModal).toHaveBeenCalledWith("MODAL_SEND");
    expect(openModal).toHaveBeenCalledWith("MODAL_EVM_EDIT_TRANSACTION", familyParams);
  });

  it("should open bitcoin modal with family params", async () => {
    const familyParams = {
      account,
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
    (getMainAccount as jest.Mock).mockReturnValue({
      ...account,
      freshAddress: "bc1qfreshaddress",
      currency: { ...account.currency, family: "bitcoin", id: "bitcoin", ticker: "BTC" },
    });
    (getLLDCoinFamily as jest.Mock).mockReturnValue({
      handlesEditTransaction: () => ({
        modalName: "MODAL_BITCOIN_EDIT_TRANSACTION",
        params: familyParams,
      }),
    });
    const { user } = renderComponent({
      settings: {
        overriddenFeatureFlags: {
          editBitcoinTx: {
            enabled: true,
            params: { supportedCurrencyIds: ["bitcoin"] },
          },
        },
      },
    });

    await user.click(screen.getByText("Speed up or Cancel"));

    expect(openModal).toHaveBeenCalledWith("MODAL_BITCOIN_EDIT_TRANSACTION", familyParams);
  });
});
