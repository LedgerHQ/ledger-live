/* eslint-disable @typescript-eslint/ban-ts-comment */
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById, getTokenById } from "@ledgerhq/cryptoassets";
import {
  NotEnoughGas,
  FeeNotLoaded,
  InvalidAddress,
  ETHAddressNonEIP,
  RecipientRequired,
  AmountRequired,
  NotEnoughBalance,
  GasLessThanEstimate,
} from "@ledgerhq/errors";
import { EvmTransactionEIP1559, EvmTransactionLegacy } from "../types";
import getTransactionStatus from "../getTransactionStatus";
import { makeAccount, makeTokenAccount } from "../testUtils";

const recipient = "0xe2ca7390e76c5A992749bB622087310d2e63ca29"; // rambo.eth
const testData = Buffer.from("testBufferString").toString("hex");
const tokenAccount = makeTokenAccount(
  "0xkvn",
  getTokenById("ethereum/erc20/usd__coin")
);
const account = makeAccount("0xkvn", getCryptoCurrencyById("ethereum"), [
  tokenAccount,
]);
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

describe("EVM Family", () => {
  describe("getTransactionStatus.ts", () => {
    describe("Recipient", () => {
      it("should detect the missing recipient and have an error", async () => {
        const tx = { ...eip1559Tx, recipient: "" };
        const res = await getTransactionStatus(account, tx);
        expect(res.errors).toEqual(
          expect.objectContaining({
            recipient: new RecipientRequired(),
          })
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
          })
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
          })
        );
      });

      it("should detect the recipient not being an EIP55 address and have an warning", async () => {
        const tx = { ...eip1559Tx, recipient: recipient.toLowerCase() };
        const res = await getTransactionStatus(account, tx);
        expect(res.warnings).toEqual(
          expect.objectContaining({
            recipient: new ETHAddressNonEIP(),
          })
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
          })
        );
      });

      it("should detect tx without amount but with data and not return error", async () => {
        const tx = {
          ...eip1559Tx,
          amount: new BigNumber(0),
        };
        const res = await getTransactionStatus(
          { ...account, balance: new BigNumber(10000000) },
          tx
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
          tx
        );

        expect(res.errors).toEqual({});
      });

      it("should detect account not having enough balance for a tx and have an error", async () => {
        const res = await getTransactionStatus(
          { ...account, balance: new BigNumber(0) },
          eip1559Tx
        );

        expect(res.errors).toEqual(
          expect.objectContaining({
            amount: new NotEnoughBalance(),
          })
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
          })
        );
      });

      it("should detect missing fees in a legacy tx and have an error", async () => {
        const tx = { ...legacyTx, gasPrice: undefined };
        const res = await getTransactionStatus(account, tx as any);

        expect(res.errors).toEqual(
          expect.objectContaining({
            gasPrice: new FeeNotLoaded(),
          })
        );
      });

      it("should detect gas limit being too low in a tx and have an error", async () => {
        const tx = { ...eip1559Tx, gasLimit: new BigNumber(20000) }; // min should be 21000
        const res = await getTransactionStatus(account, tx);

        expect(res.errors).toEqual(
          expect.objectContaining({
            gasLimit: new GasLessThanEstimate(),
          })
        );
      });

      it("should detect gas being too high in a 1559 tx for the account balance and have an error", async () => {
        const notEnoughBalanceResponse = await getTransactionStatus(
          { ...account, balance: new BigNumber(2099999) },
          eip1559Tx
        );
        const enoughhBalanceResponse = await getTransactionStatus(
          { ...account, balance: new BigNumber(2100000) },
          eip1559Tx
        );

        expect(notEnoughBalanceResponse.errors).toEqual(
          expect.objectContaining({
            gasPrice: new NotEnoughGas(),
          })
        );
        expect(enoughhBalanceResponse.errors).not.toEqual(
          expect.objectContaining({
            gasPrice: new NotEnoughGas(),
          })
        );
      });

      it("should detect gas being too high in a legacy tx for the account balance and have an error", async () => {
        const notEnoughBalanceResponse = await getTransactionStatus(
          { ...account, balance: new BigNumber(2099999) },
          legacyTx
        );
        const enoughhBalanceResponse = await getTransactionStatus(
          { ...account, balance: new BigNumber(2100001) },
          legacyTx
        );

        expect(notEnoughBalanceResponse.errors).toEqual(
          expect.objectContaining({
            gasPrice: new NotEnoughGas(),
          })
        );
        expect(enoughhBalanceResponse.errors).not.toEqual(
          expect.objectContaining({
            gasPrice: new NotEnoughGas(),
          })
        );
      });

      it("should not detect gas being too high in a 1559 tx when there is no recipient and have an error", async () => {
        const notEnoughBalanceResponse = await getTransactionStatus(
          { ...account, balance: new BigNumber(2099999) },
          { ...eip1559Tx, recipient: "" }
        );
        const enoughhBalanceResponse = await getTransactionStatus(
          { ...account, balance: new BigNumber(2100000) },
          { ...eip1559Tx, recipient: "" }
        );

        expect(notEnoughBalanceResponse.errors).not.toEqual(
          expect.objectContaining({
            gasPrice: new NotEnoughGas(),
          })
        );
        expect(enoughhBalanceResponse.errors).not.toEqual(
          expect.objectContaining({
            gasPrice: new NotEnoughGas(),
          })
        );
      });

      it("should not detect gas being too high in a legacy tx when there is no recipient and have an error", async () => {
        const notEnoughBalanceResponse = await getTransactionStatus(
          { ...account, balance: new BigNumber(2099999) },
          { ...legacyTx, recipient: "" }
        );
        const enoughhBalanceResponse = await getTransactionStatus(
          { ...account, balance: new BigNumber(2100001) },
          { ...legacyTx, recipient: "" }
        );

        expect(notEnoughBalanceResponse.errors).not.toEqual(
          expect.objectContaining({
            gasPrice: new NotEnoughGas(),
          })
        );
        expect(enoughhBalanceResponse.errors).not.toEqual(
          expect.objectContaining({
            gasPrice: new NotEnoughGas(),
          })
        );
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
          })
        );
      });

      it("should return a 1559 transaction that will use 100% of an account balance", async () => {
        const res = await getTransactionStatus(
          { ...account, balance: new BigNumber(10000000) },
          {
            ...eip1559Tx,
            useAllAmount: true,
          }
        );
        const estimatedFees = new BigNumber(2100000);

        expect(res).toEqual(
          expect.objectContaining({
            errors: expect.any(Object),
            warnings: expect.any(Object),
            estimatedFees,
            amount: new BigNumber(10000000).minus(estimatedFees),
            totalSpent: new BigNumber(10000000),
          })
        );
      });

      it("should return an legacy transaction that will use 100% of an account balance", async () => {
        const res = await getTransactionStatus(
          { ...account, balance: new BigNumber(10000000) },
          {
            ...legacyTx,
            useAllAmount: true,
          }
        );

        expect(res).toEqual(
          expect.objectContaining({
            errors: expect.any(Object),
            warnings: expect.any(Object),
            estimatedFees: new BigNumber(2100000),
            amount: new BigNumber(10000000).minus(2100000),
            totalSpent: new BigNumber(10000000),
          })
        );
      });
    });
  });
});
