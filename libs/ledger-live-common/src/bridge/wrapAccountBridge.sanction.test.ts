import BigNumber from "bignumber.js";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import type { Transaction, TransactionStatus } from "@ledgerhq/coin-bitcoin/types";
import mockBridge from "../families/bitcoin/bridge/mock";

jest.mock("@ledgerhq/ledger-wallet-framework/sanction/index", () => ({
  isAddressSanctioned: jest.fn(),
  isCheckSanctionedAddressEnabled: jest.fn(),
}));

import {
  isAddressSanctioned,
  isCheckSanctionedAddressEnabled,
} from "@ledgerhq/ledger-wallet-framework/sanction/index";
import { wrapAccountBridge } from "./impl";

const isAddressSanctionedMock = jest.mocked(isAddressSanctioned);
const isCheckSanctionedAddressEnabledMock = jest.mocked(isCheckSanctionedAddressEnabled);

const account = createFixtureAccount();
const RECIPIENT = "bc1qqmxqdrkxgx6swrvjl9l2e6szvvkg45all5u4fl";

const blockchainStatus: TransactionStatus = {
  errors: { amount: new Error("blockchain amount error") },
  warnings: { feeTooHigh: new Error("blockchain fee warning") },
  estimatedFees: new BigNumber(250),
  amount: new BigNumber(1000),
  totalSpent: new BigNumber(1250),
  txInputs: undefined,
  txOutputs: undefined,
  opReturnData: undefined,
  changeAddress: undefined,
};

const transaction: Transaction = {
  ...mockBridge.accountBridge.createTransaction(account),
  recipient: RECIPIENT,
  amount: new BigNumber(1000),
};

const wrappedBridge = () =>
  wrapAccountBridge<Transaction>(
    {
      ...mockBridge.accountBridge,
      getTransactionStatus: jest.fn().mockResolvedValue(blockchainStatus),
    },
    "bitcoin",
  );

describe("wrapAccountBridge sanctioned addresses check", () => {
  beforeEach(() => {
    isAddressSanctionedMock.mockReset();
  });

  it("returns the status of the blockchain when the check is disabled", async () => {
    isCheckSanctionedAddressEnabledMock.mockReturnValue(false);

    const status = await (await wrappedBridge()).getTransactionStatus(account, transaction);

    expect(status).toEqual(blockchainStatus);
  });

  it("does not look up any address when the check is disabled", async () => {
    isCheckSanctionedAddressEnabledMock.mockReturnValue(false);

    await (await wrappedBridge()).getTransactionStatus(account, transaction);

    expect(isAddressSanctionedMock).not.toHaveBeenCalled();
  });

  it("adds the sanctioned recipient and sender errors to the errors of the blockchain", async () => {
    isCheckSanctionedAddressEnabledMock.mockReturnValue(true);
    isAddressSanctionedMock.mockResolvedValue(true);

    const status = await (await wrappedBridge()).getTransactionStatus(account, transaction);

    expect({
      errors: Object.keys(status.errors).sort(),
      recipientError: status.errors.recipient?.name,
      senderError: status.errors.sender?.name,
      warnings: status.warnings,
      amount: status.amount,
    }).toEqual({
      errors: ["amount", "recipient", "sender"],
      recipientError: "AddressesSanctionedError",
      senderError: "AddressesSanctionedError",
      warnings: blockchainStatus.warnings,
      amount: blockchainStatus.amount,
    });
  });

  it("keeps the errors of the blockchain when no address is sanctioned", async () => {
    isCheckSanctionedAddressEnabledMock.mockReturnValue(true);
    isAddressSanctionedMock.mockResolvedValue(false);

    const status = await (await wrappedBridge()).getTransactionStatus(account, transaction);

    expect(status.errors).toEqual(blockchainStatus.errors);
  });

  it("checks the sender only when the transaction has no recipient", async () => {
    isCheckSanctionedAddressEnabledMock.mockReturnValue(true);
    isAddressSanctionedMock.mockResolvedValue(false);

    await (await wrappedBridge()).getTransactionStatus(account, { ...transaction, recipient: "" });

    expect(isAddressSanctionedMock.mock.calls.map(([, address]) => address)).toEqual([
      account.freshAddress,
    ]);
  });
});
