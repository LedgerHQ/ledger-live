import expect from "expect";
import invariant from "invariant";
import type { AlgorandAccount, AlgorandTransaction } from "./types";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { isAccountEmpty } from "../../account";
import { botTest, genericTestDestination, pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import { BigNumber } from "bignumber.js";
import sample from "lodash/sample";
import { listTokensForCryptoCurrency } from "../../currencies";
import { extractTokenId } from "./tokens";
import { DeviceModelId } from "@ledgerhq/devices";
import { Account } from "@ledgerhq/types-live";
import { acceptTransaction } from "./speculos-deviceActions";

const currency = getCryptoCurrencyById("algorand");
// Minimum balance required for a new non-ASA account
const minBalanceNewAccount = parseCurrencyUnit(currency.units[0], "0.1");

// Ensure that, when the recipient corresponds to an empty account,
// the amount to send is greater or equal to the required minimum
// balance for such a recipient
const checkSendableToEmptyAccount = (amount, recipient) => {
  if (isAccountEmpty(recipient) && amount.lte(minBalanceNewAccount)) {
    invariant(
      amount.gt(minBalanceNewAccount),
      "not enough funds to send to new account"
    );
  }
};

// Get list of ASAs associated with the account
const getAssetsWithBalance = (account) => {
  return account.subAccounts
    ? account.subAccounts.filter(
        (a) => a.type === "TokenAccount" && a.balance.gt(0)
      )
    : [];
};

const pickSiblingsOptedIn = (siblings: Account[], assetId: string) => {
  return sample(
    siblings.filter((a) => {
      return a.subAccounts?.some(
        (sa) => sa.type === "TokenAccount" && sa.token.id.endsWith(assetId)
      );
    })
  );
};

// TODO: rework to perform _difference_ between
// array of valid ASAs and array of ASAs currently
// being opted-in by an account
const getRandomAssetId = (account) => {
  const optedInASA = account.subAccounts?.reduce((old, current) => {
    if (current.type === "TokenAccount") {
      return [...old, current.token.id];
    }

    return old;
  }, []);
  const ASAs = listTokensForCryptoCurrency(account.currency).map(
    (asa) => asa.id
  );
  const diff = ASAs?.filter((asa) => !optedInASA?.includes(asa));
  invariant(diff && diff.length > 0, "already got all optin");
  return sample(diff);
};

const algorand: AppSpec<AlgorandTransaction> = {
  name: "Algorand",
  currency,
  appQuery: {
    model: DeviceModelId.nanoSP,
    appName: "Algorand",
  },
  genericDeviceAction: acceptTransaction,
  mutations: [
    {
      name: "move ~50%",
      maxRun: 2,
      testDestination: genericTestDestination,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(0), "Spendable balance is too low");
        const sibling = pickSiblings(siblings, 4);
        const recipient = sibling.freshAddress;
        const transaction = bridge.createTransaction(account);
        const amount = maxSpendable
          .div(1.9 + 0.2 * Math.random())
          .integerValue();
        checkSendableToEmptyAccount(amount, sibling);
        const updates = [
          {
            amount,
          },
          {
            recipient,
          },
        ];
        return {
          transaction,
          updates,
        };
      },
      test: ({ account, accountBeforeTransaction, operation }) => {
        const rewards =
          (accountBeforeTransaction as AlgorandAccount).algorandResources
            ?.rewards || 0;
        botTest("account balance moved with the operation value", () =>
          expect(account.balance.plus(rewards).toString()).toBe(
            accountBeforeTransaction.balance.minus(operation.value).toString()
          )
        );
      },
    },
    {
      name: "send max",
      maxRun: 1,
      testDestination: genericTestDestination,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(0), "Spendable balance is too low");
        const sibling = pickSiblings(siblings, 4);
        // Send the full spendable balance
        const amount = maxSpendable;
        checkSendableToEmptyAccount(amount, sibling);
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient: sibling.freshAddress,
            },
            {
              useAllAmount: true,
            },
          ],
        };
      },
      test: ({ account }) => {
        // Ensure that there is no more than 20 μALGOs (discretionary value)
        // between the actual balance and the expected one to take into account
        // the eventual pending rewards added _after_ the transaction
        botTest("account spendable balance is very low", () =>
          expect(account.spendableBalance.lt(20)).toBe(true)
        );
      },
    },
    {
      name: "send ASA ~50%",
      maxRun: 2,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(0), "Spendable balance is too low");
        const subAccount = sample(getAssetsWithBalance(account));
        invariant(
          subAccount && subAccount.type === "TokenAccount",
          "no subAccount with ASA"
        );
        const assetId = subAccount.token.id;
        const sibling = pickSiblingsOptedIn(siblings, assetId);
        const transaction = bridge.createTransaction(account);
        const recipient = (sibling as Account).freshAddress;
        const mode = "send";
        const amount = subAccount.balance
          .div(1.9 + 0.2 * Math.random())
          .integerValue();
        const updates: Array<Partial<AlgorandTransaction>> = [
          {
            mode,
            subAccountId: subAccount.id,
          },
          {
            recipient,
          },
          {
            amount,
          },
        ];
        return {
          transaction,
          updates,
        };
      },
      test: ({ account, accountBeforeTransaction, transaction, status }) => {
        const subAccountId = transaction.subAccountId;
        const subAccount = account.subAccounts?.find(
          (sa) => sa.id === subAccountId
        );
        const subAccountBeforeTransaction =
          accountBeforeTransaction.subAccounts?.find(
            (sa) => sa.id === subAccountId
          );
        botTest("subAccount balance moved with the tx status amount", () =>
          expect(subAccount?.balance.toString()).toBe(
            subAccountBeforeTransaction?.balance.minus(status.amount).toString()
          )
        );
      },
    },
    {
      name: "opt-In ASA available",
      maxRun: 1,
      transaction: ({ account, bridge, maxSpendable }) => {
        // maxSpendable is expected to be greater than 100,000 micro-Algos
        // corresponding to the requirement that the main account will have
        // one more ASA after the opt-in; its minimum balance is updated accordingly
        invariant(
          maxSpendable.gt(new BigNumber(100000)),
          "Spendable balance is too low"
        );
        const transaction = bridge.createTransaction(account);
        const mode = "optIn";
        const assetId = getRandomAssetId(account);
        const subAccount = account.subAccounts
          ? account.subAccounts.find((a) => a.id.includes(assetId as string))
          : null;
        invariant(!subAccount, "already opt-in");
        const updates: Array<Partial<AlgorandTransaction>> = [
          {
            mode,
          },
          {
            assetId,
          },
        ];
        return {
          transaction,
          updates,
        };
      },
      // eslint-disable-next-line no-unused-vars
      test: ({ account, transaction }) => {
        invariant(transaction.assetId, "should have an assetId");
        const assetId = extractTokenId(transaction.assetId as string);
        botTest("have sub account with asset id", () =>
          expect(
            account.subAccounts &&
              account.subAccounts.some((a) => a.id.endsWith(assetId))
          ).toBe(true)
        );
      },
    },
    {
      name: "claim rewards",
      maxRun: 1,
      transaction: ({ account, bridge, maxSpendable }) => {
        const rewards = (account as AlgorandAccount).algorandResources?.rewards;
        invariant(rewards && rewards.gt(0), "No pending rewards");
        // Ensure that the rewards can effectively be claimed
        // (fees have to be paid in order to claim the rewards)
        invariant(maxSpendable.gt(0), "Spendable balance is too low");
        const transaction = bridge.createTransaction(account);
        const mode = "claimReward";
        const updates: Array<Partial<AlgorandTransaction>> = [
          {
            mode,
          },
        ];
        return {
          transaction,
          updates,
        };
      },
      test: ({ account }) => {
        botTest("algoResources rewards is zero", () =>
          expect(
            (account as AlgorandAccount).algorandResources &&
              (account as AlgorandAccount).algorandResources.rewards.eq(0)
          ).toBe(true)
        );
      },
    },
  ],
};
export default {
  algorand,
};
