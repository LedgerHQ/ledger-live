import type { SendTransaction } from "../../registry";
import BigNumber from "bignumber.js";
import { buildTransactionPatchFromURIScheme } from "../uriScheme";

describe("buildTransactionPatchFromURIScheme", () => {
  const baseTransaction = {
    family: "bitcoin",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    utxoStrategy: {
      strategy: 0,
      excludeUTXOs: [],
    },
    rbf: false,
    feePerByte: null,
    networkInfo: null,
  } as SendTransaction;

  it("returns an empty patch when the URI has no amount or matching extras", () => {
    expect(
      buildTransactionPatchFromURIScheme(baseTransaction, {
        address: "bc1qxy",
      }),
    ).toEqual({});
  });

  it("prefills amount and disables useAllAmount when amount is positive", () => {
    const amount = new BigNumber("123450000");

    expect(
      buildTransactionPatchFromURIScheme(baseTransaction, {
        address: "bc1qxy",
        amount,
      }),
    ).toEqual({
      amount,
      useAllAmount: false,
    });
  });

  it("ignores zero or missing amounts", () => {
    expect(
      buildTransactionPatchFromURIScheme(baseTransaction, {
        address: "bc1qxy",
        amount: new BigNumber(0),
      }),
    ).toEqual({});
  });

  it("applies coin-specific fields that already exist on the transaction", () => {
    const ethTransaction = {
      family: "evm",
      mode: "send",
      nonce: 0,
      gasLimit: new BigNumber(21000),
      chainId: 1,
      type: 0,
      amount: new BigNumber(0),
      recipient: "",
      useAllAmount: false,
      gasPrice: new BigNumber(1),
    } as SendTransaction;
    const amount = new BigNumber("1000000000000000000");
    const userGasLimit = new BigNumber(50000);
    const gasPrice = new BigNumber(20);

    expect(
      buildTransactionPatchFromURIScheme(ethTransaction, {
        address: "0xabc",
        amount,
        userGasLimit,
        gasPrice,
        family: "bitcoin",
        recipient: "attacker-controlled-recipient",
        useAllAmount: true,
        mode: "delegate",
        unknownField: "ignored",
      }),
    ).toEqual({
      amount,
      useAllAmount: false,
      customGasLimit: userGasLimit,
      gasPrice,
    });
  });

  it("does not apply coin-specific fields absent from the transaction", () => {
    const amount = new BigNumber("1000");

    expect(
      buildTransactionPatchFromURIScheme(baseTransaction, {
        address: "bc1qxy",
        amount,
        userGasLimit: new BigNumber(50000),
      }),
    ).toEqual({
      amount,
      useAllAmount: false,
    });
  });

  it("does not apply EVM fields to another transaction family with similar fields", () => {
    const transactionWithGasLimit = Object.assign({}, baseTransaction, {
      gasLimit: new BigNumber(21000),
    });

    expect(
      buildTransactionPatchFromURIScheme(transactionWithGasLimit, {
        address: "bc1qxy",
        userGasLimit: new BigNumber(50000),
      }),
    ).toEqual({});
  });

  it("does not apply gasPrice to an EIP-1559 transaction", () => {
    const eip1559Transaction = {
      family: "evm",
      mode: "send",
      nonce: 0,
      gasLimit: new BigNumber(21000),
      chainId: 1,
      type: 2,
      amount: new BigNumber(0),
      recipient: "",
      useAllAmount: false,
      gasPrice: undefined,
      maxFeePerGas: new BigNumber(10),
      maxPriorityFeePerGas: new BigNumber(1),
    } as SendTransaction;

    expect(
      buildTransactionPatchFromURIScheme(eip1559Transaction, {
        address: "0xabc",
        gasPrice: new BigNumber(20),
      }),
    ).toEqual({});
  });

  it("ignores invalid values for allowlisted fields", () => {
    const ethTransaction = {
      family: "evm",
      mode: "send",
      nonce: 0,
      gasLimit: new BigNumber(21000),
      chainId: 1,
      type: 0,
      amount: new BigNumber(0),
      recipient: "",
      useAllAmount: false,
      gasPrice: new BigNumber(1),
    } as SendTransaction;

    expect(
      buildTransactionPatchFromURIScheme(ethTransaction, {
        address: "0xabc",
        amount: new BigNumber(Infinity),
        userGasLimit: "50000",
        gasPrice: new BigNumber(Infinity),
      }),
    ).toEqual({});
  });
});
