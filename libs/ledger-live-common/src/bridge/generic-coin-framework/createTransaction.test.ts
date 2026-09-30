import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { createTransaction } from "./createTransaction";

describe("createTransaction", () => {
  it("returns the EVM default transaction with the configured chain id", () => {
    LiveConfig.setConfig({
      config_currency_ethereum: { type: "object", default: { chainId: 1 } },
    } as never);

    const account = {
      type: "Account",
      currency: getCryptoCurrencyById("ethereum"),
    } as unknown as Account;

    expect(createTransaction(account)).toEqual({
      mode: "send",
      type: 2,
      family: "evm",
      amount: new BigNumber(0),
      recipient: "",
      useAllAmount: false,
      feesStrategy: "medium",
      chainId: 1,
      gasLimit: new BigNumber(21000),
      maxFeePerGas: new BigNumber(0),
      maxPriorityFeePerGas: new BigNumber(0),
    });
  });

  it("throws for an EVM currency with no configuration", () => {
    LiveConfig.setConfig({
      config_currency_polygon: { type: "object", default: { chainId: 137 } },
    } as never);

    const account = {
      type: "Account",
      currency: getCryptoCurrencyById("ethereum"),
    } as unknown as Account;

    expect(() => createTransaction(account)).toThrow(
      "No currency configuration available for ethereum",
    );
  });
  it("returns the Cardano default transaction with a zero nonce", () => {
    const account = {
      type: "Account",
      currency: getCryptoCurrencyById("cardano"),
    } as unknown as Account;

    expect(createTransaction(account)).toEqual({
      family: "cardano",
      amount: new BigNumber(0),
      recipient: "",
      fees: null,
      useAllAmount: false,
      mode: "send",
      nonce: new BigNumber(0),
    });
  });

  it("returns the Tron default native send transaction", () => {
    const account = {
      type: "Account",
      currency: getCryptoCurrencyById("tron"),
    } as unknown as Account;

    expect(createTransaction(account)).toEqual({
      family: "tron",
      amount: new BigNumber(0),
      recipient: "",
      fees: null,
      useAllAmount: false,
      mode: "send",
      familySpecificData: { resource: null, duration: 3, votes: [] },
    });
  });

  it("returns the VeChain default native send transaction with a zero nonce", () => {
    const account = {
      type: "Account",
      currency: getCryptoCurrencyById("vechain"),
    } as unknown as Account;

    expect(createTransaction(account)).toEqual({
      family: "vechain",
      amount: new BigNumber(0),
      recipient: "",
      fees: null,
      useAllAmount: false,
      mode: "send",
      nonce: new BigNumber(0),
    });
  });

  it("returns the Stacks default native send transaction", () => {
    const account = {
      type: "Account",
      currency: getCryptoCurrencyById("stacks"),
    } as unknown as Account;

    expect(createTransaction(account)).toEqual({
      family: "stacks",
      amount: new BigNumber(0),
      recipient: "",
      fees: null,
      useAllAmount: false,
      mode: "send",
      assetReference: "",
      assetOwner: "",
    });
  });

  it("returns the Kaspa default native send transaction", () => {
    const account = {
      type: "Account",
      currency: getCryptoCurrencyById("kaspa"),
    } as unknown as Account;

    expect(createTransaction(account)).toEqual({
      family: "kaspa",
      amount: new BigNumber(0),
      recipient: "",
      fees: null,
      useAllAmount: false,
      mode: "send",
      feesStrategy: "fast",
      nonce: new BigNumber(0),
    });
  });

  it("returns the Casper default native send transaction", () => {
    const account = {
      type: "Account",
      currency: getCryptoCurrencyById("casper"),
    } as unknown as Account;

    expect(createTransaction(account)).toEqual({
      family: "casper",
      amount: new BigNumber(0),
      recipient: "",
      fees: null,
      useAllAmount: false,
      mode: "send",
      memoType: null,
      memoValue: null,
      nonce: new BigNumber(0),
    });
  });

  it("throws for an unsupported currency family", () => {
    const account = {
      type: "Account",
      currency: { family: "not-a-real-family" },
    } as unknown as Account;

    expect(() => createTransaction(account)).toThrow(
      "Unsupported currency family: not-a-real-family",
    );
  });
});
