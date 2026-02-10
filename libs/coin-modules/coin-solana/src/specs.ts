import {
  botTest,
  expectSiblingsHaveSpendablePartGreaterThan,
  genericTestDestination,
  pickSiblings,
} from "@ledgerhq/coin-framework/bot/specs";
import { AppSpec, TransactionTestInput } from "@ledgerhq/coin-framework/bot/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { DeviceModelId } from "@ledgerhq/devices";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import expect from "expect";
import invariant from "invariant";
import { sample } from "lodash/fp";
import { SolanaRecipientAssociatedTokenAccountWillBeFunded } from "./errors";
import { getCurrentSolanaPreloadData } from "./preload-data";
import {
  acceptStakeCreateAccountTransaction,
  acceptStakeDelegateTransaction,
  acceptStakeUndelegateTransaction,
  acceptStakeWithdrawTransaction,
  acceptTransferTokensTransaction,
  acceptTransferTokensWithATACreationTransaction,
  acceptTransferTransaction,
} from "./speculos-deviceActions";
import {
  SolanaAccount,
  SolanaOperation,
  SolanaTokenAccount,
  SolanaTokenAccountExtensions,
  Transaction,
} from "./types";
import { SYSTEM_ACCOUNT_RENT_EXEMPT, assertUnreachable } from "./utils";

const maxAccount = 9;

