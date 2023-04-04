import eip55 from "eip55";
import BigNumber from "bignumber.js";
import { getTokenById } from "@ledgerhq/cryptoassets/tokens";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { makeAccount, makeTokenAccount } from "../../../evm/testUtils";
import { modes } from "../../modules/send";
import { Transaction } from "../../types";
import { encodeNftId } from "@ledgerhq/coin-framework/nft/nftId";

const ethereum = getCryptoCurrencyById("ethereum");
const usdc = getTokenById("ethereum/erc20/usd__coin");
const tokenAccount = makeTokenAccount("0x123", usdc);

enum NFT_CONTRACTS {
  ERC721 = "0x60f80121c31a0d46b5279700f9df786054aa5ee5",
  ERC1155 = "0xd07dc4262bcdbf85190c01c996b4c06a461d2430",
}

const account = makeAccount("0x123", ethereum, [tokenAccount]);
account.nfts = [
  {
    amount: new BigNumber(1),
    contract: NFT_CONTRACTS.ERC721,
    currencyId: ethereum.id,
    standard: "ERC721",
    tokenId: "1",
    id: encodeNftId(account.id, NFT_CONTRACTS.ERC721, "1", ethereum.id),
    metadata: { tokenName: "Collection ERC721" } as any,
  },
  {
    amount: new BigNumber(10),
    contract: NFT_CONTRACTS.ERC1155,
    currencyId: ethereum.id,
    standard: "ERC721",
    tokenId: "1",
    id: encodeNftId(account.id, NFT_CONTRACTS.ERC1155, "1", ethereum.id),
    metadata: { tokenName: "Collection ERC1155" } as any,
  },
];
const baseTransaction: Transaction = {
  amount: new BigNumber(0),
  useAllAmount: false,
  subAccountId: "id",
  recipient: "",
  feesStrategy: "custom",
  family: "ethereum",
  mode: "send",
  gasPrice: new BigNumber(0),
  estimatedGasLimit: new BigNumber(21000),
  nonce: 0,
  feeCustomUnit: undefined,
  networkInfo: undefined,
  userGasLimit: undefined,
};
const status: any = {};

