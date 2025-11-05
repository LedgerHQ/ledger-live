import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  BufferTxData,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/types";
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
    ).rejects.toThrow(
      "Unsupported intent type 'any'. Must be 'send-legacy', 'send-eip1559', 'staking-legacy', or 'staking-eip1559'",
    );
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
      { gasPrice: 8 },
    ],
    [
      "eip1559",
      2,
      {
        gasPrice: null,
        maxFeePerGas: new BigNumber(7),
        maxPriorityFeePerGas: new BigNumber(4),
        nextBaseFee: null,
      },
      {
        maxFeePerGas: 7,
        maxPriorityFeePerGas: 4,
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

      const { transaction } = await craftTransaction(
        { ethereumLikeInfo: { chainId: 42 } } as CryptoCurrency,
        {
          transactionIntent: {
            intentType: "transaction",
            type: `send-${transactionType}`,
            recipient: "0x7b2c7232f9e38f30e2868f0e5bf311cd83554b5a",
            amount: 10n,
            asset: { type: "native" },
          } as TransactionIntent<MemoNotSupported, BufferTxData>,
          customFees: {
            value: 0n,
            parameters: {
              gasPrice: 8n,
            },
          },
        },
      );

      expect(transaction).toEqual(
        ethers.Transaction.from({
          type: transactionTypeNumber,
          to: "0x7b2c7232f9e38f30e2868f0e5bf311cd83554b5a",
          nonce: 18,
          gasLimit: 2300,
          data: "0x",
          value: 10,
          chainId: 42,
          ...expectedFee,
        }).unsignedSerialized,
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

      const { transaction } = await craftTransaction(
        { ethereumLikeInfo: { chainId: 42 } } as CryptoCurrency,
        {
          transactionIntent: {
            intentType: "transaction",
            type: `send-${transactionType}`,
            recipient: "0x7b2c7232f9e38f30e2868f0e5bf311cd83554b5a",
            amount: 10n,
            asset: { type: "erc20", assetReference: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" },
          } as TransactionIntent<MemoNotSupported, BufferTxData>,
          customFees: {
            value: 0n,
            parameters: {
              gasPrice: 8n,
            },
          },
        },
      );

      expect(transaction).toEqual(
        ethers.Transaction.from({
          type: transactionTypeNumber,
          to: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          nonce: 18,
          gasLimit: 2300,
          data:
            "0x" +
            Buffer.concat([
              Buffer.from("a9059cbb000000000000000000000000", "hex"), // transfer selector
              Buffer.from("7b2c7232f9e38f30e2868f0e5bf311cd83554b5a", "hex"), // recipient
              Buffer.from(
                "000000000000000000000000000000000000000000000000000000000000000a",
                "hex",
              ), // amount
            ]).toString("hex"),
          value: 0,
          chainId: 42,
          ...expectedFee,
        }).unsignedSerialized,
      );
    });
  });

  it("preserves passed calldata", async () => {
    setCoinConfig(() => ({ info: { node: { type: "external" } } }) as unknown as EvmCoinConfig);
    jest.spyOn(externalNode, "getTransactionCount").mockResolvedValue(18);
    jest.spyOn(externalNode, "getGasEstimation").mockResolvedValue(new BigNumber(2300));
    jest.spyOn(externalNode, "getFeeData").mockResolvedValue({
      gasPrice: new BigNumber(5),
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
      nextBaseFee: null,
    });

    const { transaction } = await craftTransaction(
      { ethereumLikeInfo: { chainId: 42 } } as CryptoCurrency,
      {
        transactionIntent: {
          intentType: "transaction",
          type: "send-legacy",
          recipient: "0x7b2c7232f9e38f30e2868f0e5bf311cd83554b5a",
          amount: 10n,
          data: { type: "buffer", value: Buffer.from([0xca, 0xfe]) },
          asset: { type: "native" },
        } as TransactionIntent<MemoNotSupported, BufferTxData>,
      },
    );

    expect(transaction).toEqual(
      ethers.Transaction.from({
        type: 0,
        to: "0x7b2c7232f9e38f30e2868f0e5bf311cd83554b5a",
        nonce: 18,
        gasLimit: 2300,
        data: "0xcafe",
        value: 10,
        chainId: 42,
        gasPrice: 5,
      }).unsignedSerialized,
    );
  });

  it("preserves passed sequence", async () => {
    setCoinConfig(() => ({ info: { node: { type: "external" } } }) as unknown as EvmCoinConfig);
    jest.spyOn(externalNode, "getGasEstimation").mockResolvedValue(new BigNumber(2300));
    jest.spyOn(externalNode, "getFeeData").mockResolvedValue({
      gasPrice: new BigNumber(5),
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
      nextBaseFee: null,
    });

    const { transaction } = await craftTransaction(
      { ethereumLikeInfo: { chainId: 42 } } as CryptoCurrency,
      {
        transactionIntent: {
          intentType: "transaction",
          sequence: 15,
          type: "send-legacy",
          recipient: "0x7b2c7232f9e38f30e2868f0e5bf311cd83554b5a",
          amount: 10n,
          asset: { type: "native" },
        } as TransactionIntent<MemoNotSupported, BufferTxData>,
      },
    );

    expect(transaction).toEqual(
      ethers.Transaction.from({
        type: 0,
        to: "0x7b2c7232f9e38f30e2868f0e5bf311cd83554b5a",
        nonce: 15,
        gasLimit: 2300,
        value: 10,
        chainId: 42,
        gasPrice: 5,
      }).unsignedSerialized,
    );
  });

  describe("staking transactions", () => {
    beforeEach(() => {
      jest.clearAllMocks();
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
          maxFeePerGas: new BigNumber(7),
          maxPriorityFeePerGas: new BigNumber(4),
          nextBaseFee: null,
        },
        {
          maxFeePerGas: 7,
          maxPriorityFeePerGas: 4,
        },
      ],
    ])(
      "staking %s transaction type",
      (transactionType, transactionTypeNumber, feeData, _expectedFee) => {
        it.each([
          ["an external node", "external", externalNode],
          ["a ledger node", "ledger", ledgerNode],
        ])("crafts a SEI staking delegate transaction using %s", async (_, type, node) => {
          setCoinConfig(() => ({ info: { node: { type } } }) as unknown as EvmCoinConfig);
          jest.spyOn(node, "getTransactionCount").mockResolvedValue(25);
          jest.spyOn(node, "getGasEstimation").mockResolvedValue(new BigNumber(45000));
          jest.spyOn(node, "getFeeData").mockResolvedValue(feeData);

          const { transaction } = await craftTransaction(
            {
              id: "sei_network_evm",
              ethereumLikeInfo: { chainId: 42 },
            } as CryptoCurrency,
            {
              transactionIntent: {
                intentType: "staking",
                type: `staking-${transactionType}`,
                sender: "0x1234567890abcdef1234567890abcdef12345678",
                recipient: "0x000000000000000000000000000000000001005",
                valAddress: "seivaloper1234567890abcdef1234567890abcdef12345678",
                amount: 1000000000000000000n, // 1 SEI
                asset: { type: "native" },
                mode: "delegate",
              } as any,
            },
          );

          // Parse the returned transaction to verify its properties
          const parsedTx = ethers.Transaction.from(transaction);
          expect(parsedTx).toMatchObject({
            type: transactionTypeNumber,
            to: "0x0000000000000000000000000000000000001005", // SEI staking contract
            nonce: 25,
            gasLimit: 45000n,
            value: 1000000000000000000n,
            chainId: 42n,
          });
          expect(parsedTx.data).toMatch(/^0x[a-fA-F0-9]+$/); // encoded delegate function call
        });

        it.each([
          ["an external node", "external", externalNode],
          ["a ledger node", "ledger", ledgerNode],
        ])("crafts a SEI staking undelegate transaction using %s", async (_, type, node) => {
          setCoinConfig(() => ({ info: { node: { type } } }) as unknown as EvmCoinConfig);
          jest.spyOn(node, "getTransactionCount").mockResolvedValue(26);
          jest.spyOn(node, "getGasEstimation").mockResolvedValue(new BigNumber(50000));
          jest.spyOn(node, "getFeeData").mockResolvedValue(feeData);

          const { transaction } = await craftTransaction(
            {
              id: "sei_network_evm",
              ethereumLikeInfo: { chainId: 42 },
            } as CryptoCurrency,
            {
              transactionIntent: {
                intentType: "staking",
                type: `staking-${transactionType}`,
                sender: "0x1234567890abcdef1234567890abcdef12345678",
                recipient: "0x000000000000000000000000000000000001005",
                valAddress: "seivaloper1234567890abcdef1234567890abcdef12345678",
                amount: 500000000000000000n, // 0.5 SEI
                asset: { type: "native" },
                mode: "undelegate",
              } as any,
            },
          );

          // Parse the returned transaction to verify its properties
          const parsedTx = ethers.Transaction.from(transaction);
          expect(parsedTx).toMatchObject({
            type: transactionTypeNumber,
            to: "0x0000000000000000000000000000000000001005", // SEI staking contract
            nonce: 26,
            gasLimit: 50000n,
            value: 0n, // SEI undelegate is nonpayable
            chainId: 42n,
          });
          expect(parsedTx.data).toMatch(/^0x[a-fA-F0-9]+$/); // encoded undelegate function call
        });

        it.each([
          ["an external node", "external", externalNode],
          ["a ledger node", "ledger", ledgerNode],
        ])("crafts a CELO staking delegate transaction using %s", async (_, type, node) => {
          setCoinConfig(() => ({ info: { node: { type } } }) as unknown as EvmCoinConfig);
          jest.spyOn(node, "getTransactionCount").mockResolvedValue(30);
          jest.spyOn(node, "getGasEstimation").mockResolvedValue(new BigNumber(60000));
          jest.spyOn(node, "getFeeData").mockResolvedValue(feeData);

          const { transaction } = await craftTransaction(
            {
              id: "celo",
              ethereumLikeInfo: { chainId: 42220 },
            } as CryptoCurrency,
            {
              transactionIntent: {
                intentType: "staking",
                type: `staking-${transactionType}`,
                sender: "0x1234567890abcdef1234567890abcdef12345678",
                recipient: "0x55E1A0C8f376964bd339167476063bFED7f213d5",
                valAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
                amount: 100000000000000000000n, // 100 CELO
                asset: { type: "native" },
                mode: "delegate",
              } as any,
            },
          );

          // Parse the returned transaction to verify its properties
          const parsedTx = ethers.Transaction.from(transaction);
          expect(parsedTx).toMatchObject({
            type: transactionTypeNumber,
            to: "0x55E1A0C8f376964bd339167476063bFED7f213d5", // CELO staking contract
            nonce: 30,
            gasLimit: 60000n,
            value: 0n, // CELO delegateGovernanceVotes is nonpayable
            chainId: 42220n,
          });
          expect(parsedTx.data).toMatch(/^0x[a-fA-F0-9]+$/); // encoded delegate function call
        });
      },
    );

    it("fails to craft staking transaction for unsupported currency", async () => {
      setCoinConfig(() => ({ info: { node: { type: "external" } } }) as unknown as EvmCoinConfig);

      await expect(
        craftTransaction(
          {
            id: "unsupported_network",
            ethereumLikeInfo: { chainId: 999 },
          } as unknown as CryptoCurrency,
          {
            transactionIntent: {
              type: "staking",
              sender: "0x1234567890abcdef1234567890abcdef12345678",
              recipient: "0x000000000000000000000000000000000001005",
              valAddress: "validator123",
              amount: 1000000000000000000n,
              asset: { type: "native" },
              mode: "delegate",
            } as any,
          },
        ),
      ).rejects.toThrow(
        "Unsupported intent type 'staking'. Must be 'send-legacy', 'send-eip1559', 'staking-legacy', or 'staking-eip1559'",
      ); // Can throw GasEstimationError due to unsupported currency
    });

    it("fails to craft staking transaction with unsupported operation", async () => {
      setCoinConfig(() => ({ info: { node: { type: "external" } } }) as unknown as EvmCoinConfig);

      await expect(
        craftTransaction(
          {
            id: "sei_network_evm",
            ethereumLikeInfo: { chainId: 42 },
          } as CryptoCurrency,
          {
            transactionIntent: {
              type: "staking",
              sender: "0x1234567890abcdef1234567890abcdef12345678",
              recipient: "0x000000000000000000000000000000000001005",
              valAddress: "validator123",
              amount: 1000000000000000000n,
              asset: { type: "native" },
              mode: "unsupported_operation",
            } as any,
          },
        ),
      ).rejects.toThrow();
    });
  });
});
