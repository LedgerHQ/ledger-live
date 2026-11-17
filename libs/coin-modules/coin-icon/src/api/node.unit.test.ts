import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import BigNumber from "bignumber.js";
import type { IcxTransaction } from "icon-sdk-js";
import { getCoinConfig } from "../config";
import { GOVERNANCE_SCORE_ADDRESS, IISS_SCORE_ADDRESS } from "../constants";
import { isTestnet } from "../logic";
import type { IconAccount } from "../types";
import {
  broadcastTransaction,
  getDebugRpcUrl,
  getDelegation,
  getFees,
  getRpcUrl,
  getStepPrice,
  submit,
} from "./node";

const mockSendTransaction = jest.fn();
const mockEstimateStep = jest.fn();
const mockCall = jest.fn();
const mockCallBuilderTo = jest.fn();
const mockCallBuilderMethod = jest.fn();
const mockCallBuilderParams = jest.fn();

jest.mock("icon-sdk-js", () => {
  const IconServiceMock = jest.fn().mockImplementation(() => ({
    sendTransaction: mockSendTransaction,
    estimateStep: mockEstimateStep,
    call: mockCall,
  }));
  class CallBuilder {
    to(address: string) {
      mockCallBuilderTo(address);
      return this;
    }
    method(name: string) {
      mockCallBuilderMethod(name);
      return this;
    }
    params(params: unknown) {
      mockCallBuilderParams(params);
      return this;
    }
    build() {
      return { built: true };
    }
  }
  return {
    __esModule: true,
    default: Object.assign(IconServiceMock, {
      HttpProvider: jest.fn(),
      IconBuilder: { CallBuilder },
    }),
  };
});
jest.mock("../config");
jest.mock("../logic", () => ({ isTestnet: jest.fn() }));

const mockHttpProvider: jest.Mock = jest.requireMock("icon-sdk-js").default.HttpProvider;

const currency = { id: "icon" } as CryptoCurrency;
const account = { currency } as IconAccount;

const executing = (result: () => Promise<unknown>) => ({ execute: result });

describe("node", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(isTestnet).mockReturnValue(false);
    jest.mocked(getCoinConfig).mockReturnValue({
      infra: {
        indexer: "indexer",
        indexer_testnet: "indexer-testnet",
        node_endpoint: "node",
        node_testnet_endpoint: "node-testnet",
        debug_endpoint: "debug",
        debug_testnet_endpoint: "debug-testnet",
      },
    } as ReturnType<typeof getCoinConfig>);
  });

  describe("getRpcUrl", () => {
    it("returns the mainnet node endpoint", () => {
      expect(getRpcUrl(currency)).toBe("node");
    });

    it("returns the testnet node endpoint", () => {
      jest.mocked(isTestnet).mockReturnValue(true);

      expect(getRpcUrl(currency)).toBe("node-testnet");
    });
  });

  describe("getDebugRpcUrl", () => {
    it("returns the mainnet debug endpoint", () => {
      expect(getDebugRpcUrl(currency)).toBe("debug");
    });

    it("returns the testnet debug endpoint", () => {
      jest.mocked(isTestnet).mockReturnValue(true);

      expect(getDebugRpcUrl(currency)).toBe("debug-testnet");
    });
  });

  describe("submit", () => {
    const signedPayload = { signature: "signature", rawData: { from: "hx123" } };

    it("sends the signed transaction to the node and returns its hash", async () => {
      mockSendTransaction.mockReturnValue(executing(() => Promise.resolve("0xhash")));

      const result = await submit(signedPayload, currency);

      expect(result).toEqual({ hash: "0xhash" });
      expect(mockHttpProvider).toHaveBeenCalledWith("node");
      const signedTransaction = mockSendTransaction.mock.calls[0][0];
      expect(signedTransaction.getProperties()).toEqual({ from: "hx123" });
      expect(signedTransaction.getSignature()).toBe("signature");
    });

    it("wraps a thrown string into an error", async () => {
      mockSendTransaction.mockReturnValue(executing(() => Promise.reject("OutOfBalance")));

      await expect(submit(signedPayload, currency)).rejects.toThrow(new Error("OutOfBalance"));
    });

    it("rethrows a thrown error as is", async () => {
      const error = new Error("network");
      mockSendTransaction.mockReturnValue(executing(() => Promise.reject(error)));

      await expect(submit(signedPayload, currency)).rejects.toBe(error);
    });
  });

  describe("broadcastTransaction", () => {
    it("returns the hash of the submitted transaction", async () => {
      mockSendTransaction.mockReturnValue(executing(() => Promise.resolve("0xhash")));

      const result = await broadcastTransaction({ signature: "signature" }, currency);

      expect(result).toEqual({ hash: "0xhash" });
    });
  });

  describe("getFees", () => {
    it("estimates the steps on the debug endpoint", async () => {
      const unsigned = { from: "hx123" } as unknown as IcxTransaction;
      mockEstimateStep.mockReturnValue(executing(() => Promise.resolve("0x186a0")));

      const result = await getFees(unsigned, account);

      expect(result).toEqual(new BigNumber(100000));
      expect(mockHttpProvider).toHaveBeenCalledWith("debug");
      expect(mockEstimateStep).toHaveBeenCalledWith(unsigned);
    });
  });

  describe("getStepPrice", () => {
    it("reads the step price from the governance contract", async () => {
      mockCall.mockReturnValue(executing(() => Promise.resolve("0x2e90edd00")));

      const result = await getStepPrice(account);

      expect(result).toEqual(new BigNumber(12500000000));
      expect(mockHttpProvider).toHaveBeenCalledWith("node");
      expect(mockCallBuilderTo).toHaveBeenCalledWith(GOVERNANCE_SCORE_ADDRESS);
      expect(mockCallBuilderMethod).toHaveBeenCalledWith("getStepPrice");
    });
  });

  describe("getDelegation", () => {
    it("reads the delegation of the address from the IISS contract", async () => {
      const delegations = [{ address: "hxprep", value: "0x1" }];
      mockCall.mockReturnValue(
        executing(() =>
          Promise.resolve({ delegations, totalDelegated: "0x64", votingPower: "0xc8" }),
        ),
      );

      const result = await getDelegation("hx123", currency);

      expect(result).toEqual({
        delegations,
        totalDelegated: new BigNumber(100),
        votingPower: new BigNumber(200),
      });
      expect(mockCallBuilderTo).toHaveBeenCalledWith(IISS_SCORE_ADDRESS);
      expect(mockCallBuilderMethod).toHaveBeenCalledWith("getDelegation");
      expect(mockCallBuilderParams).toHaveBeenCalledWith({ address: "hx123" });
    });
  });
});