const solana: AppSpec<Transaction> = {
  name: "Solana",
  scanAccountsRetries: 3,
  appQuery: {
    model: DeviceModelId.nanoS,
    firmware: "2",
    appVersion: "1.2.0",
    appName: "solana",
  },
  genericDeviceAction: acceptTransferTransaction,
  testTimeout: 2 * 60 * 1000,
  currency: getCryptoCurrencyById("solana"),
  mutations: [
    {
      name: "Transfer ~50%",
      feature: "send",
      maxRun: 1,
      testDestination: genericTestDestination,
      deviceAction: acceptTransferTransaction,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(0), "balance is 0");
        const transaction = bridge.createTransaction(account);
        const sibling = pickSiblings(siblings, maxAccount);
        const recipient = sibling.freshAddress;
        const amount = account.spendableBalance.div(1.9 + 0.2 * Math.random()).integerValue();
        return {
          transaction,
          updates: [{ recipient }, { amount }, maybeTransferMemo()],
        };
      },
      test: input => {
        expectCorrectBalanceChange(input);
        expectCorrectMemo(input);
      },
    },
    {
      name: "Transfer Max",
      feature: "sendMax",
      maxRun: 1,
      deviceAction: acceptTransferTransaction,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(0), "balance is 0");
        const transaction = bridge.createTransaction(account);
        const sibling = pickSiblings(siblings, maxAccount);
        const recipient = sibling.freshAddress;
        return {
          transaction,
          updates: [{ recipient }, { useAllAmount: true }, maybeTransferMemo()],
        };
      },
      test: input => {
        const { accountBeforeTransaction, account, operation } = input;
        const estimatedMaxSpendable = BigNumber.max(
          accountBeforeTransaction.spendableBalance.minus(SYSTEM_ACCOUNT_RENT_EXEMPT),
          0,
        ).toNumber();

        botTest("operation value should be estimated max spendable", () =>
          expect(operation.value.toNumber()).toBe(estimatedMaxSpendable),
        );
        botTest("account spendableBalance should be zero", () =>
          expect(account.spendableBalance.toNumber()).toBe(0),
        );
        expectCorrectBalanceChange(input);
        expectCorrectMemo(input);
      },
    },
    {
      name: "Delegate",
      feature: "staking",
      maxRun: 1,
      deviceAction: acceptStakeCreateAccountTransaction,
      transaction: ({ account, bridge, siblings }) => {
        expectSiblingsHaveSpendablePartGreaterThan(siblings, 0.5);

        const { solanaResources } = account as SolanaAccount;
        if (solanaResources === undefined) {
          throw new Error("solana resources required");
        }
        invariant(solanaResources.stakes.length < 10, "already enough delegations");

        invariant(account.spendableBalance.gte(3000000), "not enough balance");

        const { validators } = getCurrentSolanaPreloadData(account.currency);

        const notUsedValidators = validators.filter(v =>
          solanaResources.stakes.every(s => s.delegation?.voteAccAddr !== v.voteAccount),
        );

        const validator = sample(notUsedValidators);

        if (validator === undefined) {
          throw new Error("no not used validators found");
        }

        const transaction = bridge.createTransaction(account);

        return {
          transaction,
          updates: [
            {
              model: {
                kind: "stake.createAccount",
                uiState: {
                  delegate: { voteAccAddress: validator.voteAccount },
                },
              },
            },
            {
              amount: new BigNumber(100000),
            },
          ],
        };
      },
      test: ({ account, transaction }) => {
        const { solanaResources } = account as SolanaAccount;

        if (solanaResources === undefined) {
          throw new Error("solana resources required");
        }

        if (transaction.model.kind !== "stake.createAccount") {
          throw new Error("wrong transaction");
        }

        const voteAccAddrUsedInTx = transaction.model.uiState.delegate.voteAccAddress;

        const { stakes } = solanaResources;
        const stake = stakes.find(s => s.delegation?.voteAccAddr === voteAccAddrUsedInTx);
        if (stake === undefined) {
          throw new Error("expected delegation not found in account resources");
        }

        botTest("transaction amount is the stake amount", () =>
          expect(transaction.amount.toNumber()).toBe(stake.delegation?.stake),
        );
      },
    },
    {
      name: "Deactivate Activating Delegation",
      feature: "staking",
      maxRun: 1,
      deviceAction: acceptStakeUndelegateTransaction,
      transaction: ({ account, bridge }) => {
        invariant(account.spendableBalance.gt(0), "not enough balance");
        const { solanaResources } = account as SolanaAccount;

        if (solanaResources === undefined) {
          throw new Error("solana resources required");
        }

        const activatingStakes = solanaResources.stakes.filter(
          s => s.activation.state === "activating",
        );

        const stake = sample(activatingStakes);

        if (stake === undefined) {
          throw new Error("no activating stakes found");
        }

        const transaction = bridge.createTransaction(account);

        return {
          transaction,
          updates: [
            {
              model: {
                kind: "stake.undelegate",
                uiState: {
                  stakeAccAddr: stake.stakeAccAddr,
                },
              },
            },
          ],
        };
      },
      test: ({ account, transaction }) => {
        const { solanaResources } = account as SolanaAccount;

        if (solanaResources === undefined) {
          throw new Error("solana resources required");
        }

        if (transaction.model.kind !== "stake.undelegate") {
          throw new Error("wrong transaction");
        }

        const stakeAccAddrUsedInTx = transaction.model.uiState.stakeAccAddr;

        const stake = solanaResources.stakes.find(s => s.stakeAccAddr === stakeAccAddrUsedInTx);

        if (stake === undefined) {
          throw new Error("expected stake not found in account resources");
        }

        botTest("activation state", () => expect(stake.activation.state).toBe("inactive"));
      },
    },
    {
      name: "Deactivate Active Delegation",
      feature: "staking",
      maxRun: 1,
      deviceAction: acceptStakeUndelegateTransaction,
      transaction: ({ account, bridge }) => {
        invariant(account.spendableBalance.gt(0), "not enough balance");
        const { solanaResources } = account as SolanaAccount;

        if (solanaResources === undefined) {
          throw new Error("solana resources required");
        }

        const activeStakes = solanaResources.stakes.filter(s => s.activation.state === "active");

        const stake = sample(activeStakes);

        if (stake === undefined) {
          throw new Error("no active stakes found");
        }

        const transaction = bridge.createTransaction(account);

        return {
          transaction,
          updates: [
            {
              model: {
                kind: "stake.undelegate",
                uiState: {
                  stakeAccAddr: stake.stakeAccAddr,
                },
              },
            },
          ],
        };
      },
      test: ({ account, transaction }) => {
        const { solanaResources } = account as SolanaAccount;

        if (solanaResources === undefined) {
          throw new Error("solana resources required");
        }

        if (transaction.model.kind !== "stake.undelegate") {
          throw new Error("wrong transaction");
        }

        const stakeAccAddrUsedInTx = transaction.model.uiState.stakeAccAddr;

        const stake = solanaResources.stakes.find(s => s.stakeAccAddr === stakeAccAddrUsedInTx);

        if (stake === undefined) {
          throw new Error("expected stake not found in account resources");
        }
        botTest("activation state", () => expect(stake.activation.state).toBe("deactivating"));
      },
    },
    {
      name: "Reactivate Deactivating Delegation",
      feature: "staking",
      maxRun: 1,
      deviceAction: acceptStakeDelegateTransaction,
      transaction: ({ account, bridge }) => {
        invariant(account.spendableBalance.gt(0), "not enough balance");
        const { solanaResources } = account as SolanaAccount;

        if (solanaResources === undefined) {
          throw new Error("solana resources required");
        }

        const deactivatingStakes = solanaResources.stakes.filter(
          s => s.activation.state === "deactivating",
        );

        const stake = sample(deactivatingStakes);

        if (stake === undefined) {
          throw new Error("no deactivating stakes found");
        }

        if (stake.delegation === undefined) {
          throw new Error("unexpected undefined delegation");
        }

        const transaction = bridge.createTransaction(account);

        return {
          transaction,
          updates: [
            {
              model: {
                kind: "stake.delegate",
                uiState: {
                  stakeAccAddr: stake.stakeAccAddr,
                  voteAccAddr: stake.delegation.voteAccAddr,
                },
              },
            },
          ],
        };
      },
      test: ({ account, transaction }) => {
        const { solanaResources } = account as SolanaAccount;

        if (solanaResources === undefined) {
          throw new Error("solana resources required");
        }

        if (transaction.model.kind !== "stake.delegate") {
          throw new Error("wrong transaction");
        }

        const dataUsedInTx = transaction.model.uiState;

        const stake = solanaResources.stakes.find(
          s =>
            s.stakeAccAddr === dataUsedInTx.stakeAccAddr &&
            s.delegation?.voteAccAddr === dataUsedInTx.voteAccAddr,
        );

        if (stake === undefined) {
          throw new Error("expected stake not found in account resources");
        }

        botTest("activation state", () => expect(stake.activation.state).toBe("active"));
      },
    },
    {
      name: "Activate Inactive Delegation",
      feature: "staking",
      maxRun: 1,
      deviceAction: acceptStakeDelegateTransaction,
      transaction: ({ account, bridge }) => {
        invariant(account.spendableBalance.gt(0), "not enough balance");
        const { solanaResources } = account as SolanaAccount;

        if (solanaResources === undefined) {
          throw new Error("solana resources required");
        }

        const inactiveStakes = solanaResources.stakes.filter(
          s => s.activation.state === "inactive",
        );

        const stake = sample(inactiveStakes);

        if (stake === undefined) {
          throw new Error("no inactive stakes found");
        }

        if (stake.delegation === undefined) {
          throw new Error("unexpected undefined delegation");
        }

        const transaction = bridge.createTransaction(account);

        return {
          transaction,
          updates: [
            {
              model: {
                kind: "stake.delegate",
                uiState: {
                  stakeAccAddr: stake.stakeAccAddr,
                  voteAccAddr: stake.delegation.voteAccAddr,
                },
              },
            },
          ],
        };
      },
      test: ({ account, transaction }) => {
        const { solanaResources } = account as SolanaAccount;

        if (solanaResources === undefined) {
          throw new Error("solana resources required");
        }

        if (transaction.model.kind !== "stake.delegate") {
          throw new Error("wrong transaction");
        }

        const dataUsedInTx = transaction.model.uiState;

        const stake = solanaResources.stakes.find(
          s =>
            s.stakeAccAddr === dataUsedInTx.stakeAccAddr &&
            s.delegation?.voteAccAddr === dataUsedInTx.voteAccAddr,
        );

        if (stake === undefined) {
          throw new Error("expected stake not found in account resources");
        }
        botTest("activation state", () => expect(stake.activation.state).toBe("activating"));
      },
    },
    {
      name: "Withdraw Delegation",
      feature: "staking",
      maxRun: 1,
      deviceAction: acceptStakeWithdrawTransaction,
      transaction: ({ account, bridge }) => {
        invariant(account.spendableBalance.gt(0), "not enough balance");
        const { solanaResources } = account as SolanaAccount;

        if (solanaResources === undefined) {
          throw new Error("solana resources required");
        }

        const withdrawableStakes = solanaResources.stakes.filter(s => s.withdrawable > 0);

        const stake = sample(withdrawableStakes);

        if (stake === undefined) {
          throw new Error("no withdrawable stakes found");
        }

        const transaction = bridge.createTransaction(account);

        return {
          transaction,
          updates: [
            {
              model: {
                kind: "stake.withdraw",
                uiState: {
                  stakeAccAddr: stake.stakeAccAddr,
                },
              },
            },
          ],
        };
      },
      test: ({ account, transaction }) => {
        const { solanaResources } = account as SolanaAccount;

        if (solanaResources === undefined) {
          throw new Error("solana resources required");
        }

        if (transaction.model.kind !== "stake.withdraw") {
          throw new Error("wrong transaction");
        }

        const stakeAccAddrUsedInTx = transaction.model.uiState.stakeAccAddr;

        const delegationExists = solanaResources.stakes.some(
          s => s.stakeAccAddr === stakeAccAddrUsedInTx,
        );

        botTest("delegation exists", () => expect(delegationExists).toBe(false));
      },
    },
    {
      name: "Transfer ~50% of spl token with ATA creation",
      maxRun: 1,
      feature: "tokens",
      deviceAction: acceptTransferTokensWithATACreationTransaction,
      transaction: ({ account, bridge, siblings, maxSpendable }) => {
        invariant(maxSpendable.gt(0), "balance is 0");

        const senderTokenAcc = findTokenSubAccountWithBalance(account);
        invariant(senderTokenAcc, "Sender token account with available balance not found");

        const token = senderTokenAcc.token;
        const siblingWithoutToken = siblings.find(acc => !findTokenSubAccount(acc, token.id));
        invariant(siblingWithoutToken, `Recipient without ${token.ticker} ATA not found`);

        const amount = senderTokenAcc.balance.div(1.9 + 0.2 * Math.random()).integerValue();
        const recipient = siblingWithoutToken.freshAddress;
        const transaction = bridge.createTransaction(account);
        const subAccountId = senderTokenAcc.id;

        return {
          transaction,
          updates: [{ subAccountId }, { recipient }, { amount }],
        };
      },
      expectStatusWarnings: _ => {
        return {
          recipient: new SolanaRecipientAssociatedTokenAccountWillBeFunded(),
        };
      },
      test: input => {
        expectTokenAccountCorrectBalanceChange(input);
      },
    },
    {
      name: "Transfer ~50% of spl token to existing ATA",
      maxRun: 1,
      feature: "tokens",
      deviceAction: acceptTransferTokensTransaction,
      transaction: ({ account, bridge, siblings, maxSpendable }) => {
        invariant(maxSpendable.gt(0), "balance is 0");

        const senderTokenAcc = findTokenSubAccountWithBalance(account);
        invariant(senderTokenAcc, "Sender token account with available balance not found");

        const token = senderTokenAcc.token;
        const siblingTokenAccount = siblings.find(acc => findTokenSubAccount(acc, token.id));
        invariant(siblingTokenAccount, `Sibling with ${token.ticker} token ATA not found`);

        const amount = senderTokenAcc.balance.div(1.9 + 0.2 * Math.random()).integerValue();
        const recipient = siblingTokenAccount.freshAddress;
        const transaction = bridge.createTransaction(account);
        const subAccountId = senderTokenAcc.id;
        return {
          transaction,
          updates: [{ subAccountId }, { recipient }, { amount }],
        };
      },
      test: input => {
        expectTokenAccountCorrectBalanceChange(input);
      },
    },
    {
      name: "Transfer ~50% of token2022 with transfer fee extension + ATA creation",
      maxRun: 1,
      deviceAction: acceptTransferTokensWithATACreationTransaction,
      transaction: ({ account, bridge, siblings, maxSpendable }) => {
        invariant(maxSpendable.gt(0), "balance is 0");

        const senderTokenAcc = findTokenAccountWithExtensionAndBalance(
          account as SolanaAccount,
          "transferFee",
        );
        invariant(
          senderTokenAcc,
          "Sender token2022 account with transfer fee extension and available balance not found",
        );

        const token = senderTokenAcc.token;
        const siblingWithoutToken = siblings.find(
          acc => !findTokenSubAccount(acc as SolanaAccount, token.id),
        );
        invariant(siblingWithoutToken, `Recipient without ${token.ticker} ATA not found`);

        const amount = senderTokenAcc.balance.div(1.9 + 0.2 * Math.random()).integerValue();
        const recipient = siblingWithoutToken.freshAddress;
        const transaction = bridge.createTransaction(account);
        const subAccountId = senderTokenAcc.id;

        return {
          transaction,
          updates: [{ subAccountId }, { recipient }, { amount }],
        };
      },
      expectStatusWarnings: _ => {
        return {
          recipient: new SolanaRecipientAssociatedTokenAccountWillBeFunded(),
        };
      },
      test: expectSourceBalanceChangeWithTxFee,
    },
    {
      name: "Transfer ~50% of token2022 with transfer fee extension to existing ATA",
      maxRun: 1,
      deviceAction: acceptTransferTokensTransaction,
      transaction: ({ account, bridge, siblings, maxSpendable }) => {
        invariant(maxSpendable.gt(0), "balance is 0");

        const senderTokenAcc = findTokenAccountWithExtensionAndBalance(
          account as SolanaAccount,
          "transferFee",
        );
        invariant(
          senderTokenAcc,
          "Sender token2022 account with transfer fee extension and available balance not found",
        );

        const token = senderTokenAcc.token;
        const siblingTokenAccount = siblings.find(acc =>
          findTokenSubAccount(acc as SolanaAccount, token.id),
        );
        invariant(siblingTokenAccount, `Recipient without ${token.ticker} ATA not found`);

        const amount = senderTokenAcc.balance.div(1.9 + 0.2 * Math.random()).integerValue();
        const recipient = siblingTokenAccount.freshAddress;
        const transaction = bridge.createTransaction(account);
        const subAccountId = senderTokenAcc.id;

        return {
          transaction,
          updates: [{ subAccountId }, { recipient }, { amount }],
        };
      },
      test: expectSourceBalanceChangeWithTxFee,
    },
    {
      name: "Transfer ~50% of token2022 with transfer fee extension + ATA creation",
      maxRun: 1,
      deviceAction: acceptTransferTokensWithATACreationTransaction,
      transaction: ({ account, bridge, siblings, maxSpendable }) => {
        invariant(maxSpendable.gt(0), "balance is 0");

        const senderTokenAcc = findTokenAccountWithExtensionAndBalance(
          account as SolanaAccount,
          "transferFee",
        );
        invariant(
          senderTokenAcc,
          "Sender token2022 account with transfer fee extension and available balance not found",
        );

        const token = senderTokenAcc.token;
        const siblingWithoutToken = siblings.find(
          acc => !findTokenSubAccount(acc as SolanaAccount, token.id),
        );
        invariant(siblingWithoutToken, `Recipient without ${token.ticker} ATA not found`);

        const amount = senderTokenAcc.balance.div(1.9 + 0.2 * Math.random()).integerValue();
        const recipient = siblingWithoutToken.freshAddress;
        const transaction = bridge.createTransaction(account);
        const subAccountId = senderTokenAcc.id;

        return {
          transaction,
          updates: [{ subAccountId }, { recipient }, { amount }],
        };
      },
      expectStatusWarnings: _ => {
        return {
          recipient: new SolanaRecipientAssociatedTokenAccountWillBeFunded(),
        };
      },
      test: expectSourceBalanceChangeWithTxFee,
    },
    {
      name: "Transfer ~50% of token2022 with transfer fee extension to existing ATA",
      maxRun: 1,
      deviceAction: acceptTransferTokensTransaction,
      transaction: ({ account, bridge, siblings, maxSpendable }) => {
        invariant(maxSpendable.gt(0), "balance is 0");

        const senderTokenAcc = findTokenAccountWithExtensionAndBalance(
          account as SolanaAccount,
          "transferFee",
        );
        invariant(
          senderTokenAcc,
          "Sender token2022 account with transfer fee extension and available balance not found",
        );

        const token = senderTokenAcc.token;
        const siblingTokenAccount = siblings.find(acc =>
          findTokenSubAccount(acc as SolanaAccount, token.id),
        );
        invariant(siblingTokenAccount, `Recipient without ${token.ticker} ATA not found`);

        const amount = senderTokenAcc.balance.div(1.9 + 0.2 * Math.random()).integerValue();
        const recipient = siblingTokenAccount.freshAddress;
        const transaction = bridge.createTransaction(account);
        const subAccountId = senderTokenAcc.id;

        return {
          transaction,
          updates: [{ subAccountId }, { recipient }, { amount }],
        };
      },
      test: expectSourceBalanceChangeWithTxFee,
    },
  ],
};

