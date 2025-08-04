import expect from "expect";
import invariant from "invariant";
import { getCryptoCurrencyById, listTokensForCryptoCurrency } from "@ledgerhq/cryptoassets";
import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import { DeviceModelId } from "@ledgerhq/devices";
import type {
  AppSpec,
  TransactionTestInput,
  TransactionArg,
  TransactionRes,
} from "@ledgerhq/coin-framework/bot/types";
import { botTest, genericTestDestination, pickSiblings } from "@ledgerhq/coin-framework/bot/specs";
import { isAccountEmpty } from "@ledgerhq/coin-framework/account";
import BigNumber from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { HederaAccount, Transaction } from "../types";
import { HEDERA_TRANSACTION_KINDS } from "../constants";
import { isTokenAssociateTransaction } from "../logic";
import {
  acceptTokenAssociateTransaction,
  acceptTokenTransaction,
  acceptTransferTransaction,
} from "./speculos-deviceActions";

const currency = getCryptoCurrencyById("hedera");
const memoTestMessage = "This is a test memo.";
const maxAccounts = 4;

// Ensure that, when the recipient corresponds to an empty account,
// the amount to send is greater or equal to the required minimum
// balance for such a recipient
const checkSendableToEmptyAccount = (amount: BigNumber, recipient: AccountLike) => {
  const minBalanceNewAccount = parseCurrencyUnit(currency.units[0], "0.1");
  if (isAccountEmpty(recipient) && amount.lte(minBalanceNewAccount)) {
    invariant(amount.gt(minBalanceNewAccount), "not enough funds to send to new account");
  }
};

const findTokenAccountWithBalance = (account: Account) => {
  return account.subAccounts?.find(acc => acc.balance.gt(0));
};

const findSiblingWithTokenAssociated = (siblings: Account[], token: TokenCurrency) => {
  return siblings.find(sibling => sibling.subAccounts?.some(sub => sub.token.id === token.id));
};

