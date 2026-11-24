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

const sanctioned = (...addresses: string[]) => {
  const sanctionedAddresses = new Set(addresses);
  isAddressSanctionedMock.mockImplementation((_currency, address) =>
    Promise.resolve(sanctionedAddresses.has(address)),
  );
};

const statusWith = async (patch: Partial<Transaction> = {}) =>
  (await wrappedBridge()).getTransactionStatus(account, { ...transaction, ...patch });

describe("wrapAccountBridge sanctioned addresses check", () => {
  beforeEach(() => {
    isAddressSanctionedMock.mockReset();
    isCheckSanctionedAddressEnabledMock.mockReturnValue(true);
  });

  it("returns the status of the blockchain when the check is disabled", async () => {
    isCheckSanctionedAddressEnabledMock.mockReturnValue(false);

    expect(await statusWith()).toEqual(blockchainStatus);
  });

  it("does not look up any address when the check is disabled", async () => {
    isCheckSanctionedAddressEnabledMock.mockReturnValue(false);

    await statusWith();

    expect(isAddressSanctionedMock).not.toHaveBeenCalled();
  });

  it("looks up the recipient then the sender in the currency of the account", async () => {
    sanctioned();

    await statusWith();

    expect(isAddressSanctionedMock.mock.calls).toEqual([
      [account.currency, RECIPIENT],
      [account.currency, account.freshAddress],
    ]);
  });

  it("adds a sanctioned recipient error and no sender error when only the recipient is sanctioned", async () => {
    sanctioned(RECIPIENT);

    const status = await statusWith();

    expect({
      errors: Object.keys(status.errors).sort(),
      recipient: status.errors.recipient,
    }).toMatchObject({
      errors: ["amount", "recipient"],
      recipient: { name: "AddressesSanctionedError", addresses: [RECIPIENT] },
    });
  });

  it("adds a sanctioned sender error and no recipient error when only the sender is sanctioned", async () => {
    sanctioned(account.freshAddress);

    const status = await statusWith();

    expect({
      errors: Object.keys(status.errors).sort(),
      sender: status.errors.sender,
    }).toMatchObject({
      errors: ["amount", "sender"],
      sender: { name: "AddressesSanctionedError", addresses: [account.freshAddress] },
    });
  });

  it("keeps the warnings and the amount of the blockchain next to the sanctions errors", async () => {
    sanctioned(RECIPIENT, account.freshAddress);

    const status = await statusWith();

    expect({
      errors: Object.keys(status.errors).sort(),
      warnings: status.warnings,
      amount: status.amount,
    }).toEqual({
      errors: ["amount", "recipient", "sender"],
      warnings: blockchainStatus.warnings,
      amount: blockchainStatus.amount,
    });
  });

  it("keeps the errors of the blockchain when no address is sanctioned", async () => {
    sanctioned();

    expect((await statusWith()).errors).toEqual(blockchainStatus.errors);
  });

  it("checks the sender only when the transaction has no recipient", async () => {
    sanctioned();

    await statusWith({ recipient: "" });

    expect(isAddressSanctionedMock.mock.calls).toEqual([[account.currency, account.freshAddress]]);
  });
});
