import {
  BufferTxData,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/types";
import {
  AmountRequired,
  ETHAddressNonEIP,
  FeeNotLoaded,
  FeeTooHigh,
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
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { EvmCoinConfig, setCoinConfig } from "../config";
import ledgerExplorer from "../network/explorer/ledger";
import ledgerGasTracker from "../network/gasTracker/ledger";
import ledgerNode from "../network/node/ledger";
import { validateIntent } from "./validateIntent";

function legacyIntent(
  intent: Omit<Partial<TransactionIntent>, "type">,
): TransactionIntent<MemoNotSupported, BufferTxData> {
  return {
    type: "send-legacy",
    intentType: "transaction",
    sender: "",
    recipient: "",
    amount: 0n,
    asset: { type: "native" },
    data: { type: "buffer", value: Buffer.from([]) },
    ...intent,
  };
}

function eip1559Intent(
  intent: Omit<Partial<TransactionIntent<MemoNotSupported, BufferTxData>>, "type">,
): TransactionIntent<MemoNotSupported, BufferTxData> {
  return {
    type: "send-eip1559",
    intentType: "transaction",
    sender: "",
    recipient: "",
    amount: 0n,
    asset: { type: "native" },
    data: { type: "buffer", value: Buffer.from([]) },
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
    jest.spyOn(ledgerNode, "getTransactionCount").mockResolvedValue(30);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("fee ratio", () => {
    it.each([
      [
        "warns",
        "native",
        {
          feeTooHigh: new FeeTooHigh(),
        },
      ],
      ["does not warn", "erc20", {}],
    ])("%s with too high fees on a %s asset", async (_s, assetType, expectedWarnings) => {
      const res = await validateIntent(
        {} as CryptoCurrency,
        eip1559Intent({ amount: 1n, asset: { type: assetType } }),
        [{ value: 50n, asset: { type: "native" } }],
        {
          value: 2n,
          parameters: { gasLimit: 2n, maxFeePerGas: 1n },
        },
      );

      expect(res.warnings).toEqual(expectedWarnings);
    });
  });

  describe("recipient", () => {
    it("detects the missing recipient with an error", async () => {
      const res = await validateIntent(
        {} as CryptoCurrency,
        eip1559Intent({ amount: 1n, recipient: "" }),
        [{ value: 50n, asset: { type: "native" } }],
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
        [{ value: 50n, asset: { type: "native" } }],
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
        [{ value: 50n, asset: { type: "native" } }],
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
        eip1559Intent({
          amount: 1n,
          recipient: "0xe2ca7390e76c5a992749bb622087310d2e63ca29",
        }),
        [{ value: 50n, asset: { type: "native" } }],
      );

      expect(res.warnings).toEqual(
        expect.objectContaining({
          recipient: new ETHAddressNonEIP(),
        }),
      );
    });
  });

  describe("amount", () => {
    it("detects an intent for a smart contract interaction without amount-related errors", async () => {
      const res = await validateIntent(
        {} as CryptoCurrency,
        eip1559Intent({
          amount: 0n,
          asset: { type: "native" },
          data: { type: "buffer", value: Buffer.from([0xca, 0xfe]) },
        }),
        [{ value: 50n, asset: { type: "native" } }],
      );

      expect(res.errors).toEqual(
        expect.not.objectContaining({
          amount: new AmountRequired(),
        }),
      );
    });

    it("detects an intent for native asset sending without amount with an error", async () => {
      const res = await validateIntent(
        {} as CryptoCurrency,
        eip1559Intent({
          amount: 0n,
          asset: { type: "native" },
        }),
        [{ value: 50n, asset: { type: "native" } }],
      );

      expect(res.errors).toEqual(
        expect.objectContaining({
          amount: new AmountRequired(),
        }),
      );
    });

    it("detects an intent for token asset sending without amount with an error", async () => {
      jest.spyOn(ledgerNode, "getTransactionCount").mockResolvedValue(10);

      const res = await validateIntent(
        {} as CryptoCurrency,
        eip1559Intent({
          recipient: "0xe2ca7390e76c5A992749bB622087310d2e63ca29",
          amount: 0n,
          asset: { type: "erc20" },
        }),
        [{ value: 50n, asset: { type: "native" } }],
      );

      expect(res.errors).toEqual(
        expect.objectContaining({
          amount: new AmountRequired(),
        }),
      );
    });

    it("detects native asset sending intent with an error", async () => {
      const res = await validateIntent(
        {} as CryptoCurrency,
        eip1559Intent({
          amount: 20n,
          asset: { type: "native" },
        }),
        [{ value: 10n, asset: { type: "native" } }],
      );

      expect(res.errors).toEqual(
        expect.objectContaining({
          amount: new NotEnoughBalance(),
        }),
      );
    });

    it("detects token asset sending intent with an error", async () => {
      jest.spyOn(ledgerNode, "getTransactionCount").mockResolvedValue(10);
      jest.spyOn(ledgerExplorer, "getLastOperations").mockResolvedValue({
        lastCoinOperations: [],
        lastInternalOperations: [],
        lastNftOperations: [],
        lastTokenOperations: [
          { contract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" } as Operation,
        ],
      });

      const res = await validateIntent(
        {} as CryptoCurrency,
        eip1559Intent({
          sender: "sender-address",
          recipient: "0xe2ca7390e76c5A992749bB622087310d2e63ca29",
          amount: 20n,
          asset: { type: "erc20", assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
        }),
        [
          { value: 50n, asset: { type: "native" } },
          {
            value: 10n,
            asset: { type: "erc20", assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
          },
        ],
      );

      expect(res.errors).toEqual(
        expect.objectContaining({
          amount: new NotEnoughBalance(),
        }),
      );
    });
  });

  describe("gas", () => {
    describe("common", () => {
      describe.each([
        ["a legacy intent", legacyIntent],
        ["an eip1559 intent", eip1559Intent],
      ])("for %s", (_s, createIntent) => {
        it("detects missing fees with an error", async () => {
          const res = await validateIntent(
            {} as CryptoCurrency,
            createIntent({}),
            [{ value: 50n, asset: { type: "native" } }],
            { value: 0n },
          );

          expect(res.errors).toEqual(
            expect.objectContaining({
              gasPrice: new FeeNotLoaded(),
            }),
          );
        });

        it("detects a missing gasLimit with an error", async () => {
          const res = await validateIntent(
            {} as CryptoCurrency,
            createIntent({}),
            [{ value: 50n, asset: { type: "native" } }],
            {
              value: 0n,
              parameters: { gasLimit: undefined },
            },
          );

          expect(res.errors).toEqual(
            expect.objectContaining({
              gasLimit: new FeeNotLoaded(),
            }),
          );
        });

        it("detects a gasLimit = 0 with an error", async () => {
          const res = await validateIntent(
            {} as CryptoCurrency,
            createIntent({}),
            [{ value: 50n, asset: { type: "native" } }],
            {
              value: 0n,
              parameters: { gasLimit: 0n },
            },
          );

          expect(res.errors).toEqual(
            expect.objectContaining({
              gasLimit: new FeeNotLoaded(),
            }),
          );
        });

        it("detects a customGasLimit = 0 with an error", async () => {
          const res = await validateIntent(
            {} as CryptoCurrency,
            createIntent({}),
            [{ value: 50n, asset: { type: "native" } }],
            {
              value: 0n,
              parameters: { customGasLimit: 0n },
            },
          );

          expect(res.errors).toEqual(
            expect.objectContaining({
              gasLimit: new FeeNotLoaded(),
            }),
          );
        });

        it("if the recipient has been set, detects fees being too high for the account balance with an error", async () => {
          const notEnoughBalanceRes = await validateIntent(
            { units: [{ code: "ETH", name: "ETH", magnitude: 18 }] } as CryptoCurrency,
            createIntent({ recipient: "recipient-address" }),
            [{ value: 10n, asset: { type: "native" } }],
            {
              value: 11n,
              parameters: {
                gasLimit: 11n,
                gasPrice: 1n,
                maxFeePerGas: 1n,
                maxPriorityFeePerGas: 1n,
              },
            },
          );
          const notEnoughBalanceSponsoredRes = await validateIntent(
            { units: [{ code: "ETH", name: "ETH", magnitude: 18 }] } as CryptoCurrency,
            createIntent({ recipient: "recipient-address", sponsored: true }),
            [{ value: 10n, asset: { type: "native" } }],
            {
              value: 11n,
              parameters: {
                gasLimit: 11n,
                gasPrice: 1n,
                maxFeePerGas: 1n,
                maxPriorityFeePerGas: 1n,
              },
            },
          );
          const enoughBalanceRes = await validateIntent(
            { units: [{ code: "ETH", name: "ETH", magnitude: 18 }] } as CryptoCurrency,
            createIntent({ recipient: "recipient-address" }),
            [{ value: 10n, asset: { type: "native" } }],
            {
              value: 9n,
              parameters: {
                gasLimit: 9n,
                gasPrice: 1n,
                maxFeePerGas: 1n,
                maxPriorityFeePerGas: 1n,
              },
            },
          );

          expect(notEnoughBalanceRes.errors).toEqual(
            expect.objectContaining({
              gasPrice: new NotEnoughGas(),
            }),
          );
          expect(notEnoughBalanceSponsoredRes.errors).not.toEqual(
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
          const notEnoughBalanceRes = await validateIntent(
            { units: [{ code: "ETH", name: "ETH", magnitude: 18 }] } as CryptoCurrency,
            createIntent({ recipient: "" }),
            [{ value: 10n, asset: { type: "native" } }],
            {
              value: 11n,
              parameters: { gasPrice: 1n, maxFeePerGas: 1n, maxPriorityFeePerGas: 1n },
            },
          );
          const enoughBalanceRes = await validateIntent(
            { units: [{ code: "ETH", name: "ETH", magnitude: 18 }] } as CryptoCurrency,
            createIntent({ recipient: "" }),
            [{ value: 10n, asset: { type: "native" } }],
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
          const res = await validateIntent(
            {} as CryptoCurrency,
            createIntent({}),
            [{ value: 50n, asset: { type: "native" } }],
            {
              value: 0n,
              parameters: { gasLimit: 20000n }, // min should be 21000
            },
          );

          expect(res.errors).toEqual(
            expect.objectContaining({
              gasLimit: new GasLessThanEstimate(),
            }),
          );
        });

        it("detects custom gas limit being too low in a tx with an error", async () => {
          const res = await validateIntent(
            {} as CryptoCurrency,
            createIntent({}),
            [{ value: 50n, asset: { type: "native" } }],
            {
              value: 0n,
              parameters: { customGasLimit: 20000n }, // min should be 21000
            },
          );

          expect(res.errors).toEqual(
            expect.objectContaining({
              gasLimit: new GasLessThanEstimate(),
            }),
          );
        });

        it("detects customGasLimit being lower than gasLimit with a warning", async () => {
          const res = await validateIntent(
            {} as CryptoCurrency,
            createIntent({}),
            [{ value: 50n, asset: { type: "native" } }],
            {
              value: 0n,
              parameters: {
                gasLimit: 22000n,
                customGasLimit: 21000n,
              },
            },
          );

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
        const res = await validateIntent(
          {} as CryptoCurrency,
          eip1559Intent({}),
          [{ value: 50n, asset: { type: "native" } }],
          {
            value: 0n,
            parameters: { maxPriorityFeePerGas: 0n, maxFeePerGas: 2n },
          },
        );

        expect(res.errors).toEqual(
          expect.objectContaining({
            maxPriorityFee: new PriorityFeeTooLow(),
          }),
        );
      });

      it("detects maxFeePerGas being greater than max gasOptions maxFeePerGas with an error", async () => {
        const res = await validateIntent(
          {} as CryptoCurrency,
          eip1559Intent({}),
          [{ value: 50n, asset: { type: "native" } }],
          {
            value: 0n,
            parameters: { maxPriorityFeePerGas: 6n, maxFeePerGas: 5n },
          },
        );

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

        const res = await validateIntent(
          {} as CryptoCurrency,
          eip1559Intent({}),
          [{ value: 50n, asset: { type: "native" } }],
          {
            value: 0n,
            parameters: { maxPriorityFeePerGas: 4n, maxFeePerGas: 5n },
          },
        );

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

        const res = await validateIntent(
          {} as CryptoCurrency,
          eip1559Intent({}),
          [{ value: 50n, asset: { type: "native" } }],
          {
            value: 0n,
            parameters: { maxPriorityFeePerGas: 1n, maxFeePerGas: 5n },
          },
        );

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

        const res = await validateIntent(
          {} as CryptoCurrency,
          eip1559Intent({}),
          [{ value: 50n, asset: { type: "native" } }],
          {
            value: 0n,
            parameters: { maxPriorityFeePerGas: 1n, maxFeePerGas: 5n },
          },
        );

        expect(res.warnings).toEqual(
          expect.objectContaining({
            maxFee: new MaxFeeTooLow(),
          }),
        );
      });
    });
  });

  describe.each([
    [
      "native asset and no additional fees",
      { type: "native" },
      { amount: 10000000n },
      { additionalFees: undefined },
      { expectedTotalFees: 105000n, expectedTotalSpent: 10105000n, expectedAmount: 10000000n },
    ],
    [
      "native asset and additional fees",
      { type: "native" },
      { amount: 10000000n },
      { additionalFees: 4000n },
      { expectedTotalFees: 109000n, expectedTotalSpent: 10109000n, expectedAmount: 10000000n },
    ],
    [
      "native asset and no additional fees, using all amounts",
      { type: "native" },
      { useAllAmount: true },
      { additionalFees: undefined },
      { expectedTotalFees: 105000n, expectedTotalSpent: 20000000n, expectedAmount: 19895000n },
    ],
    [
      "native asset and additional fees, using all amounts",
      { type: "native" },
      { useAllAmount: true },
      { additionalFees: 4000n },
      { expectedTotalFees: 109000n, expectedTotalSpent: 20000000n, expectedAmount: 19891000n },
    ],
    [
      "token asset and no additional fees",
      { type: "erc20", assetReference: "contract-address" },
      { amount: 2n },
      { additionalFees: undefined },
      { expectedTotalFees: 105000n, expectedTotalSpent: 2n, expectedAmount: 2n },
    ],
    [
      "token asset and additional fees",
      { type: "erc20", assetReference: "contract-address" },
      { amount: 2n },
      { additionalFees: 4000n },
      { expectedTotalFees: 109000n, expectedTotalSpent: 2n, expectedAmount: 2n },
    ],
    [
      "token asset and no additional fees, using all amounts",
      { type: "erc20", assetReference: "contract-address" },
      { useAllAmount: true },
      { additionalFees: undefined },
      { expectedTotalFees: 105000n, expectedTotalSpent: 10n, expectedAmount: 10n },
    ],
    [
      "token asset and additional fees, using all amounts",
      { type: "erc20", assetReference: "contract-address" },
      { useAllAmount: true },
      { additionalFees: 4000n },
      { expectedTotalFees: 109000n, expectedTotalSpent: 10n, expectedAmount: 10n },
    ],
  ])(
    "valid intent with %s",
    (
      _s,
      asset,
      amount,
      additionalFees,
      { expectedTotalFees, expectedTotalSpent, expectedAmount },
    ) => {
      it("does not return any error or warning for a valid legacy intent", async () => {
        jest.spyOn(ledgerExplorer, "getLastOperations").mockResolvedValue({
          lastCoinOperations: [],
          lastInternalOperations: [],
          lastNftOperations: [],
          lastTokenOperations: [{ contract: "contract-address" } as Operation],
        });

        const res = await validateIntent(
          {} as CryptoCurrency,
          legacyIntent({
            ...amount,
            recipient: "0xe2ca7390e76c5A992749bB622087310d2e63ca29",
            asset,
          }),
          [
            { value: 20000000n, asset: { type: "native" } },
            { value: 10n, asset: { type: "erc20", assetReference: "contract-address" } },
          ],
          {
            value: 105000n,
            parameters: { gasLimit: 21000n, gasPrice: 5n, ...additionalFees },
          },
        );

        expect(res).toEqual({
          estimatedFees: 105000n,
          totalFees: expectedTotalFees,
          totalSpent: expectedTotalSpent,
          amount: expectedAmount,
          errors: {},
          warnings: {},
        });
      });

      it("does not return any error or warning for a valid eip1559 intent", async () => {
        jest.spyOn(ledgerExplorer, "getLastOperations").mockResolvedValue({
          lastCoinOperations: [],
          lastInternalOperations: [],
          lastNftOperations: [],
          lastTokenOperations: [{ contract: "contract-address" } as Operation],
        });
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
          eip1559Intent({
            ...amount,
            recipient: "0xe2ca7390e76c5A992749bB622087310d2e63ca29",
            asset,
          }),
          [
            { value: 20000000n, asset: { type: "native" } },
            { value: 10n, asset: { type: "erc20", assetReference: "contract-address" } },
          ],
          {
            value: 105000n,
            parameters: {
              gasLimit: 21000n,
              maxPriorityFeePerGas: 3n,
              maxFeePerGas: 5n,
              ...additionalFees,
            },
          },
        );

        expect(res).toEqual({
          estimatedFees: 105000n,
          totalFees: expectedTotalFees,
          totalSpent: expectedTotalSpent,
          amount: expectedAmount,
          errors: {},
          warnings: {},
        });
      });

      it("does not call the gas tracker if unnecessary", async () => {
        jest.spyOn(ledgerExplorer, "getLastOperations").mockResolvedValue({
          lastCoinOperations: [],
          lastInternalOperations: [],
          lastNftOperations: [],
          lastTokenOperations: [{ contract: "contract-address" } as Operation],
        });
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
          eip1559Intent({
            ...amount,
            recipient: "0xe2ca7390e76c5A992749bB622087310d2e63ca29",
            asset,
          }),
          [
            { value: 20000000n, asset: { type: "native" } },
            { value: 10n, asset: { type: "erc20", assetReference: "contract-address" } },
          ],
          {
            value: 105000n,
            parameters: {
              gasLimit: 21000n,
              maxPriorityFeePerGas: 3n,
              maxFeePerGas: 5n,
              ...additionalFees,
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
          estimatedFees: 105000n,
          totalFees: expectedTotalFees,
          totalSpent: expectedTotalSpent,
          amount: expectedAmount,
          errors: {},
          warnings: {},
        });
        expect(getGasOptions).not.toHaveBeenCalled();
      });
    },
  );

  it.each([
    ["legacy", legacyIntent, { value: 10n, parameters: { gasLimit: 5n, gasPrice: 3n } }],
    ["eip-1559", eip1559Intent, { value: 10n, parameters: { gasLimit: 5n, maxFeePerGas: 3n } }],
  ])(
    "keeps the estimation value coherent for a %s intent",
    async (_s, createIntent, estimation) => {
      expect(
        await validateIntent(
          {} as CryptoCurrency,
          createIntent({
            amount: 2n,
            recipient: "0xe2ca7390e76c5A992749bB622087310d2e63ca29",
          }),
          [
            { value: 20000000n, asset: { type: "native" } },
            { value: 10n, asset: { type: "erc20", assetReference: "contract-address" } },
          ],
          estimation,
        ),
      ).toMatchObject({ amount: 2n, estimatedFees: 15n, totalSpent: 17n });
    },
  );
});