describe("Ethereum Send module", () => {
  describe("fillDeviceTransactionConfig", () => {
    const { fillDeviceTransactionConfig } = modes.send;

    describe("From Live", () => {
      describe("Coin", () => {
        it("should fill the fields for a normal transaction without domain", () => {
          const fields = [];
          const transaction: Transaction = {
            ...baseTransaction,
            amount: new BigNumber(100),
            recipient: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
          };

          fillDeviceTransactionConfig(
            { account: account, parentAccount: undefined, transaction, status },
            fields
          );

          expect(fields).toEqual([
            {
              type: "amount",
              label: "Amount",
            },
            {
              type: "address",
              label: "Address",
              address: transaction.recipient,
            },
          ]);
        });

        it("should fill the fields for a normal transaction with domain", () => {
          const fields = [];
          const transaction: Transaction = {
            ...baseTransaction,
            amount: new BigNumber(100),
            recipient: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
            recipientDomain: {
              registry: "ens",
              domain: "vitalik.eth",
              address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
              type: "forward",
            },
          };

          fillDeviceTransactionConfig(
            { account: account, parentAccount: undefined, transaction, status },
            fields
          );

          expect(fields).toEqual([
            {
              type: "amount",
              label: "Amount",
            },
            {
              type: "text",
              label: "Domain",
              value: transaction.recipientDomain?.domain,
            },
          ]);
        });
      });

      describe("Tokens", () => {
        it("should fill the fields for a token transfer transaction without domain", () => {
          const fields = [];
          const transaction: Transaction = {
            ...baseTransaction,
            amount: new BigNumber(100),
            recipient: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
          };

          fillDeviceTransactionConfig(
            {
              account: tokenAccount,
              parentAccount: account,
              transaction,
              status,
            },
            fields
          );

          expect(fields).toEqual([
            {
              type: "amount",
              label: "Amount",
            },
            {
              type: "address",
              label: "Address",
              address: transaction.recipient,
            },
          ]);
        });

        it("should fill the fields for a token transfer transaction with domain", () => {
          const fields = [];
          const transaction: Transaction = {
            ...baseTransaction,
            amount: new BigNumber(100),
            recipient: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
            recipientDomain: {
              registry: "ens",
              domain: "vitalik.eth",
              address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
              type: "forward",
            },
          };

          fillDeviceTransactionConfig(
            { account: account, parentAccount: undefined, transaction, status },
            fields
          );

          expect(fields).toEqual([
            {
              type: "amount",
              label: "Amount",
            },
            {
              type: "text",
              label: "Domain",
              value: transaction.recipientDomain?.domain,
            },
          ]);
        });

        // Handled by ERC20.ts module (-> soon removed)
        it.skip("should fill the fields for a token allowance transaction without domain", () => {});
        it.skip("should fill the fields for a token allowance transaction with domain", () => {});
      });

      // Handled by ERC721.ts / ERC1155.ts module
      describe.skip("NFTs", () => {
        it.skip("should fill the fields for an ERC721 transfer transaction", () => {});
        it.skip("should fill the fields for an ERC1155 transfer transaction", () => {});
      });
    });

    describe("From Wallet API", () => {
      describe("Coin", () => {
        it("should fill the fields for a normal transaction", () => {
          const fields = [];
          const transaction = {
            ...baseTransaction,
            amount: new BigNumber(100),
            recipient: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
          };

          fillDeviceTransactionConfig(
            { account: account, parentAccount: undefined, transaction, status },
            fields
          );

          expect(fields).toEqual([
            {
              type: "amount",
              label: "Amount",
            },
            {
              type: "address",
              label: "Address",
              address: transaction.recipient,
            },
          ]);
        });
      });

      describe("Tokens", () => {
        it("should fill the fields for a token transfer transaction", () => {
          const fields = [];
          const transaction = {
            ...baseTransaction,
            amount: new BigNumber(0),
            recipient: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            data: Buffer.from(
              "a9059cbb0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000000000000000000000000000000000000000000001",
              "hex"
            ),
          };

          fillDeviceTransactionConfig(
            {
              account: account,
              parentAccount: undefined,
              transaction,
              status,
            },
            fields
          );

          expect(fields).toEqual([
            {
              type: "text",
              label: "Amount",
              value: `USDC 0.000001`,
            },
            {
              type: "address",
              label: "Address",
              address: eip55.encode(
                `0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d`
              ),
            },
          ]);
        });

        it("should fill the fields for a token allowance transaction", () => {
          const fields = [];
          const transaction = {
            ...baseTransaction,
            amount: new BigNumber(0),
            recipient: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            data: Buffer.from(
              "095ea7b30000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000000000000000000000000000000000000000000001",
              "hex"
            ),
          };

          fillDeviceTransactionConfig(
            {
              account: account,
              parentAccount: undefined,
              transaction,
              status,
            },
            fields
          );

          expect(fields).toEqual([
            { type: "text", label: "Type", value: "Approve" },
            {
              type: "text",
              label: "Amount",
              value: `USDC 0.000001`,
            },
            {
              type: "address",
              label: "Address",
              address: eip55.encode(
                `0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d`
              ),
            },
          ]);
        });

        it("should fill the fields for an unlimited token allowance transaction", () => {
          const fields = [];
          const transaction = {
            ...baseTransaction,
            amount: new BigNumber(0),
            recipient: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            data: Buffer.from(
              "095ea7b30000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933dffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
              "hex"
            ),
          };

          fillDeviceTransactionConfig(
            {
              account: account,
              parentAccount: undefined,
              transaction,
              status,
            },
            fields
          );

          expect(fields).toEqual([
            { type: "text", label: "Type", value: "Approve" },
            {
              type: "text",
              label: "Amount",
              value: `Unlimited USDC`,
            },
            {
              type: "address",
              label: "Address",
              address: eip55.encode(
                `0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d`
              ),
            },
          ]);
        });
      });

      describe("NFTs", () => {
        describe("ERC721", () => {
          it("should fill the fields for an ERC721 transferFrom transaction", () => {
            const fields = [];
            const transaction = {
              ...baseTransaction,
              amount: new BigNumber(0),
              recipient: "0x60F80121C31A0d46B5279700f9DF786054aa5eE5",
              data: Buffer.from(
                "23b872dd0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000000000000000000000000000000000000000000001",
                "hex"
              ),
            };

            fillDeviceTransactionConfig(
              {
                account: account,
                parentAccount: undefined,
                transaction,
                status,
              },
              fields
            );

            expect(fields).toEqual([
              {
                type: "text",
                label: "NFT",
                value: "Transfer",
              },
              {
                type: "text",
                label: "To",
                value: eip55.encode(
                  `0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d`
                ),
              },
              {
                type: "text",
                label: "Collection Name",
                value: "Collection ERC721",
              },
              {
                type: "address",
                label: "NFT Address",
                address: eip55.encode(NFT_CONTRACTS.ERC721),
              },
              {
                type: "text",
                label: "NFT ID",
                value: "1",
              },
            ]);
          });

          it("should fill the fields for an ERC721 safeTransferFrom transaction", () => {
            const fields = [];
            const transaction = {
              ...baseTransaction,
              amount: new BigNumber(0),
              recipient: "0x60F80121C31A0d46B5279700f9DF786054aa5eE5",
              data: Buffer.from(
                "42842e0e0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000000000000000000000000000000000000000000001",
                "hex"
              ),
            };

            fillDeviceTransactionConfig(
              {
                account: account,
                parentAccount: undefined,
                transaction,
                status,
              },
              fields
            );

            expect(fields).toEqual([
              {
                type: "text",
                label: "NFT",
                value: "Transfer",
              },
              {
                type: "text",
                label: "To",
                value: eip55.encode(
                  `0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d`
                ),
              },
              {
                type: "text",
                label: "Collection Name",
                value: "Collection ERC721",
              },
              {
                type: "address",
                label: "NFT Address",
                address: eip55.encode(NFT_CONTRACTS.ERC721),
              },
              {
                type: "text",
                label: "NFT ID",
                value: "1",
              },
            ]);
          });

          it("should fill the fields for an ERC721 safeTransferFromWithData transaction", () => {
            const fields = [];
            const transaction = {
              ...baseTransaction,
              amount: new BigNumber(0),
              recipient: "0x60F80121C31A0d46B5279700f9DF786054aa5eE5",
              data: Buffer.from(
                "b88d4fde0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000",
                "hex"
              ),
            };

            fillDeviceTransactionConfig(
              {
                account: account,
                parentAccount: undefined,
                transaction,
                status,
              },
              fields
            );

            expect(fields).toEqual([
              {
                type: "text",
                label: "NFT",
                value: "Transfer",
              },
              {
                type: "text",
                label: "To",
                value: eip55.encode(
                  `0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d`
                ),
              },
              {
                type: "text",
                label: "Collection Name",
                value: "Collection ERC721",
              },
              {
                type: "address",
                label: "NFT Address",
                address: eip55.encode(NFT_CONTRACTS.ERC721),
              },
              {
                type: "text",
                label: "NFT ID",
                value: "1",
              },
            ]);
          });

          it("should fill the fields for an ERC721 approve transaction", () => {
            const fields = [];
            const transaction = {
              ...baseTransaction,
              amount: new BigNumber(0),
              recipient: "0x60F80121C31A0d46B5279700f9DF786054aa5eE5",
              data: Buffer.from(
                "095ea7b30000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000000000000000000000000000000000000000000001",
                "hex"
              ),
            };

            fillDeviceTransactionConfig(
              {
                account: account,
                parentAccount: undefined,
                transaction,
                status,
              },
              fields
            );

            expect(fields).toEqual([
              {
                type: "text",
                label: "NFT",
                value: "Allowance",
              },
              {
                type: "text",
                label: "Allow",
                value: eip55.encode(
                  `0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d`
                ),
              },
              {
                type: "text",
                label: "To Manage Your",
                value: "Collection ERC721",
              },
              {
                type: "address",
                label: "NFT Address",
                address: eip55.encode(NFT_CONTRACTS.ERC721),
              },
              {
                type: "text",
                label: "NFT ID",
                value: "1",
              },
            ]);
          });

          it("should fill the fields for an ERC721 setApprovalForAll true transaction", () => {
            const fields = [];
            const transaction = {
              ...baseTransaction,
              amount: new BigNumber(0),
              recipient: "0x60F80121C31A0d46B5279700f9DF786054aa5eE5",
              data: Buffer.from(
                "a22cb4650000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000000000000000000000000000000000000000000001",
                "hex"
              ),
            };

            fillDeviceTransactionConfig(
              {
                account: account,
                parentAccount: undefined,
                transaction,
                status,
              },
              fields
            );

            expect(fields).toEqual([
              {
                type: "text",
                label: "NFT",
                value: "Allowance",
              },
              {
                type: "text",
                label: "Allow",
                value: eip55.encode(
                  `0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d`
                ),
              },
              {
                type: "text",
                label: "To Manage ALL",
                value: "Collection ERC721",
              },
              {
                type: "address",
                label: "NFT Address",
                address: eip55.encode(NFT_CONTRACTS.ERC721),
              },
            ]);
          });

          it("should fill the fields for an ERC721 setApprovalForAll false transaction", () => {
            const fields = [];
            const transaction = {
              ...baseTransaction,
              amount: new BigNumber(0),
              recipient: "0x60F80121C31A0d46B5279700f9DF786054aa5eE5",
              data: Buffer.from(
                "a22cb4650000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000000000000000000000000000000000000000000000",
                "hex"
              ),
            };

            fillDeviceTransactionConfig(
              {
                account: account,
                parentAccount: undefined,
                transaction,
                status,
              },
              fields
            );

            expect(fields).toEqual([
              {
                type: "text",
                label: "NFT",
                value: "Allowance",
              },
              {
                type: "text",
                label: "Revoke",
                value: eip55.encode(
                  `0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d`
                ),
              },
              {
                type: "text",
                label: "To Manage ALL",
                value: "Collection ERC721",
              },
              {
                type: "address",
                label: "NFT Address",
                address: eip55.encode(NFT_CONTRACTS.ERC721),
              },
            ]);
          });
        });

        describe("ERC1155", () => {
          it("should fill the fields for an ERC1155 safeTransferFrom transaction", () => {
            const fields = [];
            const transaction = {
              ...baseTransaction,
              amount: new BigNumber(0),
              recipient: "0xd07dc4262bcdbf85190c01c996b4c06a461d2430",
              data: Buffer.from(
                "f242432a0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000",
                "hex"
              ),
            };

            fillDeviceTransactionConfig(
              {
                account: account,
                parentAccount: undefined,
                transaction,
                status,
              },
              fields
            );

            expect(fields).toEqual([
              {
                type: "text",
                label: "NFT",
                value: "Transfer",
              },
              {
                type: "text",
                label: "To",
                value: eip55.encode(
                  `0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d`
                ),
              },
              {
                type: "text",
                label: "Collection Name",
                value: "Collection ERC1155",
              },
              {
                type: "address",
                label: "NFT Address",
                address: eip55.encode(NFT_CONTRACTS.ERC1155),
              },
              {
                type: "text",
                label: "NFT ID",
                value: "1",
              },
              {
                type: "text",
                label: "Quantity",
                value: "5",
              },
            ]);
          });

          it("should fill the fields for an ERC1155 safeBatchTransferFrom transaction", () => {
            const fields = [];
            const transaction = {
              ...baseTransaction,
              amount: new BigNumber(0),
              recipient: "0xd07dc4262bcdbf85190c01c996b4c06a461d2430",
              data: Buffer.from(
                "2eb2c2d60000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d00000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000",
                "hex"
              ),
            };

            fillDeviceTransactionConfig(
              {
                account: account,
                parentAccount: undefined,
                transaction,
                status,
              },
              fields
            );

            expect(fields).toEqual([
              {
                type: "text",
                label: "NFT",
                value: "Batch Transfer",
              },
              {
                type: "text",
                label: "To",
                value: eip55.encode(
                  `0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d`
                ),
              },
              {
                type: "text",
                label: "Collection Name",
                value: "Collection ERC1155",
              },
              {
                type: "address",
                label: "NFT Address",
                address: eip55.encode(NFT_CONTRACTS.ERC1155),
              },
              {
                type: "text",
                label: "Total Quantity",
                value: "15 from 2 NFT IDs",
              },
            ]);
          });

          it("should fill the fields for an ERC1155 setApprovalForAll true transaction", () => {
            const fields = [];
            const transaction = {
              ...baseTransaction,
              amount: new BigNumber(0),
              recipient: "0xd07dc4262bcdbf85190c01c996b4c06a461d2430",
              data: Buffer.from(
                "a22cb4650000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000000000000000000000000000000000000000000001",
                "hex"
              ),
            };

            fillDeviceTransactionConfig(
              {
                account: account,
                parentAccount: undefined,
                transaction,
                status,
              },
              fields
            );

            expect(fields).toEqual([
              {
                type: "text",
                label: "NFT",
                value: "Allowance",
              },
              {
                type: "text",
                label: "Allow",
                value: eip55.encode(
                  `0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d`
                ),
              },
              {
                type: "text",
                label: "To Manage ALL",
                value: "Collection ERC1155",
              },
              {
                type: "address",
                label: "NFT Address",
                address: eip55.encode(NFT_CONTRACTS.ERC1155),
              },
            ]);
          });

          it("should fill the fields for an ERC1155 setApprovalForAll false transaction", () => {
            const fields = [];
            const transaction = {
              ...baseTransaction,
              amount: new BigNumber(0),
              recipient: "0xd07dc4262bcdbf85190c01c996b4c06a461d2430",
              data: Buffer.from(
                "a22cb4650000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000000000000000000000000000000000000000000000",
                "hex"
              ),
            };

            fillDeviceTransactionConfig(
              {
                account: account,
                parentAccount: undefined,
                transaction,
                status,
              },
              fields
            );

            expect(fields).toEqual([
              {
                type: "text",
                label: "NFT",
                value: "Allowance",
              },
              {
                type: "text",
                label: "Revoke",
                value: eip55.encode(
                  `0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d`
                ),
              },
              {
                type: "text",
                label: "To Manage ALL",
                value: "Collection ERC1155",
              },
              {
                type: "address",
                label: "NFT Address",
                address: eip55.encode(NFT_CONTRACTS.ERC1155),
              },
            ]);
          });
        });
      });

      it("should fallback on other cases without amount", () => {
        const fields = [];
        const transaction = {
          ...baseTransaction,
          amount: new BigNumber(0),
          recipient: "0xAnything",
          data: Buffer.from("00", "hex"),
        };

        fillDeviceTransactionConfig(
          {
            account: account,
            parentAccount: undefined,
            transaction,
            status,
          },
          fields
        );

        expect(fields).toEqual([
          {
            type: "text",
            label: "Data",
            value: "Present",
          },
        ]);
      });

      it("should fallback on other cases with amount", () => {
        const fields = [];
        const transaction = {
          ...baseTransaction,
          amount: new BigNumber(1),
          recipient: "0xAnything",
          data: Buffer.from("00", "hex"),
        };

        fillDeviceTransactionConfig(
          {
            account: account,
            parentAccount: undefined,
            transaction,
            status,
          },
          fields
        );

        expect(fields).toEqual([
          {
            type: "text",
            label: "Data",
            value: "Present",
          },
          {
            type: "amount",
            label: "Amount",
          },
        ]);
      });
    });
  });
});
