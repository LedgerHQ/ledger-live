import BigNumber from "bignumber.js";
import completeExchange from "./completeExchange";
import { Transaction } from "../../generated/types";
// import { Exchange } from "../../exchange/types";
import { genAccount } from "../../mock/account";
// import { DeviceModelId } from "@ledgerhq/devices";
import { DisconnectedDeviceDuringOperation } from "@ledgerhq/errors";
import { CompleteExchangeRequestEvent } from "../platform/types";
import { findCryptoCurrencyByTicker, setSupportedCurrencies } from "../../currencies";

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
      deviceId: undefined,
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

  it("returns calls Exchange wrapper", done => {
    // Given
    setSupportedCurrencies(["bitcoin", "ethereum"]);
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
      deviceId: "deviceId",
      provider: "providerName",
      binaryPayload: "binaryPayload",
      signature: Array.from({ length: 64 }, _ => "64"),
      transaction,
    };

    // When
    const sub = completeExchange(input).subscribe((event: CompleteExchangeRequestEvent) => {
      // Then
      if (event.type === "complete-exchange-result") {
        expect(event).toEqual({
          // type: "complete-exchange-error",
          // error: new CantOpenDevice("Cannot find registered transport to open undefined"),
          // completeExchangeResult: {
          //   amount: "0",
          //   family: "algorand",
          //   maxFeePerGas: "50",
          //   maxPriorityFeePerGas: "50",
          //   mode: "send",
          //   recipient: "recipient",
          //   type: 2,
          // },
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
});
