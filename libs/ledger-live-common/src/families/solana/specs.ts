import invariant from "invariant";
import expect from "expect";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { DeviceModelId } from "@ledgerhq/devices";
import {
  botTest,
  expectSiblingsHaveSpendablePartGreaterThan,
  genericTestDestination,
  pickSiblings,
} from "../../bot/specs";
import { AppSpec, TransactionTestInput } from "../../bot/types";
import { SolanaAccount, Transaction } from "./types";
import {
  acceptStakeCreateAccountTransaction,
  acceptStakeDelegateTransaction,
  acceptStakeUndelegateTransaction,
  acceptStakeWithdrawTransaction,
  acceptTransferTransaction,
} from "./speculos-deviceActions";
import { assertUnreachable } from "./utils";
import { getCurrentSolanaPreloadData } from "./js-preload-data";
import { sample } from "lodash/fp";
import BigNumber from "bignumber.js";

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
      maxRun: 2,
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
        const { account } = input;
        botTest("account balance should be zero", () =>
          expect(account.spendableBalance.toNumber()).toBe(0),
        );
        expectCorrectBalanceChange(input);
        expectCorrectMemo(input);
      },
    },
    {
      name: "Delegate",
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
      botTest("memo matches in op extra", () => expect(operation.extra.memo).toBe(memo));
      break;
    }
    case "token.createATA":
    case "stake.createAccount":
    case "stake.delegate":
    case "stake.undelegate":
    case "stake.withdraw":
    case "stake.split":
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

export default {
  solana,
};
