import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  AmountRequired,
  ETHAddressNonEIP,
  FeeNotLoaded,
  GasLessThanEstimate,
  InvalidAddress,
  MaxFeeTooLow,
  NotEnoughBalance,
  NotEnoughGas,
  PriorityFeeHigherThanMaxFee,
  PriorityFeeTooHigh,
  PriorityFeeTooLow,
  RecipientRequired,
} from "@ledgerhq/errors";
import { TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import BigNumber from "bignumber.js";
import { Operation } from "@ledgerhq/types-live";
import { EvmCoinConfig, setCoinConfig } from "../config";
import ledgerNode from "../network/node/ledger";
import ledgerExplorer from "../network/explorer/ledger";
import ledgerGasTracker from "../network/gasTracker/ledger";
import { validateIntent } from "./validateIntent";

function legacyIntent(intent: Omit<Partial<TransactionIntent>, "type">): TransactionIntent {
  return {
    type: "send-legacy",
    sender: "",
    recipient: "",
    amount: 0n,
    asset: { type: "native" },
    ...intent,
  };
}

function eip1559Intent(intent: Omit<Partial<TransactionIntent>, "type">): TransactionIntent {
  return {
    type: "send-eip1559",
    sender: "",
    recipient: "",
    amount: 0n,
    asset: { type: "native" },
    ...intent,
  };
}

describe("validateIntent", () => {
  beforeEach(() => {
    setCoinConfig(
      () =>
        ({
          info: {
            node: { type: "ledger" },
            explorer: { type: "ledger" },
            gasTracker: { type: "ledger", explorerId: "eth" },
          },
        }) as unknown as EvmCoinConfig,
    );

    jest.spyOn(ledgerNode, "getGasEstimation").mockResolvedValue(new BigNumber(0));
    jest.spyOn(ledgerNode, "getFeeData").mockResolvedValue({
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
      gasPrice: null,
      nextBaseFee: null,
    });
    jest.spyOn(ledgerExplorer, "getLastOperations").mockResolvedValue({
      lastCoinOperations: [],
      lastInternalOperations: [],
      lastNftOperations: [],
      lastTokenOperations: [],
    });
    jest.spyOn(ledgerNode, "getCoinBalance").mockResolvedValue(new BigNumber(50));
    jest.spyOn(ledgerGasTracker, "getGasOptions").mockResolvedValue({
      slow: {
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        gasPrice: null,
        nextBaseFee: null,
      },
      medium: {
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        gasPrice: null,
        nextBaseFee: null,
      },
      fast: {
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        gasPrice: null,
        nextBaseFee: null,
      },
    });
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("recipient", () => {
    it("detects the missing recipient with an error", async () => {
      const res = await validateIntent(
        {} as CryptoCurrency,
        eip1559Intent({ amount: 1n, recipient: "" }),
      );

      expect(res.errors).toEqual(
        expect.objectContaining({
          recipient: new RecipientRequired(),
        }),
      );
    });

    it("detects the incorrect recipient not being an eth address with an error", async () => {
      const res = await validateIntent(
        { name: "Ethereum" } as CryptoCurrency,
        eip1559Intent({ amount: 1n, recipient: "invalid-address" }),
      );

      expect(res.errors).toEqual(
        expect.objectContaining({
          recipient: new InvalidAddress("", {
            currencyName: "Ethereum",
          }),
        }),
      );
    });

    it("detects the recipient being an ICAP with an error", async () => {
      const res = await validateIntent(
        { name: "Ethereum" } as CryptoCurrency,
        eip1559Intent({
          amount: 1n,
          recipient: "XE89MW3Y75UITCQ4F53YDKR25UFLB1640YM", // ICAP version of recipient address
        }),
      );
      expect(res.errors).toEqual(
        expect.objectContaining({
          recipient: new InvalidAddress("", {
            currencyName: "Ethereum",
          }),
        }),
      );
    });

    it("detects the recipient not being an EIP55 address with a warning", async () => {
      const res = await validateIntent(
        { name: "Ethereum" } as CryptoCurrency,
        eip1559Intent({ amount: 1n, recipient: "0xe2ca7390e76c5a992749bb622087310d2e63ca29" }),
      );

      expect(res.warnings).toEqual(
        expect.objectContaining({
          recipient: new ETHAddressNonEIP(),
        }),
      );
    });
  });

  describe("amount", () => {
    it("detects an intent for native asset sending without amount with an error", async () => {
      const res = await validateIntent(
        {} as CryptoCurrency,
        eip1559Intent({
          amount: 0n,
          asset: { type: "native" },
        }),
      );

      expect(res.errors).toEqual(
        expect.objectContaining({
          amount: new AmountRequired(),
        }),
      );
    });

    it("detects an intent for token asset sending without amount with an error", async () => {
      const res = await validateIntent(
        {} as CryptoCurrency,
        eip1559Intent({
          recipient: "0xe2ca7390e76c5A992749bB622087310d2e63ca29",
          amount: 0n,
          asset: { type: "erc20" },
        }),
      );

      expect(res.errors).toEqual(
        expect.objectContaining({
          amount: new AmountRequired(),
        }),
      );
    });

    it("detects native asset sending intent with an error", async () => {
      jest.spyOn(ledgerNode, "getCoinBalance").mockResolvedValue(new BigNumber(10));
      const res = await validateIntent(
        {} as CryptoCurrency,
        eip1559Intent({
          amount: 20n,
          asset: { type: "native" },
        }),
      );

      expect(res.errors).toEqual(
        expect.objectContaining({
          amount: new NotEnoughBalance(),
        }),
      );
    });

    it("detects token asset sending intent with an error", async () => {
      jest.spyOn(ledgerExplorer, "getLastOperations").mockResolvedValue({
        lastCoinOperations: [],
        lastInternalOperations: [],
        lastNftOperations: [],
        lastTokenOperations: [{ contract: "contract-address" } as Operation],
      });
      const getTokenBalance = jest
        .spyOn(ledgerNode, "getTokenBalance")
        .mockResolvedValue(new BigNumber(10));

      const res = await validateIntent(
        {} as CryptoCurrency,
        eip1559Intent({
          sender: "sender-address",
          recipient: "0xe2ca7390e76c5A992749bB622087310d2e63ca29",
          amount: 20n,
          asset: { type: "erc20", assetReference: "contract-adress" },
        }),
      );

      expect(res.errors).toEqual(
        expect.objectContaining({
          amount: new NotEnoughBalance(),
        }),
      );
      expect(getTokenBalance).toHaveBeenCalledWith({}, "sender-address", "contract-address");
    });
  });

  describe("gas", () => {
    describe("common", () => {
      describe.each([
        ["a legacy intent", legacyIntent],
        ["an eip1559 intent", eip1559Intent],
      ])("for %s", (_s, createIntent) => {
        it("detects missing fees with an error", async () => {
          const res = await validateIntent({} as CryptoCurrency, createIntent({}), { value: 0n });

          expect(res.errors).toEqual(
            expect.objectContaining({
              gasPrice: new FeeNotLoaded(),
            }),
          );
        });

        it("detects a missing gasLimit with an error", async () => {
          const res = await validateIntent({} as CryptoCurrency, createIntent({}), {
            value: 0n,
            parameters: { gasLimit: undefined },
          });

          expect(res.errors).toEqual(
            expect.objectContaining({
              gasLimit: new FeeNotLoaded(),
            }),
          );
        });

        it("detects a gasLimit = 0 with an error", async () => {
          const res = await validateIntent({} as CryptoCurrency, createIntent({}), {
            value: 0n,
            parameters: { gasLimit: 0n },
          });

          expect(res.errors).toEqual(
            expect.objectContaining({
              gasLimit: new FeeNotLoaded(),
            }),
          );
        });

        it("detects a customGasLimit = 0 with an error", async () => {
          const res = await validateIntent({} as CryptoCurrency, createIntent({}), {
            value: 0n,
            parameters: { customGasLimit: 0n },
          });

          expect(res.errors).toEqual(
            expect.objectContaining({
              gasLimit: new FeeNotLoaded(),
            }),
          );
        });

        it("if the recipient has been set, detects fees being too high for the account balance with an error", async () => {
          jest.spyOn(ledgerNode, "getCoinBalance").mockResolvedValue(new BigNumber(10));

          const notEnoughBalanceRes = await validateIntent(
            { units: [{ code: "ETH", name: "ETH", magnitude: 18 }] } as CryptoCurrency,
            createIntent({ recipient: "recipient-address" }),
            {
              value: 11n,
              parameters: { gasPrice: 1n, maxFeePerGas: 1n, maxPriorityFeePerGas: 1n },
            },
          );
          const enoughBalanceRes = await validateIntent(
            { units: [{ code: "ETH", name: "ETH", magnitude: 18 }] } as CryptoCurrency,
            createIntent({ recipient: "recipient-address" }),
            {
              value: 9n,
              parameters: { gasPrice: 1n, maxFeePerGas: 1n, maxPriorityFeePerGas: 1n },
            },
          );

          expect(notEnoughBalanceRes.errors).toEqual(
            expect.objectContaining({
              gasPrice: new NotEnoughGas(),
            }),
          );
          expect(enoughBalanceRes.errors).not.toEqual(
            expect.objectContaining({
              gasPrice: new NotEnoughGas(),
            }),
          );
        });

        it("if the recipient has not been set, does not detect gas being too high", async () => {
          jest.spyOn(ledgerNode, "getCoinBalance").mockResolvedValue(new BigNumber(10));

          const notEnoughBalanceRes = await validateIntent(
            { units: [{ code: "ETH", name: "ETH", magnitude: 18 }] } as CryptoCurrency,
            createIntent({ recipient: "" }),
            {
              value: 11n,
              parameters: { gasPrice: 1n, maxFeePerGas: 1n, maxPriorityFeePerGas: 1n },
            },
          );
          const enoughBalanceRes = await validateIntent(
            { units: [{ code: "ETH", name: "ETH", magnitude: 18 }] } as CryptoCurrency,
            createIntent({ recipient: "" }),
            {
              value: 9n,
              parameters: { gasPrice: 1n, maxFeePerGas: 1n, maxPriorityFeePerGas: 1n },
            },
          );

          expect(notEnoughBalanceRes.errors).not.toEqual(
            expect.objectContaining({
              gasPrice: new NotEnoughGas(),
            }),
          );
          expect(enoughBalanceRes.errors).not.toEqual(
            expect.objectContaining({
              gasPrice: new NotEnoughGas(),
            }),
          );
        });

        it("detects gas limit being too low in a tx with an error", async () => {
          const res = await validateIntent({} as CryptoCurrency, createIntent({}), {
            value: 0n,
            parameters: { gasLimit: 20000n }, // min should be 21000
          });

          expect(res.errors).toEqual(
            expect.objectContaining({
              gasLimit: new GasLessThanEstimate(),
            }),
          );
        });

        it("detects custom gas limit being too low in a tx with an error", async () => {
          const res = await validateIntent({} as CryptoCurrency, createIntent({}), {
            value: 0n,
            parameters: { customGasLimit: 20000n }, // min should be 21000
          });

          expect(res.errors).toEqual(
            expect.objectContaining({
              gasLimit: new GasLessThanEstimate(),
            }),
          );
        });

        it("detects customGasLimit being lower than gasLimit with a warning", async () => {
          const res = await validateIntent({} as CryptoCurrency, createIntent({}), {
            value: 0n,
            parameters: {
              gasLimit: 22000n,
              customGasLimit: 21000n,
            },
          });

          expect(res.warnings).toEqual(
            expect.objectContaining({
              gasLimit: new GasLessThanEstimate(),
            }),
          );
        });
      });
    });

    describe("eip1559 specific", () => {
      it("detects a maxPriorityFeePerGas = 0 with an error", async () => {
        const res = await validateIntent({} as CryptoCurrency, eip1559Intent({}), {
          value: 0n,
          parameters: { maxPriorityFeePerGas: 0n, maxFeePerGas: 2n },
        });

        expect(res.errors).toEqual(
          expect.objectContaining({
            maxPriorityFee: new PriorityFeeTooLow(),
          }),
        );
      });

      it("detects maxFeePerGas being greater than max gasOptions maxFeePerGas with an error", async () => {
        const res = await validateIntent({} as CryptoCurrency, eip1559Intent({}), {
          value: 0n,
          parameters: { maxPriorityFeePerGas: 6n, maxFeePerGas: 5n },
        });

        expect(res.errors).toEqual(
          expect.objectContaining({
            maxPriorityFee: new PriorityFeeHigherThanMaxFee(),
          }),
        );
      });

      it("detects maxPriorityFeePerGas being greater than max gasOptions maxPriorityFeePerGas with a warning", async () => {
        jest.spyOn(ledgerGasTracker, "getGasOptions").mockResolvedValue({
          slow: {
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            gasPrice: null,
            nextBaseFee: null,
          },
          medium: {
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            gasPrice: null,
            nextBaseFee: null,
          },
          fast: {
            maxFeePerGas: null,
            maxPriorityFeePerGas: BigNumber(3),
            gasPrice: null,
            nextBaseFee: null,
          },
        });

        const res = await validateIntent({} as CryptoCurrency, eip1559Intent({}), {
          value: 0n,
          parameters: { maxPriorityFeePerGas: 4n, maxFeePerGas: 5n },
        });

        expect(res.warnings).toEqual(
          expect.objectContaining({
            maxPriorityFee: new PriorityFeeTooHigh(),
          }),
        );
      });

      it("detects maxPriorityFeePerGas being lower than min gasOptions maxPriorityFeePerGas with a warning", async () => {
        jest.spyOn(ledgerGasTracker, "getGasOptions").mockResolvedValue({
          slow: {
            maxFeePerGas: null,
            maxPriorityFeePerGas: BigNumber(3),
            gasPrice: null,
            nextBaseFee: null,
          },
          medium: {
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            gasPrice: null,
            nextBaseFee: null,
          },
          fast: {
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            gasPrice: null,
            nextBaseFee: null,
          },
        });

        const res = await validateIntent({} as CryptoCurrency, eip1559Intent({}), {
          value: 0n,
          parameters: { maxPriorityFeePerGas: 1n, maxFeePerGas: 5n },
        });

        expect(res.warnings).toEqual(
          expect.objectContaining({
            maxPriorityFee: new PriorityFeeTooLow(),
          }),
        );
      });

      it("detects maxFeePerGas being lower than recommanded next base fee with a warning", async () => {
        jest.spyOn(ledgerGasTracker, "getGasOptions").mockResolvedValue({
          slow: {
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            gasPrice: null,
            nextBaseFee: null,
          },
          medium: {
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            gasPrice: null,
            nextBaseFee: BigNumber(6),
          },
          fast: {
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            gasPrice: null,
            nextBaseFee: null,
          },
        });

        const res = await validateIntent({} as CryptoCurrency, eip1559Intent({}), {
          value: 0n,
          parameters: { maxPriorityFeePerGas: 1n, maxFeePerGas: 5n },
        });

        expect(res.warnings).toEqual(
          expect.objectContaining({
            maxFee: new MaxFeeTooLow(),
          }),
        );
      });
    });
  });

  describe("valid intent", () => {
    it("does not return any error of warning for a valid legacy intent", async () => {
      const res = await validateIntent(
        {} as CryptoCurrency,
        legacyIntent({ amount: 2n, recipient: "0xe2ca7390e76c5A992749bB622087310d2e63ca29" }),
        {
          value: 4n,
          parameters: { gasLimit: 21000n, gasPrice: 10n },
        },
      );

      expect(res).toEqual({
        estimatedFees: 4n,
        totalSpent: 6n,
        amount: 2n,
        errors: {},
        warnings: {},
      });
    });

    it("does not return any error of warning for a valid eip1559 intent", async () => {
      jest.spyOn(ledgerGasTracker, "getGasOptions").mockResolvedValue({
        slow: {
          maxFeePerGas: null,
          maxPriorityFeePerGas: BigNumber(2),
          gasPrice: null,
          nextBaseFee: null,
        },
        medium: {
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
          gasPrice: null,
          nextBaseFee: BigNumber(4),
        },
        fast: {
          maxFeePerGas: null,
          maxPriorityFeePerGas: BigNumber(6),
          gasPrice: null,
          nextBaseFee: null,
        },
      });

      const res = await validateIntent(
        {} as CryptoCurrency,
        eip1559Intent({ amount: 2n, recipient: "0xe2ca7390e76c5A992749bB622087310d2e63ca29" }),
        {
          value: 4n,
          parameters: { gasLimit: 21000n, maxPriorityFeePerGas: 3n, maxFeePerGas: 5n },
        },
      );

      expect(res).toEqual({
        estimatedFees: 4n,
        totalSpent: 6n,
        amount: 2n,
        errors: {},
        warnings: {},
      });
    });

    it("does not call the gas tracker if unnecessary", async () => {
      const getGasOptions = jest.spyOn(ledgerGasTracker, "getGasOptions").mockResolvedValue({
        slow: {
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
          gasPrice: null,
          nextBaseFee: null,
        },
        medium: {
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
          gasPrice: null,
          nextBaseFee: null,
        },
        fast: {
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
          gasPrice: null,
          nextBaseFee: null,
        },
      });

      const res = await validateIntent(
        {} as CryptoCurrency,
        eip1559Intent({ amount: 2n, recipient: "0xe2ca7390e76c5A992749bB622087310d2e63ca29" }),
        {
          value: 4n,
          parameters: {
            gasLimit: 21000n,
            maxPriorityFeePerGas: 3n,
            maxFeePerGas: 5n,
            gasOptions: {
              slow: {
                maxFeePerGas: null,
                maxPriorityFeePerGas: 2n,
                gasPrice: null,
                nextBaseFee: null,
              },
              medium: {
                maxFeePerGas: null,
                maxPriorityFeePerGas: null,
                gasPrice: null,
                nextBaseFee: 4n,
              },
              fast: {
                maxFeePerGas: null,
                maxPriorityFeePerGas: 6n,
                gasPrice: null,
                nextBaseFee: null,
              },
            },
          },
        },
      );

      expect(res).toEqual({
        estimatedFees: 4n,
        totalSpent: 6n,
        amount: 2n,
        errors: {},
        warnings: {},
      });
      expect(getGasOptions).not.toHaveBeenCalled();
    });
  });
});
