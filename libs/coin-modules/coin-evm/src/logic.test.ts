import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import * as EVM_TOOLS from "@ledgerhq/evm-tools/message/EIP712/index";
import BigNumber from "bignumber.js";

jest.mock("./network/node/index", () => ({
  ...jest.requireActual("./network/node/index"),
  getNodeApi: jest.fn((...args: unknown[]) =>
    jest.requireActual("./network/node/index").getNodeApi(...args),
  ),
}));

import { getCoinConfig } from "./config";
import { getAdditionalLayer2Fees, getMessageProperties } from "./logic";
import { getNodeApi } from "./network/node/index";
import { Transaction as EvmTransaction } from "./types";
import { getEstimatedFees, getGasLimit, padHexString, safeEncodeEIP55 } from "./utils";

const mockGetNodeApi = jest.mocked(getNodeApi);
const mockGetOptimismAdditionalFees = jest.fn();
const mockGetScrollAdditionalFees = jest.fn();

jest.mock("./config");
const mockGetConfig = jest.mocked(getCoinConfig);

mockGetConfig.mockImplementation((currencyId: string): any => {
  switch (currencyId) {
    case "ethereum": {
      return {
        info: {
          node: { type: "ledger", explorerId: "eth" },
          explorer: { type: "ledger", explorerId: "eth" },
        },
      };
    }
    case "matic": {
      return {
        info: {
          node: { type: "ledger", explorerId: "matic" },
          explorer: { type: "ledger", explorerId: "matic" },
        },
      };
    }
    case "optimism": {
      return {
        info: {
          node: { type: "external", uri: "optimism_uri" },
        },
      };
    }
    case "scroll": {
      return {
        info: {
          node: { type: "external", uri: "scroll_uri" },
        },
      };
    }
    case "polygon": {
      return {
        info: {
          node: { type: "ledger", explorerId: "polygon" },
        },
      };
    }
    case "bsc": {
      return {
        info: {
          node: { type: "ledger", explorerId: "bsc" },
        },
      };
    }
    case "anything": {
      return {
        info: {
          node: { type: "external", explorerId: "anything" },
          explorer: { type: "etherscan", uri: "anything" },
        },
      };
    }
    case "somethingelse": {
      return {
        info: {
          node: { type: "ledger", explorerId: "somethingelse" },
          explorer: { type: "blockscout", uri: "somethingelse" },
        },
      };
    }
  }
});

