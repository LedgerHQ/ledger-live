import eip55 from "eip55";
import BigNumber from "bignumber.js";
import { encodeNftId } from "@ledgerhq/coin-framework/nft/nftId";
import { Account, ProtoNFT } from "@ledgerhq/types-live";
import { getCryptoCurrencyById, getTokenById } from "@ledgerhq/cryptoassets";
import { makeAccount, makeTokenAccount } from "../fixtures/common.fixtures";
import getDeviceTransactionConfig from "../../deviceTransactionConfig";
import getTransactionStatus from "../../getTransactionStatus";
import { Transaction as EvmTransaction } from "../../types";

enum NFT_CONTRACTS {
  ERC721 = "0x60F80121C31A0d46B5279700f9DF786054aa5eE5",
  ERC1155 = "0xd07dc4262BCDbf85190C01c996b4C06a461d2430",
}

const currency = getCryptoCurrencyById("ethereum");
const tokenCurrency = getTokenById("ethereum/erc20/usd__coin");
const tokenAccount = makeTokenAccount("0xkvn", tokenCurrency);
const account = makeAccount("0xkvn", currency, [tokenAccount]);
const accountWithNfts: Account = Object.freeze({
  ...account,
  nfts: [
    {
      amount: new BigNumber(1),
      contract: NFT_CONTRACTS.ERC721,
      currencyId: currency.id,
      standard: "ERC721",
      tokenId: "1",
      id: encodeNftId(account.id, NFT_CONTRACTS.ERC721, "1", currency.id),
      metadata: { tokenName: "Collection ERC721" } as any,
    } as ProtoNFT,
    {
      amount: new BigNumber(10),
      contract: NFT_CONTRACTS.ERC1155,
      currencyId: currency.id,
      standard: "ERC721",
      tokenId: "1",
      id: encodeNftId(account.id, NFT_CONTRACTS.ERC1155, "1", currency.id),
      metadata: { tokenName: "Collection ERC1155" } as any,
    } as ProtoNFT,
  ],
});

const baseTransaction: EvmTransaction = {
  amount: new BigNumber(0),
  useAllAmount: false,
  subAccountId: "id",
  recipient: "",
  feesStrategy: "custom",
  family: "evm",
  mode: "send",
  gasPrice: new BigNumber(0),
  gasLimit: new BigNumber(21000),
  nonce: 0,
  chainId: 1,
};

const status = {
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber(0),
  amount: new BigNumber(0),
  totalSpent: new BigNumber(0),
};

