import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { TransactionIntent } from "@ledgerhq/coin-framework/lib/api/types";
import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import * as externalNode from "../network/node/rpc.common";
import ledgerNode from "../network/node/ledger";
import { EvmCoinConfig, setCoinConfig } from "../config";
import { craftTransaction } from "./craftTransaction";

describe("craftTransaction", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("fails to craft an unknown intent type", async () => {
    await expect(
      craftTransaction({} as CryptoCurrency, { transactionIntent: { type: "any" } } as any),
    ).rejects.toThrow("Unsupported intent type 'any'. Must be 'send-legacy' or 'send-eip1559'");
  });

  describe.each([
    [
      "legacy",
      0,
      {
        gasPrice: new BigNumber(5),
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        nextBaseFee: null,
      },
      { gasPrice: 5 },
    ],
    [
      "eip1559",
      2,
      {
        gasPrice: null,
        maxFeePerGas: new BigNumber(4),
        maxPriorityFeePerGas: new BigNumber(7),
        nextBaseFee: null,
      },
      {
        maxFeePerGas: 4,
        maxPriorityFeePerGas: 7,
      },
    ],
  ])("%s transaction type", (transactionType, transactionTypeNumber, feeData, expectedFee) => {
    it.each([
      ["an external node", "external", externalNode],
      ["a ledger node", "ledger", ledgerNode],
    ])("crafts a transaction with the native asset using %s", async (_, type, node) => {
      setCoinConfig(() => ({ info: { node: { type } } }) as unknown as EvmCoinConfig);
      jest.spyOn(node, "getTransactionCount").mockResolvedValue(18);
      jest.spyOn(node, "getGasEstimation").mockResolvedValue(new BigNumber(2300));
      jest.spyOn(node, "getFeeData").mockResolvedValue(feeData);

      expect(
        await craftTransaction({ ethereumLikeInfo: { chainId: 42 } } as CryptoCurrency, {
          transactionIntent: {
            type: `send-${transactionType}`,
            recipient: "0x7b2c7232f9e38f30e2868f0e5bf311cd83554b5a",
            amount: 10n,
            asset: { type: "native" },
          } as TransactionIntent,
        }),
      ).toEqual(
        ethers.utils.serializeTransaction({
          type: transactionTypeNumber,
          to: "0x7b2c7232f9e38f30e2868f0e5bf311cd83554b5a",
          nonce: 18,
          gasLimit: 2300,
          data: Buffer.from([]),
          value: 10,
          chainId: 42,
          ...expectedFee,
        }),
      );
    });

    it.each([
      ["an external node", "external", externalNode],
      ["a ledger node", "ledger", ledgerNode],
    ])("crafts a transaction with a token asset using %s", async (_, type, node) => {
      setCoinConfig(() => ({ info: { node: { type } } }) as unknown as EvmCoinConfig);
      jest.spyOn(node, "getTransactionCount").mockResolvedValue(18);
      jest.spyOn(node, "getGasEstimation").mockResolvedValue(new BigNumber(2300));
      jest.spyOn(node, "getFeeData").mockResolvedValue(feeData);

      expect(
        await craftTransaction({ ethereumLikeInfo: { chainId: 42 } } as CryptoCurrency, {
          transactionIntent: {
            type: `send-${transactionType}`,
            recipient: "0x7b2c7232f9e38f30e2868f0e5bf311cd83554b5a",
            amount: 10n,
            asset: { type: "erc20", assetReference: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" },
          } as TransactionIntent,
        }),
      ).toEqual(
        ethers.utils.serializeTransaction({
          type: transactionTypeNumber,
          to: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          nonce: 18,
          gasLimit: 2300,
          data: Buffer.concat([
            Buffer.from("a9059cbb000000000000000000000000", "hex"), // transfer selector
            Buffer.from("7b2c7232f9e38f30e2868f0e5bf311cd83554b5a", "hex"), // recipient
            Buffer.from("000000000000000000000000000000000000000000000000000000000000000a", "hex"), // amount
          ]),
          value: 0,
          chainId: 42,
          ...expectedFee,
        }),
      );
    });
  });
});