describe("EVM Family", () => {
  describe("logic.ts", () => {
    describe("getGasLimit", () => {
      it("should return the gasLimit when no customGasLimit provided", () => {
        const tx: Partial<EvmTransaction> = {
          gasLimit: new BigNumber(100),
          customGasLimit: undefined as any,
        };

        expect(getGasLimit(tx as any)).toEqual(new BigNumber(100));
      });

      it("should return the customGasLimit when provided", () => {
        const tx: Partial<EvmTransaction> = {
          gasLimit: new BigNumber(100),
          customGasLimit: new BigNumber(200),
        };

        expect(getGasLimit(tx as any)).toEqual(new BigNumber(200));
      });
    });

    describe("getEstimatedFees", () => {
      describe("without customGasLimit", () => {
        it("should return the right fee estimation for a legacy tx", () => {
          const tx = {
            type: 0,
            gasLimit: new BigNumber(3),
            gasPrice: new BigNumber(23),
            maxFeePerGas: new BigNumber(100),
            maxPriorityFeePerGas: new BigNumber(40),
          };

          expect(getEstimatedFees(tx as any)).toEqual(new BigNumber(69));
        });

        it("should return the right fee estimation for a 1559 tx", () => {
          const tx = {
            type: 2,
            gasLimit: new BigNumber(42),
            gasPrice: new BigNumber(23),
            maxFeePerGas: new BigNumber(10),
            maxPriorityFeePerGas: new BigNumber(40),
          };

          expect(getEstimatedFees(tx as any)).toEqual(new BigNumber(420));
        });
      });

      describe("with customGasLimit", () => {
        it("should return the right fee estimation for a legacy tx", () => {
          const tx = {
            type: 0,
            gasLimit: new BigNumber(4),
            customGasLimit: new BigNumber(3),
            gasPrice: new BigNumber(23),
            maxFeePerGas: new BigNumber(100),
            maxPriorityFeePerGas: new BigNumber(40),
          };

          expect(getEstimatedFees(tx as any)).toEqual(new BigNumber(69));
        });

        it("should return the right fee estimation for a 1559 tx", () => {
          const tx = {
            type: 2,
            gasLimit: new BigNumber(43),
            customGasLimit: new BigNumber(42),
            gasPrice: new BigNumber(23),
            maxFeePerGas: new BigNumber(10),
            maxPriorityFeePerGas: new BigNumber(40),
          };

          expect(getEstimatedFees(tx as any)).toEqual(new BigNumber(420));
        });
      });

      it("should fallback with tx without type", () => {
        const tx = {};
        expect(getEstimatedFees(tx as any)).toEqual(new BigNumber(0));
      });

      it("should fallback with badly formatted legacy tx", () => {
        const tx = {
          type: 0,
        };

        expect(getEstimatedFees(tx as any)).toEqual(new BigNumber(0));
      });

      it("should fallback with badly formatted 1559 tx", () => {
        const tx = {
          type: 2,
        };

        expect(getEstimatedFees(tx as any)).toEqual(new BigNumber(0));
      });
    });

    describe("getAdditionalLayer2Fees", () => {
      const optimism = getCryptoCurrencyById("optimism");
      const scroll = getCryptoCurrencyById("scroll");
      const ethereum = getCryptoCurrencyById("ethereum");

      beforeEach(() => {
        jest.clearAllMocks();
        mockGetNodeApi.mockImplementation(
          () =>
            ({
              getOptimismAdditionalFees: mockGetOptimismAdditionalFees,
              getScrollAdditionalFees: mockGetScrollAdditionalFees,
            }) as any,
        );
      });

      it("should try to get additionalFees for a valid layer 2", async () => {
        mockGetOptimismAdditionalFees.mockClear();
        mockGetScrollAdditionalFees.mockClear();

        await getAdditionalLayer2Fees(optimism, {} as any);
        expect(mockGetOptimismAdditionalFees).toHaveBeenCalled();
        await getAdditionalLayer2Fees(scroll, {} as any);
        expect(mockGetScrollAdditionalFees).toHaveBeenCalled();
      });

      it("should not try to get additionalFees for an invalid layer 2", async () => {
        mockGetOptimismAdditionalFees.mockClear();
        mockGetScrollAdditionalFees.mockClear();

        await getAdditionalLayer2Fees(ethereum, {} as any);
        expect(mockGetOptimismAdditionalFees).not.toHaveBeenCalled();
        expect(mockGetScrollAdditionalFees).not.toHaveBeenCalled();
      });
    });

    describe("padHexString", () => {
      it("should always return an odd number of characters", () => {
        expect(padHexString("1")).toEqual("01");
        expect(padHexString("01")).toEqual("01");
      });
    });

    describe("safeEncodeEIP55", () => {
      it("Should return encoded address if valid address", () => {
        const address = "0x9aa99c23f67c81701c772b106b4f83f6e858dd2e";
        const encodedAddress = safeEncodeEIP55(address);
        expect(encodedAddress).toBe("0x9AA99C23F67c81701C772B106b4F83f6e858dd2E");
      });

      it("Should return empty string if empty address", () => {
        const address = "";
        const encodedAddress = safeEncodeEIP55(address);
        expect(encodedAddress).toBe("");
      });

      it("Should return empty string if 0x0 address", () => {
        const address = "0x0";
        const encodedAddress = safeEncodeEIP55(address);
        expect(encodedAddress).toBe("");
      });

      it("Should return empty string if 0x address", () => {
        const address = "0x";
        const encodedAddress = safeEncodeEIP55(address);
        expect(encodedAddress).toBe("");
      });

      it("Should return address if invalid address", () => {
        const address = "0x00000";
        const encodedAddress = safeEncodeEIP55(address);
        expect(encodedAddress).toBe(address);
      });
    });

    describe("getMessageProperties", () => {
      it("should return null if the message isn't an EIP712", async () => {
        expect(await getMessageProperties({ standard: "EIP191", message: "doot-doot" })).toBe(null);
      });

      it("should return the fields displayed on the nano", async () => {
        jest.spyOn(EVM_TOOLS, "getEIP712FieldsDisplayedOnNano").mockResolvedValueOnce([
          {
            label: "key",
            value: "value",
          },
        ]);

        expect(
          await getMessageProperties({
            standard: "EIP712",
            message: {} as any,
            domainHash: "0xabc",
            hashStruct: "0xdef",
          }),
        ).toEqual([{ label: "key", value: "value" }]);
      });
    });
  });
});
