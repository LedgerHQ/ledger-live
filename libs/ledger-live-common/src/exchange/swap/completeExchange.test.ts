import BigNumber from "bignumber.js";
import completeExchange from "./completeExchange";
import { Transaction } from "../../generated/types";
// import { Exchange } from "../../exchange/types";
import { genAccount } from "../../mock/account";
// import { DeviceModelId } from "@ledgerhq/devices";
import { DisconnectedDeviceDuringOperation } from "@ledgerhq/errors";
import { CompleteExchangeRequestEvent } from "../platform/types";
import { findCryptoCurrencyByTicker, findTokenById, setSupportedCurrencies } from "../../currencies";
import { Device } from "@ledgerhq/hw-transport";
import { createFixtureTokenAccount } from "../../mock/fixtures/cryptoCurrencies";

jest.mock("../../hw/deviceAccess", () => ({
  withDevicePromise: (_deviceId: string, fn: () => void) => fn(),
}));

jest.mock("../providers", () => ({
  ...jest.requireActual("../providers"),
  getSwapProvider: (name: string) => ({
    name,
    publicKey: {
      curve: "secp256k1",
      data: Buffer.from([0]),
    },
    version: 2,
    signature: Buffer.from([0]),
    useInExchangeApp: true,
  }),
}));

const exchangeMock = {
  startNewTransaction: jest.fn(),
  setPartnerKey: jest.fn(),
  checkPartner: jest.fn(),
  processTransaction: jest.fn(),
  checkTransactionSignature: jest.fn(),
  validatePayoutOrAsset: jest.fn(),
  checkRefundAddress: jest.fn(),
  signCoinTransaction: jest.fn(),
  getChallenge: jest.fn(),
  sendTrustedDescriptor: jest.fn(),
};
jest.mock("@ledgerhq/hw-app-exchange", () => {
  const originalModule = jest.requireActual("@ledgerhq/hw-app-exchange");

  return {
    __esModule: true,
    ...originalModule,
    // [Issue to retrieve partial mock with ESM](https://github.com/jestjs/jest/issues/15100)
    ExchangeTypes: {
      Swap: 0x00,
      Sell: 0x01,
      Fund: 0x02,
      SwapNg: 0x03,
      SellNg: 0x04,
      FundNg: 0x05,
    },
    createExchange: () => exchangeMock,
  };
});

