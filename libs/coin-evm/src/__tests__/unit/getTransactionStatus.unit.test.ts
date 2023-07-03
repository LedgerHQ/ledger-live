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
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById, getTokenById } from "@ledgerhq/cryptoassets";
import { makeAccount, makeTokenAccount } from "../fixtures/common.fixtures";
import { EvmTransactionEIP1559, EvmTransactionLegacy, GasOptions } from "../../types";
import getTransactionStatus from "../../getTransactionStatus";
import { NotEnoughNftOwned, NotOwnedNft, QuantityNeedsToBePositive } from "../../errors";

const recipient = "0xe2ca7390e76c5A992749bB622087310d2e63ca29"; // rambo.eth
const testData = Buffer.from("testBufferString").toString("hex");
const tokenAccount = makeTokenAccount("0xkvn", getTokenById("ethereum/erc20/usd__coin"));
const account = makeAccount("0xkvn", getCryptoCurrencyById("ethereum"), [tokenAccount]);
const legacyTx: EvmTransactionLegacy = {
  amount: new BigNumber(100),
  useAllAmount: false,
  subAccountId: "id",
  recipient,
  feesStrategy: "custom",
  family: "evm",
  mode: "send",
  nonce: 0,
  gasLimit: new BigNumber(21000),
  chainId: 1,
  data: Buffer.from(testData, "hex"),
  gasPrice: new BigNumber(100),
  type: 0,
};
const eip1559Tx: EvmTransactionEIP1559 = {
  amount: new BigNumber(100),
  useAllAmount: false,
  subAccountId: "id",
  recipient,
  feesStrategy: "custom",
  family: "evm",
  mode: "send",
  nonce: 0,
  gasLimit: new BigNumber(21000),
  chainId: 1,
  data: Buffer.from(testData, "hex"),
  maxFeePerGas: new BigNumber(100),
  maxPriorityFeePerGas: new BigNumber(100),
  type: 2,
};

const gasOptions: GasOptions = {
  slow: {
    maxFeePerGas: new BigNumber(1),
    maxPriorityFeePerGas: new BigNumber(1),
    nextBaseFee: new BigNumber(1),
    gasPrice: null,
  },
  medium: {
    maxFeePerGas: new BigNumber(2),
    maxPriorityFeePerGas: new BigNumber(2),
    nextBaseFee: new BigNumber(2),
    gasPrice: null,
  },
  fast: {
    maxFeePerGas: new BigNumber(3),
    maxPriorityFeePerGas: new BigNumber(3),
    nextBaseFee: new BigNumber(3),
    gasPrice: null,
  },
};