function maybeTransferMemo(threshold = 0.5): Partial<Transaction> | undefined {
  return Math.random() > threshold
    ? {
        model: {
          kind: "transfer",
          uiState: {
            memo: "a memo",
          },
        },
      }
    : undefined;
}

function expectCorrectMemo(input: TransactionTestInput<Transaction>) {
  const { transaction, operation } = input;
  switch (transaction.model.kind) {
    case "transfer":
    case "token.transfer": {
      const memo = transaction.model.uiState.memo;
      botTest("memo matches in op extra", () =>
        expect((operation as SolanaOperation).extra.memo).toBe(memo),
      );
      break;
    }
    case "token.createATA":
    case "token.approve":
    case "token.revoke":
    case "stake.createAccount":
    case "stake.delegate":
    case "stake.undelegate":
    case "stake.withdraw":
    case "stake.split":
    case "raw":
      break;
    default:
      return assertUnreachable(transaction.model);
  }
}

function expectCorrectBalanceChange(input: TransactionTestInput<Transaction>) {
  const { account, operation, accountBeforeTransaction } = input;
  botTest("account balance decreased with operation value", () =>
    expect(account.balance.toNumber()).toBe(
      accountBeforeTransaction.balance.minus(operation.value).toNumber(),
    ),
  );
}

