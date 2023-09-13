import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import { transactionToEthersTransaction } from "../../adapters";
import * as nodeApi from "../../api/node/rpc.common";
import {
  fromTransactionRaw,
  getSerializedTransaction,
  getTransactionData,
  getTypedTransaction,
  toTransactionRaw,
} from "../../transaction";
import {
  Transaction as EvmTransaction,
  EvmTransactionEIP1559,
  EvmTransactionLegacy,
  FeeData,
} from "../../types";
import {
  account,
  eip1559Tx,
  erc1155Transaction,
  erc1155TransactionNonFinite,
  erc721Transaction,
  legacyTx,
  nftEip1559tx,
  nftLegacyTx,
  nftRawLegacyTx,
  rawEip1559Tx,
  rawLegacyTx,
  rawNftEip1559Tx,
  testData,
  tokenTransaction,
} from "../fixtures/transaction.fixtures";

describe("EVM Family", () => {
  describe("transaction.ts", () => {
    describe("fromTransactionRaw", () => {
      describe("without customGasLimit", () => {
        it("should deserialize a raw EIP1559 transaction into a ledger live transaction", () => {
          expect(fromTransactionRaw(rawEip1559Tx)).toEqual(eip1559Tx);
        });

        it("should deserialize a raw legacy transaction into a ledger live transaction", () => {
          expect(fromTransactionRaw(rawLegacyTx)).toEqual(legacyTx);
        });

        it("should deserialize a raw legacy transaction without type into a ledger live transaction", () => {
          expect(
            fromTransactionRaw({
              ...rawLegacyTx,
              type: undefined,
            }),
          ).toEqual(legacyTx);
        });

        it("should deserialize an nft legacy transaction into a ledger live transaction", () => {
          expect(fromTransactionRaw(nftRawLegacyTx)).toEqual(nftLegacyTx);
        });

        it("should deserialize an nft EIP1559 transaction into a ledger live transaction", () => {
          expect(fromTransactionRaw(rawNftEip1559Tx)).toEqual(nftEip1559tx);
        });
      });
    });

    describe("with customGasLimit", () => {
      it("should deserialize a raw EIP1559 transaction into a ledger live transaction", () => {
        expect(fromTransactionRaw({ ...rawEip1559Tx, customGasLimit: "22000" })).toEqual({
          ...eip1559Tx,
          customGasLimit: new BigNumber(22000),
        });
      });

      it("should deserialize a raw legacy transaction into a ledger live transaction", () => {
        expect(fromTransactionRaw({ ...rawLegacyTx, customGasLimit: "22000" })).toEqual({
          ...legacyTx,
          customGasLimit: new BigNumber(22000),
        });
      });

      it("should deserialize a raw legacy transaction without type into a ledger live transaction", () => {
        expect(
          fromTransactionRaw({
            ...rawLegacyTx,
            type: undefined,
            customGasLimit: "22000",
          }),
        ).toEqual({
          ...legacyTx,
          customGasLimit: new BigNumber(22000),
        });
      });

      it("should deserialize an nft legacy transaction into a ledger live transaction", () => {
        expect(fromTransactionRaw({ ...nftRawLegacyTx, customGasLimit: "22000" })).toEqual({
          ...nftLegacyTx,
          customGasLimit: new BigNumber(22000),
        });
      });

      it("should deserialize an nft EIP1559 transaction into a ledger live transaction", () => {
        expect(fromTransactionRaw({ ...rawNftEip1559Tx, customGasLimit: "22000" })).toEqual({
          ...nftEip1559tx,
          customGasLimit: new BigNumber(22000),
        });
      });
    });

    describe("toTransaction", () => {
      describe("without customGasLimit", () => {
        it("should serialize a ledger live EIP1559 transaction into a raw transaction", () => {
          expect(toTransactionRaw(eip1559Tx)).toEqual(rawEip1559Tx);
        });

        it("should serialize a ledger live legacy transaction into a raw transaction", () => {
          expect(toTransactionRaw(legacyTx)).toEqual(rawLegacyTx);
        });

        it("should serialize an nft ledger live transaction without type into a raw live transaction", () => {
          expect(toTransactionRaw(nftLegacyTx)).toEqual(nftRawLegacyTx);
        });
      });

      describe("with customGasLimit", () => {
        it("should serialize a ledger live EIP1559 transaction into a raw transaction", () => {
          expect(toTransactionRaw({ ...eip1559Tx, customGasLimit: new BigNumber(22000) })).toEqual({
            ...rawEip1559Tx,
            customGasLimit: "22000",
          });
        });

        it("should serialize a ledger live legacy transaction into a raw transaction", () => {
          expect(toTransactionRaw({ ...legacyTx, customGasLimit: new BigNumber(22000) })).toEqual({
            ...rawLegacyTx,
            customGasLimit: "22000",
          });
        });

        it("should serialize an nft ledger live transaction without type into a raw live transaction", () => {
          expect(
            toTransactionRaw({ ...nftLegacyTx, customGasLimit: new BigNumber(22000) }),
          ).toEqual({ ...nftRawLegacyTx, customGasLimit: "22000" });
        });
      });
    });

    describe("getTransactionData", () => {
      it("should return the data for an ERC20 transaction", () => {
        expect(getTransactionData(account, tokenTransaction)).toEqual(
          Buffer.from(
            // using transfer method to 0x51DF0aF74a0DBae16cB845B46dAF2a35cB1D4168 & value is 0x64 (100)
            "a9059cbb00000000000000000000000051df0af74a0dbae16cb845b46daf2a35cb1d41680000000000000000000000000000000000000000000000000000000000000064",
            "hex",
          ),
        );
      });

      it("should return the data for an ERC721 transaction", () => {
        expect(getTransactionData(account, erc721Transaction)).toEqual(
          Buffer.from(
            // using safeTransferFrom method from 0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d to 0x51DF0aF74a0DBae16cB845B46dAF2a35cB1D4168 & tokenId is 1 (0x01)
            "b88d4fde0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d00000000000000000000000051df0af74a0dbae16cb845b46daf2a35cb1d4168000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000",
            "hex",
          ),
        );
      });

      it("should return the data for an ERC1155 transaction", () => {
        expect(getTransactionData(account, erc1155Transaction)).toEqual(
          Buffer.from(
            // using safeTransferFrom method from 0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d to 0x51DF0aF74a0DBae16cB845B46dAF2a35cB1D4168, tokenId is 1 (0x01) & quantity is 10 (0x0a)
            "f242432a0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d00000000000000000000000051df0af74a0dbae16cb845b46daf2a35cb1d41680000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000",
            "hex",
          ),
        );
      });

      it("should return the data for an ERC1155 transaction even if the quantity is Infinity or NaN", () => {
        expect(getTransactionData(account, erc1155TransactionNonFinite)).toEqual(
          Buffer.from(
            // using safeTransferFrom method from 0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d to 0x51DF0aF74a0DBae16cB845B46dAF2a35cB1D4168, tokenId is 1 (0x01) & quantity is 0 (0x00)
            "f242432a0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d00000000000000000000000051df0af74a0dbae16cb845b46daf2a35cb1d41680000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000",
            "hex",
          ),
        );
      });
    });

    describe("transactionToEthersTransaction", () => {
      describe("without customGasLimit", () => {
        it("should build convert an EIP1559 ledger live transaction to an ethers transaction", () => {
          const ethers1559Tx: ethers.Transaction = {
            to: "0xkvn",
            nonce: 0,
            gasLimit: ethers.BigNumber.from(21000),
            data: "0x" + testData,
            value: ethers.BigNumber.from(100),
            chainId: 1,
            type: 2,
            maxFeePerGas: ethers.BigNumber.from(10000),
            maxPriorityFeePerGas: ethers.BigNumber.from(10000),
          };

          expect(transactionToEthersTransaction(eip1559Tx)).toEqual(ethers1559Tx);
        });

        it("should build convert an legacy ledger live transaction to an ethers transaction", () => {
          const legacyEthersTx: ethers.Transaction = {
            to: "0xkvn",
            nonce: 0,
            gasLimit: ethers.BigNumber.from(21000),
            data: "0x" + testData,
            value: ethers.BigNumber.from(100),
            chainId: 1,
            type: 0,
            gasPrice: ethers.BigNumber.from(10000),
          };

          expect(transactionToEthersTransaction(legacyTx)).toEqual(legacyEthersTx);
        });
      });

      describe("with customGasLimit", () => {
        it("should build convert an EIP1559 ledger live transaction to an ethers transaction", () => {
          const ethers1559Tx: ethers.Transaction = {
            to: "0xkvn",
            nonce: 0,
            gasLimit: ethers.BigNumber.from(22000),
            data: "0x" + testData,
            value: ethers.BigNumber.from(100),
            chainId: 1,
            type: 2,
            maxFeePerGas: ethers.BigNumber.from(10000),
            maxPriorityFeePerGas: ethers.BigNumber.from(10000),
          };

          expect(
            transactionToEthersTransaction({ ...eip1559Tx, customGasLimit: new BigNumber(22000) }),
          ).toEqual(ethers1559Tx);
        });

        it("should build convert an legacy ledger live transaction to an ethers transaction", () => {
          const legacyEthersTx: ethers.Transaction = {
            to: "0xkvn",
            nonce: 0,
            gasLimit: ethers.BigNumber.from(22000),
            data: "0x" + testData,
            value: ethers.BigNumber.from(100),
            chainId: 1,
            type: 0,
            gasPrice: ethers.BigNumber.from(10000),
          };

          expect(
            transactionToEthersTransaction({ ...legacyTx, customGasLimit: new BigNumber(22000) }),
          ).toEqual(legacyEthersTx);
        });
      });
    });

    describe("getSerializedTransaction", () => {
      beforeAll(() => {
        jest.spyOn(nodeApi, "getTransactionCount").mockImplementation(() => Promise.resolve(0));
      });

      describe("without customGasLimit", () => {
        it("should serialize a type 0 transaction", async () => {
          const transactionLegacy: EvmTransaction = {
            amount: new BigNumber(100),
            useAllAmount: false,
            subAccountId: "id",
            recipient: "0x6775e49108cb77cda06Fc3BEF51bcD497602aD88", // obama.eth
            feesStrategy: "custom",
            family: "evm",
            mode: "send",
            nonce: 0,
            gasLimit: new BigNumber(21000),
            chainId: 1,
            gasPrice: new BigNumber(100),
            type: 0,
          };
          const serializedTx = await getSerializedTransaction(transactionLegacy);

          expect(serializedTx).toBe(
            "0xdf8064825208946775e49108cb77cda06fc3bef51bcd497602ad886480018080",
          );
        });

        it("should serialize a type 2 transaction", async () => {
          const transactionEIP1559: EvmTransaction = {
            amount: new BigNumber(100),
            useAllAmount: false,
            subAccountId: "id",
            recipient: "0x6775e49108cb77cda06Fc3BEF51bcD497602aD88", // obama.eth
            feesStrategy: "custom",
            family: "evm",
            mode: "send",
            nonce: 0,
            gasLimit: new BigNumber(21000),
            chainId: 1,
            maxFeePerGas: new BigNumber(100),
            maxPriorityFeePerGas: new BigNumber(100),
            type: 2,
          };
          const serializedTx = await getSerializedTransaction(transactionEIP1559);

          expect(serializedTx).toBe(
            "0x02df01806464825208946775e49108cb77cda06fc3bef51bcd497602ad886480c0",
          );
        });
      });

      describe("with customGasLimit", () => {
        it("should serialize a type 0 transaction", async () => {
          const transactionLegacy: EvmTransaction = {
            amount: new BigNumber(100),
            useAllAmount: false,
            subAccountId: "id",
            recipient: "0x6775e49108cb77cda06Fc3BEF51bcD497602aD88", // obama.eth
            feesStrategy: "custom",
            family: "evm",
            mode: "send",
            nonce: 0,
            gasLimit: new BigNumber(21000),
            customGasLimit: new BigNumber(22000),
            chainId: 1,
            gasPrice: new BigNumber(100),
            type: 0,
          };
          const serializedTx = await getSerializedTransaction(transactionLegacy);

          expect(serializedTx).toBe(
            "0xdf80648255f0946775e49108cb77cda06fc3bef51bcd497602ad886480018080",
          );
        });

        it("should serialize a type 2 transaction", async () => {
          const transactionEIP1559: EvmTransaction = {
            amount: new BigNumber(100),
            useAllAmount: false,
            subAccountId: "id",
            recipient: "0x6775e49108cb77cda06Fc3BEF51bcD497602aD88", // obama.eth
            feesStrategy: "custom",
            family: "evm",
            mode: "send",
            nonce: 0,
            gasLimit: new BigNumber(21000),
            customGasLimit: new BigNumber(22000),
            chainId: 1,
            maxFeePerGas: new BigNumber(100),
            maxPriorityFeePerGas: new BigNumber(100),
            type: 2,
          };
          const serializedTx = await getSerializedTransaction(transactionEIP1559);

          expect(serializedTx).toBe(
            "0x02df018064648255f0946775e49108cb77cda06fc3bef51bcd497602ad886480c0",
          );
        });
      });
    });

    describe("getTypedTransaction", () => {
      const getTransactionToType = (type: number): EvmTransaction => {
        if (type === 2) {
          return eip1559Tx;
        }

        return legacyTx;
      };

      describe.each([{ type: "legacy" }, { type: "eip1559" }])(
        `when transaction to type is $type`,
        type => {
          const transactionToType = getTransactionToType(type.type === "eip1559" ? 2 : 0);

          const legacyTransactionsTestCases: Array<{
            description: string;
            feeData: FeeData;
            expectedTransaction: EvmTransactionLegacy;
          }> = [
            {
              description: "only contains `maxFeePerGas`",
              feeData: {
                maxFeePerGas: new BigNumber(100),
                maxPriorityFeePerGas: null,
                gasPrice: null,
                nextBaseFee: null,
              },
              expectedTransaction: Object.freeze({
                ...transactionToType,
                maxFeePerGas: undefined,
                maxPriorityFeePerGas: undefined,
                gasPrice: new BigNumber(0),
                type: 0,
              }),
            },
            {
              description: "only contains `maxPriorityFeePerGas`",
              feeData: {
                maxFeePerGas: null,
                maxPriorityFeePerGas: new BigNumber(100),
                gasPrice: null,
                nextBaseFee: null,
              },
              expectedTransaction: Object.freeze({
                ...transactionToType,
                maxFeePerGas: undefined,
                maxPriorityFeePerGas: undefined,
                gasPrice: new BigNumber(0),
                type: 0,
              }),
            },
            {
              description: "only contains `gasPrice`",
              feeData: {
                maxFeePerGas: null,
                maxPriorityFeePerGas: null,
                gasPrice: new BigNumber(20000),
                nextBaseFee: null,
              },
              expectedTransaction: Object.freeze({
                ...transactionToType,
                maxFeePerGas: undefined,
                maxPriorityFeePerGas: undefined,
                gasPrice: new BigNumber(20000),
                type: 0,
              }),
            },
          ];

          describe("should return a type 0 transaction", () => {
            it.each(legacyTransactionsTestCases)(
              `when feeData $description`,
              ({ feeData, expectedTransaction }) => {
                const typedTransaction = getTypedTransaction(transactionToType, feeData);

                expect(typedTransaction).toEqual(expectedTransaction);
              },
            );
          });

          const eip1559TransactionsTestCases: Array<{
            description: string;
            feeData: FeeData;
            expectedTransaction: EvmTransactionEIP1559;
          }> = [
            {
              description: "only contains `maxFeePerGas` and `maxPriorityFeePerGas`",
              feeData: {
                maxFeePerGas: new BigNumber(100),
                maxPriorityFeePerGas: new BigNumber(10),
                gasPrice: null,
                nextBaseFee: null,
              },
              expectedTransaction: Object.freeze({
                ...transactionToType,
                maxFeePerGas: new BigNumber(100),
                maxPriorityFeePerGas: new BigNumber(10),
                gasPrice: undefined,
                type: 2,
              }),
            },
            {
              description: "contains `maxFeePerGas`, `maxPriorityFeePerGas` and `gasPrice`",
              feeData: {
                maxFeePerGas: new BigNumber(100),
                maxPriorityFeePerGas: new BigNumber(10),
                gasPrice: new BigNumber(20000),
                nextBaseFee: null,
              },
              expectedTransaction: Object.freeze({
                ...transactionToType,
                maxFeePerGas: new BigNumber(100),
                maxPriorityFeePerGas: new BigNumber(10),
                gasPrice: undefined,
                type: 2,
              }),
            },
          ];

          describe("should return a type 2 transaction", () => {
            it.each(eip1559TransactionsTestCases)(
              `when feeData $description`,
              ({ feeData, expectedTransaction }) => {
                const typedTransaction = getTypedTransaction(transactionToType, feeData);

                expect(typedTransaction).toEqual(expectedTransaction);
              },
            );
          });
        },
      );
    });
  });
});