describe("EVM Family", () => {
  describe("getTransactionStatus.ts", () => {
    describe("Recipient", () => {
      it("should detect the missing recipient and have an error", async () => {
        const tx = { ...eip1559Tx, recipient: "" };
        const res = await getTransactionStatus(account, tx);
        expect(res.errors).toEqual(
          expect.objectContaining({
            recipient: new RecipientRequired(),
          }),
        );
      });

      it("should detect the incorrect recipient not being an eth address and have an error", async () => {
        const tx = { ...eip1559Tx, recipient: "0xkvn" };
        const res = await getTransactionStatus(account, tx);
        expect(res.errors).toEqual(
          expect.objectContaining({
            recipient: new InvalidAddress("", {
              currency: account.currency,
            }),
          }),
        );
      });

      it("should detect the recipient being an ICAP and have an error", async () => {
        const tx = {
          ...eip1559Tx,
          recipient: "XE89MW3Y75UITCQ4F53YDKR25UFLB1640YM", // ICAP version of recipient address
        };
        const res = await getTransactionStatus(account, tx);
        expect(res.errors).toEqual(
          expect.objectContaining({
            recipient: new InvalidAddress("", {
              currency: account.currency,
            }),
          }),
        );
      });

      it("should detect the recipient not being an EIP55 address and have an warning", async () => {
        const tx = { ...eip1559Tx, recipient: recipient.toLowerCase() };
        const res = await getTransactionStatus(account, tx);
        expect(res.warnings).toEqual(
          expect.objectContaining({
            recipient: new ETHAddressNonEIP(),
          }),
        );
      });
    });

    describe("Amount", () => {
      it("should detect tx without amount and have an error", async () => {
        const tx = {
          ...eip1559Tx,
          amount: new BigNumber(0),
          data: undefined,
        };
        const res = await getTransactionStatus(account, tx);

        expect(res.errors).toEqual(
          expect.objectContaining({
            amount: new AmountRequired(),
          }),
        );
      });

      it("should detect tx without amount but with data and not return error", async () => {
        const tx = {
          ...eip1559Tx,
          amount: new BigNumber(0),
        };
        const res = await getTransactionStatus(
          { ...account, balance: new BigNumber(10000000) },
          tx,
        );

        expect(res.errors).toEqual({});
      });

      it("should detect tx without amount (because of useAllAmount) but from tokenAccount and not return error", async () => {
        const tx = {
          ...eip1559Tx,
          amount: new BigNumber(0),
          useAllAmount: true,
          subAccountId: tokenAccount.id,
        };
        const res = await getTransactionStatus(
          {
            ...account,
            balance: new BigNumber(10000000),
            subAccounts: [
              {
                ...tokenAccount,
                balance: new BigNumber(10),
              },
            ],
          },
          tx,
        );

        expect(res.errors).toEqual({});
      });

      it("should detect account not having enough balance for a tx and have an error", async () => {
        const res = await getTransactionStatus(
          { ...account, balance: new BigNumber(0) },
          eip1559Tx,
        );

        expect(res.errors).toEqual(
          expect.objectContaining({
            amount: new NotEnoughBalance(),
          }),
        );
      });
    });

    describe("Gas", () => {
      it("should detect missing fees in a 1559 tx and have an error", async () => {
        const tx = { ...eip1559Tx, maxFeePerGas: undefined };
        const res = await getTransactionStatus(account, tx as any);

        expect(res.errors).toEqual(
          expect.objectContaining({
            gasPrice: new FeeNotLoaded(),
          }),
        );
      });

      it("should detect missing fees in a legacy tx and have an error", async () => {
        const tx = { ...legacyTx, gasPrice: undefined };
        const res = await getTransactionStatus(account, tx as any);

        expect(res.errors).toEqual(
          expect.objectContaining({
            gasPrice: new FeeNotLoaded(),
          }),
        );
      });

      it("should detect a gasLimit = 0 in a 1559 tx and have an error", async () => {
        const tx = { ...eip1559Tx, gasLimit: new BigNumber(0) };
        const res = await getTransactionStatus(account, tx as any);

        expect(res.errors).toEqual(
          expect.objectContaining({
            gasLimit: new FeeNotLoaded(),
          }),
        );
      });

      it("should detect a gasLimit = 0 in a legacy tx and have an error", async () => {
        const tx = { ...legacyTx, gasLimit: new BigNumber(0) };
        const res = await getTransactionStatus(account, tx as any);

        expect(res.errors).toEqual(
          expect.objectContaining({
            gasLimit: new FeeNotLoaded(),
          }),
        );
      });

      it("should detect gas limit being too low in a tx and have an error", async () => {
        const tx = { ...eip1559Tx, gasLimit: new BigNumber(20000) }; // min should be 21000
        const res = await getTransactionStatus(account, tx);

        expect(res.errors).toEqual(
          expect.objectContaining({
            gasLimit: new GasLessThanEstimate(),
          }),
        );
      });

      it("should detect gas being too high in a 1559 tx for the account balance and have an error", async () => {
        const notEnoughBalanceResponse = await getTransactionStatus(
          { ...account, balance: new BigNumber(2099999) },
          eip1559Tx,
        );
        const enoughhBalanceResponse = await getTransactionStatus(
          { ...account, balance: new BigNumber(2100000) },
          eip1559Tx,
        );

        expect(notEnoughBalanceResponse.errors).toEqual(
          expect.objectContaining({
            gasPrice: new NotEnoughGas(),
          }),
        );
        expect(enoughhBalanceResponse.errors).not.toEqual(
          expect.objectContaining({
            gasPrice: new NotEnoughGas(),
          }),
        );
      });

      it("should detect a maxPriorityFee = 0 in a 1559 tx and have an error", async () => {
        const res = await getTransactionStatus(
          { ...account, balance: new BigNumber(2100000) },
          {
            ...eip1559Tx,
            maxPriorityFeePerGas: new BigNumber(0),
          },
        );

        expect(res.errors).toEqual(
          expect.objectContaining({
            maxPriorityFee: new PriorityFeeTooLow(),
          }),
        );
      });

      it("should detect gas being too high in a legacy tx for the account balance and have an error", async () => {
        const notEnoughBalanceResponse = await getTransactionStatus(
          { ...account, balance: new BigNumber(2099999) },
          legacyTx,
        );
        const enoughhBalanceResponse = await getTransactionStatus(
          { ...account, balance: new BigNumber(2100001) },
          legacyTx,
        );

        expect(notEnoughBalanceResponse.errors).toEqual(
          expect.objectContaining({
            gasPrice: new NotEnoughGas(),
          }),
        );
        expect(enoughhBalanceResponse.errors).not.toEqual(
          expect.objectContaining({
            gasPrice: new NotEnoughGas(),
          }),
        );
      });

      it("should not detect gas being too high in a 1559 tx when there is no recipient and have an error", async () => {
        const notEnoughBalanceResponse = await getTransactionStatus(
          { ...account, balance: new BigNumber(2099999) },
          { ...eip1559Tx, recipient: "" },
        );
        const enoughhBalanceResponse = await getTransactionStatus(
          { ...account, balance: new BigNumber(2100000) },
          { ...eip1559Tx, recipient: "" },
        );

        expect(notEnoughBalanceResponse.errors).not.toEqual(
          expect.objectContaining({
            gasPrice: new NotEnoughGas(),
          }),
        );
        expect(enoughhBalanceResponse.errors).not.toEqual(
          expect.objectContaining({
            gasPrice: new NotEnoughGas(),
          }),
        );
      });

      it("should not detect gas being too high in a legacy tx when there is no recipient and have an error", async () => {
        const notEnoughBalanceResponse = await getTransactionStatus(
          { ...account, balance: new BigNumber(2099999) },
          { ...legacyTx, recipient: "" },
        );
        const enoughhBalanceResponse = await getTransactionStatus(
          { ...account, balance: new BigNumber(2100001) },
          { ...legacyTx, recipient: "" },
        );

        expect(notEnoughBalanceResponse.errors).not.toEqual(
          expect.objectContaining({
            gasPrice: new NotEnoughGas(),
          }),
        );
        expect(enoughhBalanceResponse.errors).not.toEqual(
          expect.objectContaining({
            gasPrice: new NotEnoughGas(),
          }),
        );
      });

      it("should detect maxFeePerGas being greater than max gasOptions maxFeePerGas and error", async () => {
        const response = await getTransactionStatus(account, {
          ...eip1559Tx,
          gasOptions,
          maxFeePerGas: new BigNumber(5),
        });

        expect(response.errors).toEqual(
          expect.objectContaining({
            maxPriorityFee: new PriorityFeeHigherThanMaxFee(),
          }),
        );
      });

      it("should detect customGasLimit being lower than gasLimit and warn", async () => {
        const response = await getTransactionStatus(account, {
          ...eip1559Tx,
          customGasLimit: eip1559Tx.gasLimit.minus(1),
        });

        expect(response.warnings).toEqual(
          expect.objectContaining({
            gasLimit: new GasLessThanEstimate(),
          }),
        );
      });

      it("should detect maxPriorityFeePerGas being greater than max gasOptions maxPriorityFeePerGas and warn", async () => {
        const response = await getTransactionStatus(account, {
          ...eip1559Tx,
          gasOptions,
          maxPriorityFeePerGas: new BigNumber(4),
        });

        expect(response.warnings).toEqual(
          expect.objectContaining({
            maxPriorityFee: new PriorityFeeTooHigh(),
          }),
        );
      });

      it("should detect maxPriorityFeePerGas being lower than min gasOptions maxPriorityFeePerGas and warn", async () => {
        const response = await getTransactionStatus(account, {
          ...eip1559Tx,
          gasOptions,
          maxPriorityFeePerGas: new BigNumber(0.5),
        });

        expect(response.warnings).toEqual(
          expect.objectContaining({
            maxPriorityFee: new PriorityFeeTooLow(),
          }),
        );
      });

      it("should detect maxFeePerGas being lower than recommanded next base fee and warn", async () => {
        const response = await getTransactionStatus(account, {
          ...eip1559Tx,
          gasOptions,
          maxFeePerGas: new BigNumber(1),
        });

        expect(response.warnings).toEqual(
          expect.objectContaining({
            maxFee: new MaxFeeTooLow(),
          }),
        );
      });
    });

    describe("Nft", () => {
      describe("ERC721", () => {
        const nft = {
          contract: "0xNftContract",
          tokenId: "1",
          amount: new BigNumber(1),
          currencyId: account.currency.id,
          id: "doesn't matter",
          standard: "ERC721" as const,
        };

        it("should detect a transaction for an ERC721 nft not owned by the account and have an error", async () => {
          const tx = {
            ...eip1559Tx,
            mode: "erc721" as const,
            nft: {
              collectionName: "",
              contract: nft.contract,
              tokenId: nft.tokenId,
              quantity: new BigNumber(1),
            },
          };
          const res = await getTransactionStatus(account, tx);

          expect(res.errors).toEqual(
            expect.objectContaining({
              amount: new NotOwnedNft(),
            }),
          );
        });
      });

      describe("ERC1155", () => {
        const nft = {
          contract: "0xAnotherNftContract",
          tokenId: "2",
          amount: new BigNumber(2),
          currencyId: account.currency.id,
          id: "still doesn't matter",
          standard: "ERC1155" as const,
        };

        it("should detect a transaction for an ERC1155 nft not owned by the account and have an error", async () => {
          const tx = {
            ...eip1559Tx,
            mode: "erc1155" as const,
            nft: {
              collectionName: "",
              contract: nft.contract,
              tokenId: nft.tokenId,
              quantity: new BigNumber(1),
            },
          };
          const res = await getTransactionStatus(account, tx);

          expect(res.errors).toEqual(
            expect.objectContaining({
              amount: new NotOwnedNft(),
            }),
          );
        });

        it("should detect a transaction for an ERC1155 where the quantity is 0 or below and have an error", async () => {
          const tx = {
            ...eip1559Tx,
            mode: "erc1155" as const,
            nft: {
              collectionName: "",
              contract: nft.contract,
              tokenId: nft.tokenId,
              quantity: new BigNumber(0),
            },
          };
          const res = await getTransactionStatus(
            {
              ...account,
              nfts: [nft],
            },
            tx,
          );

          expect(res.errors).toEqual(
            expect.objectContaining({
              amount: new QuantityNeedsToBePositive(),
            }),
          );
        });

        it("should detect a transaction for an ERC1155 nft but the account doesn't own enough of it and have an error", async () => {
          const tx = {
            ...eip1559Tx,
            mode: "erc1155" as const,
            nft: {
              collectionName: "",
              contract: nft.contract,
              tokenId: nft.tokenId,
              quantity: new BigNumber(3),
            },
          };
          const res = await getTransactionStatus(
            {
              ...account,
              nfts: [nft],
            },
            tx,
          );

          expect(res.errors).toEqual(
            expect.objectContaining({
              amount: new NotEnoughNftOwned(),
            }),
          );
        });
      });
    });

    describe("Global return", () => {
      it("should return the expected informations", async () => {
        const res = await getTransactionStatus(account, legacyTx);

        expect(res).toEqual(
          expect.objectContaining({
            errors: expect.any(Object),
            warnings: expect.any(Object),
            estimatedFees: new BigNumber(2100000),
            amount: legacyTx.amount,
            totalSpent: new BigNumber(2100000).plus(legacyTx.amount),
          }),
        );
      });
    });
  });
});