describe("completeExchange", () => {
  beforeEach(() => {
    for (const [_, val] of Object.entries(exchangeMock)) {
      val.mockClear();
    }
  });

  it("returns an error if device is undefined", done => {
    // Given
    const device = undefined;
    const input = {
      exchangeType: 0, //ExchangeTypes.Swap,
      exchange: {
        fromAccount: genAccount("seed"),
        fromParentAccount: null,
        toAccount: genAccount("seed"),
        toParentAccount: null,
      },
      device,
      provider: "providerName",
      binaryPayload: "binaryPayload",
      signature: "signature",
      transaction: {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("0"),
        recipient: "recipient",
      } as Transaction,
    };

    // When
    completeExchange(input).subscribe((event: CompleteExchangeRequestEvent) => {
      // Then
      expect(event).toEqual({
        type: "complete-exchange-error",
        error: new DisconnectedDeviceDuringOperation(),
      });

      done();
    });
  });

  it("returns transaction to sign after validation", done => {
    // Given
    setSupportedCurrencies(["bitcoin", "ethereum"]);
    const device = {} as Device;
    const transaction = {
      family: "algorand",
      mode: "send",
      amount: new BigNumber("0"),
      recipient: "recipient",
    } as Transaction;
    const input = {
      exchangeType: 3, //ExchangeTypes.SwapNg,
      exchange: {
        fromAccount: genAccount("mock", {
          currency: findCryptoCurrencyByTicker("ETH") ?? undefined,
        }),
        fromParentAccount: null,
        toAccount: genAccount("mock", { currency: findCryptoCurrencyByTicker("BTC") ?? undefined }),
        toParentAccount: null,
      },
      device,
      provider: "providerName",
      binaryPayload: "binaryPayload",
      signature: Array.from({ length: 64 }, _ => "64").join(""),
      transaction,
    };

    // When
    const sub = completeExchange(input).subscribe((event: CompleteExchangeRequestEvent) => {
      // Then
      expect(event.type).not.toEqual("complete-exchange-error");

      if (event.type === "complete-exchange-result") {
        expect(event).toEqual({
          completeExchangeResult: {
            ...transaction,
            maxFeePerGas: new BigNumber("50"),
            maxPriorityFeePerGas: new BigNumber("50"),
            type: 2,
          },
          type: "complete-exchange-result",
        });

        sub.unsubscribe();
        done();
      }
    });
  });

  it("calls Exchange wrapper", done => {
    // Given
    setSupportedCurrencies(["bitcoin", "ethereum"]);
    const device = {} as Device;
    const transaction = {
      family: "algorand",
      mode: "send",
      amount: new BigNumber("0"),
      recipient: "recipient",
    } as Transaction;
    const input = {
      exchangeType: 3, //ExchangeTypes.SwapNg,
      exchange: {
        fromAccount: genAccount("mock", {
          currency: findCryptoCurrencyByTicker("ETH") ?? undefined,
        }),
        fromParentAccount: null,
        toAccount: genAccount("mock", { currency: findCryptoCurrencyByTicker("BTC") ?? undefined }),
        toParentAccount: null,
      },
      device,
      provider: "providerName",
      binaryPayload: "binaryPayload",
      signature: Array.from({ length: 64 }, _ => "64").join(""),
      transaction,
    };

    // When
    const sub = completeExchange(input).subscribe((event: CompleteExchangeRequestEvent) => {
      // Then
      expect(event.type).not.toEqual("complete-exchange-error");

      if (event.type === "complete-exchange-result") {
        expect(exchangeMock.setPartnerKey).toHaveBeenCalledTimes(1);
        expect(exchangeMock.checkPartner).toHaveBeenCalledTimes(1);
        expect(exchangeMock.processTransaction).toHaveBeenCalledTimes(1);
        expect(exchangeMock.checkTransactionSignature).toHaveBeenCalledTimes(1);
        expect(exchangeMock.validatePayoutOrAsset).toHaveBeenCalledTimes(1);
        expect(exchangeMock.checkRefundAddress).toHaveBeenCalledTimes(1);
        expect(exchangeMock.signCoinTransaction).toHaveBeenCalledTimes(1);
        expect(exchangeMock.getChallenge).toHaveBeenCalledTimes(0);
        expect(exchangeMock.sendTrustedDescriptor).toHaveBeenCalledTimes(0);

        sub.unsubscribe();
        done();
      }
    });
  });

  it.only("calls Exchange wrapper for SPL Token transaction", done => {
    // Given
    setSupportedCurrencies(["solana", "ethereum"]);
    const device = {} as Device;
    const tokenAccount = createFixtureTokenAccount(
      "token",
      // SPL USDC
      // Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB
      // findTokenById("solana/spl/epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v"),
      findTokenById("solana/spl/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
    );
    console.log("tokenAccount", tokenAccount);
    const transaction = {
      family: "solana",
      mode: "token.transfer",
      amount: new BigNumber("0"),
      recipient: "recipient",
      model: {
        kind: "token.transfer",
        uiState: {
          subAccountId: tokenAccount.id,
        },
      },
    } as Transaction;
    const parentAccount = genAccount("mock", {
      currency: findCryptoCurrencyByTicker("SOL") ?? undefined,
      subAccounts: [tokenAccount],
    });
    const input = {
      exchangeType: 3, //ExchangeTypes.SwapNg,
      exchange: {
        fromAccount: tokenAccount,
        fromParentAccount: parentAccount,
        toAccount: genAccount("mock", { currency: findCryptoCurrencyByTicker("ETH") ?? undefined }),
        toParentAccount: null,
      },
      device,
      provider: "providerName",
      binaryPayload: "binaryPayload",
      signature: Array.from({ length: 64 }, _ => "64").join(""),
      transaction,
    };

    // When
    const sub = completeExchange(input).subscribe((event: CompleteExchangeRequestEvent) => {
      // Then
      console.log("EVENT", event);
      expect(event.type).not.toEqual("complete-exchange-error");

      if (event.type === "complete-exchange-result") {
        expect(exchangeMock.setPartnerKey).toHaveBeenCalledTimes(1);
        expect(exchangeMock.checkPartner).toHaveBeenCalledTimes(1);
        expect(exchangeMock.processTransaction).toHaveBeenCalledTimes(1);
        expect(exchangeMock.checkTransactionSignature).toHaveBeenCalledTimes(1);
        expect(exchangeMock.validatePayoutOrAsset).toHaveBeenCalledTimes(1);
        expect(exchangeMock.checkRefundAddress).toHaveBeenCalledTimes(1);
        expect(exchangeMock.signCoinTransaction).toHaveBeenCalledTimes(1);
        expect(exchangeMock.getChallenge).toHaveBeenCalledTimes(1);
        expect(exchangeMock.sendTrustedDescriptor).toHaveBeenCalledTimes(1);

        sub.unsubscribe();
        done();
      }
    });
  });
});
