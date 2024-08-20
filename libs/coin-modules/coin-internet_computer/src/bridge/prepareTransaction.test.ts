import { getMockedBridgeHelpers, setup } from "../test/jest.mocks";
setup();

import BigNumber from "bignumber.js";
import { prepareTransaction } from "./prepareTransaction";
import {
  getEmptyAccount,
  ICP_CURRENCY_MOCK,
  SAMPLE_ICP_ADDRESS,
  SAMPLE_PUBLIC_KEY,
  VALID_ADDRESS_0,
  VALID_ADDRESS_1,
} from "../test/__fixtures__";
import { Transaction } from "../types";
import { getSubAccountIdentifier } from "@zondax/ledger-live-icp/utils";

describe("prepareTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should prepare a transaction with useAllAmount", async () => {
    const account = {
      ...getEmptyAccount(ICP_CURRENCY_MOCK),
      spendableBalance: new BigNumber(100000),
      balance: new BigNumber(100000),
      freshAddress: VALID_ADDRESS_0,
    };
    const transaction: Transaction = {
      family: "internet_computer",
      type: "send",
      amount: new BigNumber(0),
      recipient: VALID_ADDRESS_1,
      fees: new BigNumber(10000),
      useAllAmount: true,
    };

    const { getAddress } = getMockedBridgeHelpers().addresses;
    getAddress.mockReturnValue({
      address: SAMPLE_ICP_ADDRESS,
      derivationPath: "44'/223'/0'/0/0",
    });

    const result = await prepareTransaction(account, transaction);

    expect(result.amount).toEqual(new BigNumber(90000));
    expect(result.useAllAmount).toBe(true);
  });

  it("should not adjust amount with useAllAmount if addresses are invalid", async () => {
    const account = {
      ...getEmptyAccount(ICP_CURRENCY_MOCK),
      spendableBalance: new BigNumber(100000),
    };
    const transaction: Transaction = {
      family: "internet_computer",
      type: "send",
      amount: new BigNumber(0),
      recipient: "invalid-recipient-address",
      fees: new BigNumber(10000),
      useAllAmount: true,
    };

    const { getAddress } = getMockedBridgeHelpers().addresses;
    getAddress.mockReturnValue({
      address: SAMPLE_ICP_ADDRESS,
      derivationPath: "44'/223'/0'/0/0",
    });

    const result = await prepareTransaction(account, transaction);

    expect(result.amount).toEqual(new BigNumber(0));
  });

  it("should prepare a transaction for increasing stake", async () => {
    const account = getEmptyAccount(ICP_CURRENCY_MOCK);
    const transaction: Transaction = {
      family: "internet_computer",
      fees: new BigNumber(10000),
      type: "increase_stake",
      amount: new BigNumber(100000),
      recipient: "some-old-recipient",
      neuronAccountIdentifier: "neuron-account-id",
    };

    const result = await prepareTransaction(account, transaction);

    expect(result.recipient).toBe("neuron-account-id");
  });

  it("should prepare a transaction for creating a neuron", async () => {
    const account = {
      ...getEmptyAccount(ICP_CURRENCY_MOCK),
      xpub: SAMPLE_PUBLIC_KEY,
    };
    const transaction: Transaction = {
      family: "internet_computer",
      fees: new BigNumber(10000),
      type: "create_neuron",
      amount: new BigNumber(100000),
      recipient: "",
      memo: undefined,
    };

    const { getAddress } = getMockedBridgeHelpers().addresses;
    getAddress.mockReturnValue({
      address: VALID_ADDRESS_0,
      derivationPath: "44'/223'/0'/0/0",
    });

    (getSubAccountIdentifier as jest.Mock).mockReturnValue({
      identifier: "new-neuron-identifier",
      nonce: "12345",
    });

    const result = await prepareTransaction(account, transaction);

    expect(result.recipient).toBe("new-neuron-identifier");
    expect(result.memo).toBe("12345");
  });

  it("should not modify recipient for create_neuron if recipient is already set", async () => {
    const account = {
      ...getEmptyAccount(ICP_CURRENCY_MOCK),
      xpub: SAMPLE_PUBLIC_KEY,
    };
    const transaction: Transaction = {
      family: "internet_computer",
      fees: new BigNumber(10000),
      type: "create_neuron",
      amount: new BigNumber(100000),
      recipient: "already-set-recipient",
      memo: "some-memo",
    };

    const result = await prepareTransaction(account, transaction);

    expect(result.recipient).toBe("already-set-recipient");
    expect(result.memo).toBe("some-memo");
  });

  it("should return the transaction unmodified if no special conditions are met", async () => {
    const account = getEmptyAccount(ICP_CURRENCY_MOCK);
    const transaction: Transaction = {
      family: "internet_computer",
      type: "send",
      fees: new BigNumber(10000),
      amount: new BigNumber(50000),
      recipient: "some-recipient",
    };

    const { getAddress } = getMockedBridgeHelpers().addresses;
    getAddress.mockReturnValue({
      address: SAMPLE_ICP_ADDRESS,
      derivationPath: "44'/223'/0'/0/0",
    });

    const result = await prepareTransaction(account, { ...transaction });

    expect(result).toEqual(transaction);
  });
});