// NOTE: because we can't create Hedera accounts in Ledger Live,
// the bot will only use the 3 existing accounts that have been setup
const hedera: AppSpec<Transaction> = {
  name: "Hedera",
  appQuery: {
    model: DeviceModelId.nanoSP,
    appName: "Hedera",
  },
  genericDeviceAction: acceptTransferTransaction,
  currency,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(0), "Balance is too low");
  },
  allowEmptyAccounts: true,
  mutations: [
    {
      name: "Send ~50%",
      feature: "send",
      maxRun: 1,
      testDestination: genericTestDestination,
      transaction: ({
        account,
        siblings,
        bridge,
      }: TransactionArg<Transaction>): TransactionRes<Transaction> => {
        const sibling = pickSiblings(siblings, maxAccounts);
        const recipient = sibling.freshAddress;
        const transaction = bridge.createTransaction(account);

        const amount = account.balance.div(1.9 + 0.2 * Math.random()).integerValue();

        checkSendableToEmptyAccount(amount, sibling);

        return {
          transaction,
          updates: [{ amount }, { recipient }],
        };
      },
      test: ({
        account,
        accountBeforeTransaction,
        operation,
      }: TransactionTestInput<Transaction>): void => {
        botTest("account balance moved with operation value", () =>
          expect(account.balance.toString()).toBe(
            accountBeforeTransaction.balance.minus(operation.value).toString(),
          ),
        );
      },
    },
    {
      name: "Send max",
      feature: "sendMax",
      maxRun: 1,
      testDestination: genericTestDestination,
      transaction: ({
        account,
        siblings,
        bridge,
      }: TransactionArg<Transaction>): TransactionRes<Transaction> => {
        const sibling = pickSiblings(siblings, maxAccounts);
        const recipient = sibling.freshAddress;
        const transaction = bridge.createTransaction(account);

        return {
          transaction,
          updates: [{ recipient }, { useAllAmount: true }],
        };
      },
      test: ({ account, accountBeforeTransaction, operation }) => {
        botTest("Account balance should have decreased", () => {
          expect(account.balance.toNumber()).toEqual(
            accountBeforeTransaction.balance.minus(operation.value).toNumber(),
          );
        });
      },
    },
    {
      name: "Memo",
      feature: "send",
      maxRun: 1,
      transaction: ({
        account,
        siblings,
        bridge,
      }: TransactionArg<Transaction>): TransactionRes<Transaction> => {
        const sibling = pickSiblings(siblings, maxAccounts);
        const recipient = sibling.freshAddress;
        const transaction = bridge.createTransaction(account);
        const amount = account.balance.div(1.9 + 0.2 * Math.random()).integerValue();

        checkSendableToEmptyAccount(amount, sibling);

        return {
          transaction,
          updates: [{ recipient }, { amount }, { memo: memoTestMessage }],
        };
      },
      test: ({ transaction }: TransactionTestInput<Transaction>): void => {
        botTest("transaction.memo is set", () => expect(transaction.memo).toBe(memoTestMessage));
      },
    },
    {
      name: "Send ~50% of token amount",
      feature: "tokens",
      maxRun: 1,
      deviceAction: acceptTokenTransaction,
      transaction: ({
        account,
        bridge,
        siblings,
      }: TransactionArg<Transaction>): TransactionRes<Transaction> => {
        const senderTokenAccount = findTokenAccountWithBalance(account);
        invariant(senderTokenAccount, "Sender token account with available balance not found");
        const selectedToken = senderTokenAccount.token;

        const sibling = findSiblingWithTokenAssociated(siblings, selectedToken);
        invariant(sibling, `No sibling with ${selectedToken.ticker} associated found`);

        const recipientTokenAccount = sibling.subAccounts?.find(
          sub => sub.token.id === selectedToken.id,
        );
        invariant(recipientTokenAccount, "Receiver token account with available balance not found");

        const amount = senderTokenAccount.balance.div(1.9 + 0.2 * Math.random()).integerValue();
        const recipient = sibling.freshAddress;
        const transaction = bridge.createTransaction(account);
        const subAccountId = senderTokenAccount.id;

        return {
          transaction,
          updates: [{ subAccountId }, { recipient }, { amount }],
        };
      },
      test: ({
        transaction,
        status,
        account,
        accountBeforeTransaction,
      }: TransactionTestInput<Transaction>): void => {
        const tokenAccountId = transaction.subAccountId;
        invariant(tokenAccountId, "Transaction subAccountId is not set");
        const tokenAccountAfterTx = account.subAccounts?.find(acc => acc.id === tokenAccountId);
        const tokenAccountBeforeTx = accountBeforeTransaction.subAccounts?.find(
          acc => acc.id === tokenAccountId,
        );
        invariant(tokenAccountAfterTx, "Token sub account after transaction not found");
        invariant(tokenAccountBeforeTx, "Token sub account before transaction not found");

        botTest("Token balance decreased with operation", () =>
          expect(tokenAccountAfterTx.balance.toString()).toBe(
            tokenAccountBeforeTx.balance.minus(status.amount).toString(),
          ),
        );
      },
    },
    {
      name: "Associate token",
      feature: "tokens",
      maxRun: 1,
      deviceAction: acceptTokenAssociateTransaction,
      transaction: ({
        account,
        bridge,
      }: TransactionArg<Transaction>): TransactionRes<Transaction> => {
        const { isAutoTokenAssociationEnabled } = (account as HederaAccount).hederaResources ?? {};
        invariant(!isAutoTokenAssociationEnabled, "Auto token association is enabled");

        // find first token from CAL that isn't already associated with account
        const allHederaTokens = listTokensForCryptoCurrency(currency);
        const accountTokenIds = new Set((account.subAccounts ?? []).map(sub => sub.token.id));
        const unassociatedToken = allHederaTokens.find(token => !accountTokenIds.has(token.id));
        invariant(unassociatedToken, "No unassociated tokens found for this account");

        const transaction = bridge.createTransaction(account);

        return {
          transaction,
          updates: [
            {
              properties: {
                name: HEDERA_TRANSACTION_KINDS.TokenAssociate.name,
                token: unassociatedToken,
              },
            },
          ],
        };
      },
      test: ({ operation, account, accountBeforeTransaction, transaction }) => {
        invariant(isTokenAssociateTransaction(transaction), "invalid tx type");

        const tokenId = transaction.properties.token.id;
        const hasTokenBeforeTx = accountBeforeTransaction.subAccounts?.some(
          sub => sub.token?.id === tokenId,
        );
        const hasTokenAfterTx = account.subAccounts?.some(sub => sub.token?.id === tokenId);

        botTest("Operation type is ASSOCIATE_TOKEN", () =>
          expect(operation.type).toBe("ASSOCIATE_TOKEN"),
        );

        botTest("Token was not associated before transaction", () => {
          expect(hasTokenBeforeTx).toBe(false);
        });

        botTest("Token is associated after transaction", () => {
          expect(hasTokenAfterTx).toBe(true);
        });

        botTest("Account balance decreased by fee amount", () =>
          expect(account.balance.plus(operation.fee).toString()).toBe(
            accountBeforeTransaction.balance.toString(),
          ),
        );
      },
    },
  ],
};

export default { hedera };