function expectTokenAccountCorrectBalanceChange({
  account,
  accountBeforeTransaction,
  status,
  transaction,
}: TransactionTestInput<Transaction>) {
  const tokenAccId = transaction.subAccountId;
  if (!tokenAccId) throw new Error("Wrong transaction!");
  const tokenAccAfterTx = account.subAccounts?.find(acc => acc.id === tokenAccId);
  const tokenAccBeforeTx = accountBeforeTransaction.subAccounts?.find(acc => acc.id === tokenAccId);

  if (!tokenAccAfterTx || !tokenAccBeforeTx) {
    throw new Error("token sub accounts not found!");
  }

  botTest("token balance decreased with operation", () =>
    expect(tokenAccAfterTx.balance.toString()).toBe(
      tokenAccBeforeTx.balance.minus(status.amount).toString(),
    ),
  );
}

function expectSourceBalanceChangeWithTxFee({
  transaction,
  account,
  accountBeforeTransaction,
  status,
}: TransactionTestInput<Transaction>) {
  const txCommand = transaction.model.commandDescriptor?.command;
  if (txCommand?.kind !== "token.transfer") {
    throw new Error("Not a token transfer transaction");
  }

  const transferFeeExt = txCommand.extensions?.transferFee;
  if (!transferFeeExt) {
    throw new Error("Transaction should contain transfer fee extension");
  }

  const tokenAccId = transaction.subAccountId;
  const tokenAccAfterTx = account.subAccounts?.find(acc => acc.id === tokenAccId);
  const tokenAccBeforeTx = accountBeforeTransaction.subAccounts?.find(acc => acc.id === tokenAccId);

  if (!tokenAccAfterTx || !tokenAccBeforeTx) {
    throw new Error("Token sub accounts not found!");
  }

  botTest("source token balance decreased with operation on amount + transfer fee", () =>
    expect(tokenAccAfterTx.balance.toString()).toBe(
      // status and operation amount with transfer fee
      tokenAccBeforeTx.balance.minus(status.totalSpent).toString(),
    ),
  );
}

function findTokenSubAccount(account: Account, tokenId: string) {
  return account.subAccounts?.find(
    acc => acc.type === "TokenAccount" && acc.token.id === tokenId,
  ) as TokenAccount | undefined;
}

function findTokenSubAccountWithBalance(account: Account) {
  return account.subAccounts?.find(acc => acc.type === "TokenAccount" && acc.balance.gt(0)) as
    | TokenAccount
    | undefined;
}

type Extensions = keyof SolanaTokenAccountExtensions;
function findTokenAccountWithExtensionAndBalance(account: SolanaAccount, extension: Extensions) {
  return account.subAccounts?.find(
    acc =>
      acc.type === "TokenAccount" &&
      (acc as SolanaTokenAccount).extensions?.[extension] &&
      acc.balance.gt(0),
  ) as SolanaTokenAccount | undefined;
}

export default {
  solana,
};