describe("EVM Family", () => {
  describe("deviceTransactionConfig.ts", () => {
    describe("getDeviceTransactionConfig", () => {
      describe("From Live", () => {
        describe("Coin", () => {
          it("should return the fields for a normal transaction without domain", () => {
            const transaction: EvmTransaction = {
              ...baseTransaction,
              amount: new BigNumber(100),
              recipient: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
            };

            expect(
              getDeviceTransactionConfig({
                account: account,
                parentAccount: undefined,
                transaction,
                status,
              }),
            ).toEqual([
              {
                type: "amount",
                label: "Amount",
              },
              {
                type: "address",
                label: "Address",
                address: transaction.recipient,
              },
              { type: "text", label: "Network", value: "Ethereum" },
              { type: "fees", label: "Max fees" },
            ]);
          });

          it("should return the fields for a normal transaction with domain", () => {
            const transaction: EvmTransaction = {
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

            expect(
              getDeviceTransactionConfig({
                account: account,
                parentAccount: undefined,
                transaction,
                status,
              }),
            ).toEqual([
              {
                type: "amount",
                label: "Amount",
              },
              {
                type: "text",
                label: "Domain",
                value: transaction.recipientDomain?.domain,
              },
              { type: "text", label: "Network", value: "Ethereum" },
              { type: "fees", label: "Max fees" },
            ]);
          });
        });

        describe("Tokens", () => {
          it("should return the fields for a token transfer transaction without domain", () => {
            const transaction: EvmTransaction = {
              ...baseTransaction,
              amount: new BigNumber(100),
              recipient: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
            };

            expect(
              getDeviceTransactionConfig({
                account: tokenAccount,
                parentAccount: account,
                transaction,
                status,
              }),
            ).toEqual([
              {
                type: "amount",
                label: "Amount",
              },
              {
                type: "address",
                label: "Address",
                address: transaction.recipient,
              },
              { type: "text", label: "Network", value: "Ethereum" },
              { type: "fees", label: "Max fees" },
            ]);
          });

          it("should return the fields for a token transfer transaction with domain", () => {
            const transaction: EvmTransaction = {
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

            expect(
              getDeviceTransactionConfig({
                account: account,
                parentAccount: undefined,
                transaction,
                status,
              }),
            ).toEqual([
              {
                type: "amount",
                label: "Amount",
              },
              {
                type: "text",
                label: "Domain",
                value: transaction.recipientDomain?.domain,
              },
              { type: "text", label: "Network", value: "Ethereum" },
              { type: "fees", label: "Max fees" },
            ]);
          });
        });

        describe("NFTs", () => {
          it("should return the right fields for an NFT transfer with mode 'erc721'", async () => {
            const nftTransaction: EvmTransaction = {
              ...baseTransaction,
              mode: "erc721",
              recipient: "0x8E9eDe486d8208705C67095dd0b4839dEB127132", // pascalgauthier.eth
              nft: {
                contract: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
                tokenId: "1",
                quantity: new BigNumber(1),
                collectionName: "BAYC",
              },
            };
            const status = await getTransactionStatus(account, nftTransaction);

            expect(
              getDeviceTransactionConfig({
                account: tokenAccount,
                parentAccount: account,
                transaction: nftTransaction,
                status,
              }),
            ).toEqual([
              {
                type: "text",
                label: "Type",
                value: `NFT Transfer`,
              },
              {
                type: "text",
                label: "To",
                value: nftTransaction.recipient,
              },
              {
                type: "text",
                label: "Collection Name",
                value: nftTransaction.nft.collectionName,
              },
              {
                type: "address",
                label: "NFT Address",
                address: nftTransaction.nft.contract,
              },
              {
                type: "text",
                label: "NFT ID",
                value: nftTransaction.nft.tokenId,
              },
              { type: "text", label: "Network", value: "Ethereum" },
              { type: "fees", label: "Max fees" },
            ]);
          });

          it("should return the right fields for an NFT transfer with mode 'erc1155'", async () => {
            const nftTransaction: EvmTransaction = {
              ...baseTransaction,
              mode: "erc1155",
              recipient: "0x8E9eDe486d8208705C67095dd0b4839dEB127132", // pascalgauthier.eth
              nft: {
                contract: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
                tokenId: "1",
                quantity: new BigNumber(10),
                collectionName: "BAYC",
              },
            };
            const status = await getTransactionStatus(account, nftTransaction);

            expect(
              getDeviceTransactionConfig({
                account: tokenAccount,
                parentAccount: account,
                transaction: nftTransaction,
                status,
              }),
            ).toEqual([
              {
                type: "text",
                label: "Type",
                value: `NFT Transfer`,
              },
              {
                type: "text",
                label: "To",
                value: nftTransaction.recipient,
              },
              {
                type: "text",
                label: "Collection Name",
                value: nftTransaction.nft.collectionName,
              },
              {
                type: "text",
                label: "Quantity",
                value: nftTransaction.nft.quantity.toFixed(),
              },
              {
                type: "address",
                label: "NFT Address",
                address: nftTransaction.nft.contract,
              },
              {
                type: "text",
                label: "NFT ID",
                value: nftTransaction.nft.tokenId,
              },
              { type: "text", label: "Network", value: "Ethereum" },
              { type: "fees", label: "Max fees" },
            ]);
          });
        });
      });

      describe("From Wallet API", () => {
        describe("Coin", () => {
          it("should return the fields for a normal transaction", () => {
            const transaction = {
              ...baseTransaction,
              amount: new BigNumber(100),
              recipient: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
            };

            expect(
              getDeviceTransactionConfig({
                account: account,
                parentAccount: undefined,
                transaction,
                status,
              }),
            ).toEqual([
              {
                type: "amount",
                label: "Amount",
              },
              {
                type: "address",
                label: "Address",
                address: transaction.recipient,
              },
              { type: "text", label: "Network", value: "Ethereum" },
              { type: "fees", label: "Max fees" },
            ]);
          });
        });

        describe("Tokens", () => {
          it("should return the fields for a token transfer transaction", () => {
            const transaction = {
              ...baseTransaction,
              amount: new BigNumber(0),
              recipient: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              data: Buffer.from(
                "a9059cbb0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000000000000000000000000000000000000000000001",
                "hex",
              ),
            };

            expect(
              getDeviceTransactionConfig({
                account: account,
                parentAccount: undefined,
                transaction,
                status,
              }),
            ).toEqual([
              {
                type: "text",
                label: "Amount",
                value: `USDC 0.000001`,
              },
              {
                type: "address",
                label: "Address",
                address: eip55.encode(`0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d`),
              },
              { type: "text", label: "Network", value: "Ethereum" },
              { type: "fees", label: "Max fees" },
            ]);
          });

          it("should return the fields for a token allowance transaction", () => {
            const transaction = {
              ...baseTransaction,
              amount: new BigNumber(0),
              recipient: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              data: Buffer.from(
                "095ea7b30000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000000000000000000000000000000000000000000001",
                "hex",
              ),
            };

            expect(
              getDeviceTransactionConfig({
                account: account,
                parentAccount: undefined,
                transaction,
                status,
              }),
            ).toEqual([
              { type: "text", label: "Type", value: "Approve" },
              {
                type: "text",
                label: "Amount",
                value: `USDC 0.000001`,
              },
              {
                type: "address",
                label: "Address",
                address: eip55.encode(`0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d`),
              },
              { type: "text", label: "Network", value: "Ethereum" },
              { type: "fees", label: "Max fees" },
            ]);
          });

          it("should return the fields for an unlimited token allowance transaction", () => {
            const transaction = {
              ...baseTransaction,
              amount: new BigNumber(0),
              recipient: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
              data: Buffer.from(
                "095ea7b30000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933dffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
                "hex",
              ),
            };

            expect(
              getDeviceTransactionConfig({
                account: account,
                parentAccount: undefined,
                transaction,
                status,
              }),
            ).toEqual([
              { type: "text", label: "Type", value: "Approve" },
              {
                type: "text",
                label: "Amount",
                value: `Unlimited USDC`,
              },
              {
                type: "address",
                label: "Address",
                address: eip55.encode(`0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d`),
              },
              { type: "text", label: "Network", value: "Ethereum" },
              { type: "fees", label: "Max fees" },
            ]);
          });
        });

        describe("NFTs", () => {
          describe("ERC721", () => {
            it("should return the fields for an ERC721 transferFrom transaction", () => {
              const transaction = {
                ...baseTransaction,
                amount: new BigNumber(0),
                recipient: NFT_CONTRACTS.ERC721,
                data: Buffer.from(
                  "23b872dd0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000000000000000000000000000000000000000000001",
                  "hex",
                ),
              };

              expect(
                getDeviceTransactionConfig({
                  account: accountWithNfts,
                  parentAccount: undefined,
                  transaction,
                  status,
                }),
              ).toEqual([
                {
                  type: "text",
                  label: "NFT",
                  value: "Transfer",
                },
                {
                  type: "text",
                  label: "To",
                  value: eip55.encode(`0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d`),
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
                { type: "text", label: "Network", value: "Ethereum" },
                { type: "fees", label: "Max fees" },
              ]);
            });

            it("should return the fields for an ERC721 safeTransferFrom transaction", () => {
              const transaction = {
                ...baseTransaction,
                amount: new BigNumber(0),
                recipient: NFT_CONTRACTS.ERC721,
                data: Buffer.from(
                  "42842e0e0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000000000000000000000000000000000000000000001",
                  "hex",
                ),
              };

              expect(
                getDeviceTransactionConfig({
                  account: accountWithNfts,
                  parentAccount: undefined,
                  transaction,
                  status,
                }),
              ).toEqual([
                {
                  type: "text",
                  label: "NFT",
                  value: "Transfer",
                },
                {
                  type: "text",
                  label: "To",
                  value: eip55.encode(`0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d`),
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
                { type: "text", label: "Network", value: "Ethereum" },
                { type: "fees", label: "Max fees" },
              ]);
            });

            it("should return the fields for an ERC721 safeTransferFromWithData transaction", () => {
              const transaction = {
                ...baseTransaction,
                amount: new BigNumber(0),
                recipient: NFT_CONTRACTS.ERC721,
                data: Buffer.from(
                  "b88d4fde0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000",
                  "hex",
                ),
              };

              expect(
                getDeviceTransactionConfig({
                  account: accountWithNfts,
                  parentAccount: undefined,
                  transaction,
                  status,
                }),
              ).toEqual([
                {
                  type: "text",
                  label: "NFT",
                  value: "Transfer",
                },
                {
                  type: "text",
                  label: "To",
                  value: eip55.encode(`0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d`),
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
                { type: "text", label: "Network", value: "Ethereum" },
                { type: "fees", label: "Max fees" },
              ]);
            });

            it("should return the fields for an ERC721 approve transaction", () => {
              const transaction = {
                ...baseTransaction,
                amount: new BigNumber(0),
                recipient: NFT_CONTRACTS.ERC721,
                data: Buffer.from(
                  "095ea7b30000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000000000000000000000000000000000000000000001",
                  "hex",
                ),
              };

              expect(
                getDeviceTransactionConfig({
                  account: accountWithNfts,
                  parentAccount: undefined,
                  transaction,
                  status,
                }),
              ).toEqual([
                {
                  type: "text",
                  label: "NFT",
                  value: "Allowance",
                },
                {
                  type: "text",
                  label: "Allow",
                  value: eip55.encode(`0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d`),
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
                { type: "text", label: "Network", value: "Ethereum" },
                { type: "fees", label: "Max fees" },
              ]);
            });

            it("should return the fields for an ERC721 setApprovalForAll true transaction", () => {
              const transaction = {
                ...baseTransaction,
                amount: new BigNumber(0),
                recipient: NFT_CONTRACTS.ERC721,
                data: Buffer.from(
                  "a22cb4650000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000000000000000000000000000000000000000000001",
                  "hex",
                ),
              };

              expect(
                getDeviceTransactionConfig({
                  account: accountWithNfts,
                  parentAccount: undefined,
                  transaction,
                  status,
                }),
              ).toEqual([
                {
                  type: "text",
                  label: "NFT",
                  value: "Allowance",
                },
                {
                  type: "text",
                  label: "Allow",
                  value: eip55.encode(`0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d`),
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
                { type: "text", label: "Network", value: "Ethereum" },
                { type: "fees", label: "Max fees" },
              ]);
            });

            it("should return the fields for an ERC721 setApprovalForAll false transaction", () => {
              const transaction = {
                ...baseTransaction,
                amount: new BigNumber(0),
                recipient: NFT_CONTRACTS.ERC721,
                data: Buffer.from(
                  "a22cb4650000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000000000000000000000000000000000000000000000",
                  "hex",
                ),
              };

              expect(
                getDeviceTransactionConfig({
                  account: accountWithNfts,
                  parentAccount: undefined,
                  transaction,
                  status,
                }),
              ).toEqual([
                {
                  type: "text",
                  label: "NFT",
                  value: "Allowance",
                },
                {
                  type: "text",
                  label: "Revoke",
                  value: eip55.encode(`0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d`),
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
                { type: "text", label: "Network", value: "Ethereum" },
                { type: "fees", label: "Max fees" },
              ]);
            });
          });

          describe("ERC1155", () => {
            it("should return the fields for an ERC1155 safeTransferFrom transaction", () => {
              const transaction = {
                ...baseTransaction,
                amount: new BigNumber(0),
                recipient: NFT_CONTRACTS.ERC1155,
                data: Buffer.from(
                  "f242432a0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000",
                  "hex",
                ),
              };

              expect(
                getDeviceTransactionConfig({
                  account: accountWithNfts,
                  parentAccount: undefined,
                  transaction,
                  status,
                }),
              ).toEqual([
                {
                  type: "text",
                  label: "NFT",
                  value: "Transfer",
                },
                {
                  type: "text",
                  label: "To",
                  value: eip55.encode(`0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d`),
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
                { type: "text", label: "Network", value: "Ethereum" },
                { type: "fees", label: "Max fees" },
              ]);
            });

            it("should return the fields for an ERC1155 safeBatchTransferFrom transaction", () => {
              const transaction = {
                ...baseTransaction,
                amount: new BigNumber(0),
                recipient: NFT_CONTRACTS.ERC1155,
                data: Buffer.from(
                  "2eb2c2d60000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d00000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000",
                  "hex",
                ),
              };

              expect(
                getDeviceTransactionConfig({
                  account: accountWithNfts,
                  parentAccount: undefined,
                  transaction,
                  status,
                }),
              ).toEqual([
                {
                  type: "text",
                  label: "NFT",
                  value: "Batch Transfer",
                },
                {
                  type: "text",
                  label: "To",
                  value: eip55.encode(`0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d`),
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
                { type: "text", label: "Network", value: "Ethereum" },
                { type: "fees", label: "Max fees" },
              ]);
            });

            it("should return the fields for an ERC1155 setApprovalForAll true transaction", () => {
              const transaction = {
                ...baseTransaction,
                amount: new BigNumber(0),
                recipient: NFT_CONTRACTS.ERC1155,
                data: Buffer.from(
                  "a22cb4650000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000000000000000000000000000000000000000000001",
                  "hex",
                ),
              };

              expect(
                getDeviceTransactionConfig({
                  account: accountWithNfts,
                  parentAccount: undefined,
                  transaction,
                  status,
                }),
              ).toEqual([
                {
                  type: "text",
                  label: "NFT",
                  value: "Allowance",
                },
                {
                  type: "text",
                  label: "Allow",
                  value: eip55.encode(`0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d`),
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
                { type: "text", label: "Network", value: "Ethereum" },
                { type: "fees", label: "Max fees" },
              ]);
            });

            it("should return the fields for an ERC1155 setApprovalForAll false transaction", () => {
              const transaction = {
                ...baseTransaction,
                amount: new BigNumber(0),
                recipient: NFT_CONTRACTS.ERC1155,
                data: Buffer.from(
                  "a22cb4650000000000000000000000006cbcd73cd8e8a42844662f0a0e76d7f79afd933d0000000000000000000000000000000000000000000000000000000000000000",
                  "hex",
                ),
              };

              expect(
                getDeviceTransactionConfig({
                  account: accountWithNfts,
                  parentAccount: undefined,
                  transaction,
                  status,
                }),
              ).toEqual([
                {
                  type: "text",
                  label: "NFT",
                  value: "Allowance",
                },
                {
                  type: "text",
                  label: "Revoke",
                  value: eip55.encode(`0x6cbcd73cd8e8a42844662f0a0e76d7f79afd933d`),
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
                { type: "text", label: "Network", value: "Ethereum" },
                { type: "fees", label: "Max fees" },
              ]);
            });
          });
        });

        it("should fallback on other cases without amount", () => {
          const transaction = {
            ...baseTransaction,
            amount: new BigNumber(0),
            recipient: "0x000000000000000000000000000000000000dead",
            data: Buffer.from("00", "hex"),
          };

          expect(
            getDeviceTransactionConfig({
              account: account,
              parentAccount: undefined,
              transaction,
              status,
            }),
          ).toEqual([
            {
              type: "text",
              label: "Data",
              value: "Present",
            },
            {
              type: "amount",
              label: "Amount",
            },
            {
              type: "text",
              label: "Address",
              value: "0x000000000000000000000000000000000000dead",
            },
            { type: "text", label: "Network", value: "Ethereum" },
            { type: "fees", label: "Max fees" },
          ]);
        });

        it("should fallback on other cases with amount", () => {
          const transaction = {
            ...baseTransaction,
            amount: new BigNumber(1),
            recipient: "0x000000000000000000000000000000000000dead",
            data: Buffer.from("00", "hex"),
          };

          expect(
            getDeviceTransactionConfig({
              account: account,
              parentAccount: undefined,
              transaction,
              status,
            }),
          ).toEqual([
            {
              type: "text",
              label: "Data",
              value: "Present",
            },
            {
              type: "amount",
              label: "Amount",
            },
            {
              type: "text",
              label: "Address",
              value: "0x000000000000000000000000000000000000dead",
            },
            { type: "text", label: "Network", value: "Ethereum" },
            { type: "fees", label: "Max fees" },
          ]);
        });
      });

      it("should return the right fields and infos for a coin transaction without mode'", async () => {
        const coinTransaction: EvmTransaction = {
          ...baseTransaction,
          amount: new BigNumber(100),
          mode: "unknown mode" as any,
        };

        const status = await getTransactionStatus(account, coinTransaction);

        expect(
          getDeviceTransactionConfig({
            account,
            parentAccount: undefined,
            transaction: coinTransaction,
            status,
          }),
        ).toEqual([
          { type: "amount", label: "Amount" },
          {
            type: "address",
            label: "Address",
            address: coinTransaction.recipient,
          },
          {
            type: "text",
            label: "Network",
            value: currency.name.replace("Lite", "").trim(),
          },
          { type: "fees", label: "Max fees" },
        ]);
      });
    });
  });
});
