// TODO: update path by moving mockHelpers to coin-framework

import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import { getSerializedAddressParameters } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { PolkadotAccountBridge } from "@ledgerhq/coin-polkadot/bridge/index";
import { hydrate } from "@ledgerhq/coin-polkadot/preload";
import { assignFromAccountRaw, assignToAccountRaw } from "@ledgerhq/coin-polkadot/serialization";
import type { PolkadotAccount, Transaction } from "@ledgerhq/coin-polkadot/types/index";
import { FeeTooHigh, InvalidAddress, NotEnoughBalance, RecipientRequired } from "@ledgerhq/errors";
import type { CurrencyBridge } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import {
  broadcast,
  isInvalidRecipient,
  makeAccountBridgeReceive,
  scanAccounts,
  signOperation,
  sync,
} from "../../../bridge/mockHelpers";

const receive = makeAccountBridgeReceive();

const defaultGetFees = (a: PolkadotAccount, t: Transaction) => t.fees || new BigNumber(0);

const createTransaction = (): Transaction => ({
  amount: new BigNumber(0),
  useAllAmount: false,
  family: "polkadot",
  mode: "send",
  recipient: "",
  validators: [],
  fees: undefined,
  era: undefined,
  rewardDestination: undefined,
  numSlashingSpans: undefined,
});

const updateTransaction = (t: Transaction, patch: Partial<Transaction>) => ({ ...t, ...patch });

const estimateMaxSpendable = ({ account, parentAccount, transaction }) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const estimatedFees = transaction
    ? defaultGetFees(mainAccount, transaction)
    : new BigNumber(5000);
  return Promise.resolve(BigNumber.max(0, account.balance.minus(estimatedFees)));
};

const getTransactionStatus = (account: PolkadotAccount, t: Transaction) => {
  const errors: any = {};
  const warnings: any = {};
  const useAllAmount = !!t.useAllAmount;
  const estimatedFees = defaultGetFees(account, t);
  const totalSpent = useAllAmount ? account.balance : new BigNumber(t.amount).plus(estimatedFees);
  const amount = useAllAmount ? account.balance.minus(estimatedFees) : new BigNumber(t.amount);

  if (amount.gt(0) && estimatedFees.times(10).gt(amount)) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  // Fill up transaction errors...
  if (totalSpent.gt(account.balance)) {
    errors.amount = new NotEnoughBalance();
  }

  // Fill up recipient errors...
  if (!t.recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (isInvalidRecipient(t.recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  });
};

const prepareTransaction = async (a, t) => {
  if (!t.fees) {
    return { ...t, fees: new BigNumber(500) };
  }

  return t;
};

const accountBridge: PolkadotAccountBridge = {
  estimateMaxSpendable,
  createTransaction,
  updateTransaction,
  getTransactionStatus,
  prepareTransaction,
  sync: sync as unknown as PolkadotAccountBridge["sync"],
  receive,
  assignToAccountRaw,
  assignFromAccountRaw,
  signOperation,
  broadcast,
  getSerializedAddressParameters,
};

const preload = () => {
  return Promise.resolve({
    validators: [
      {
        address: "111B8CxcmnWbuDLyGvgUmRezDCK1brRZmvUuQ6SrFdMyc3S",
        identity: "",
        nominatorsCount: 84,
        rewardPoints: "28220",
        commission: "1",
        totalBonded: "19189935927996803",
        selfBonded: "0",
        isElected: true,
        isOversubscribed: false,
      },
      {
        address: "114SUbKCXjmb9czpWTtS3JANSmNRwVa4mmsMrWYpRG1kDH5",
        identity: "BINANCE_STAKE_9",
        nominatorsCount: 58,
        rewardPoints: "45700",
        commission: "1",
        totalBonded: "19978546965782204",
        selfBonded: "0",
        isElected: true,
        isOversubscribed: false,
      },
      {
        address: "11VR4pF6c7kfBhfmuwwjWY3FodeYBKWx7ix2rsRCU2q6hqJ",
        identity: "🐑 HODL.FARM 🐑 - C",
        nominatorsCount: 498,
        rewardPoints: "35440",
        commission: "0.008",
        totalBonded: "19983183606433211",
        selfBonded: "8214924206368",
        isElected: true,
        isOversubscribed: false,
      },
      {
        address: "11uMPbeaEDJhUxzU4ZfWW9VQEsryP9XqFcNRfPdYda6aFWJ",
        identity: "P2P.ORG - 4",
        nominatorsCount: 406,
        rewardPoints: "83240",
        commission: "0.025",
        totalBonded: "19983278498651499",
        selfBonded: "0",
        isElected: true,
        isOversubscribed: false,
      },
      {
        address: "13mK8AssyPekT5cFuYQ7ijKNXcjHPq8Gnx6TxF5eFCAwoLQ",
        identity: "HYPERSPHERE - 5",
        nominatorsCount: 457,
        rewardPoints: "83100",
        commission: "0.03",
        totalBonded: "19983182481092181",
        selfBonded: "11099882066510",
        isElected: true,
        isOversubscribed: false,
      },
      {
        address: "14QRY2UTErfZCqVMFVRmgbeUt7XQdeCVgNUV1XqDcza4g9E",
        identity: "",
        nominatorsCount: 1,
        rewardPoints: "64600",
        commission: "1",
        totalBonded: "20294901840238041",
        selfBonded: "0",
        isElected: true,
        isOversubscribed: false,
      },
      {
        address: "17bR6rzVsVrzVJS1hM4dSJU43z2MUmz7ZDpPLh8y2fqVg7m",
        identity: "",
        nominatorsCount: 3,
        rewardPoints: "60160",
        commission: "1",
        totalBonded: "25412727149722391",
        selfBonded: "15697837257290",
        isElected: true,
        isOversubscribed: false,
      },
      {
        address: "19K3AKAkcrVWcXrXCXJ1fbaySuo58kUXhpsh7gBpa6emdgz",
        identity: "",
        nominatorsCount: 21,
        rewardPoints: "36960",
        commission: "1",
        totalBonded: "17669588437879800",
        selfBonded: "0",
        isElected: true,
        isOversubscribed: false,
      },
    ],
    staking: {
      activeEra: 1123,
      electionClosed: true,
      maxNominatorRewardedPerValidator: 512,
      bondingDuration: 28,
    },
    minimumBondBalance: "2500000000000",
  });
};

const currencyBridge: CurrencyBridge = {
  scanAccounts,
  preload,
  hydrate,
};

export default {
  currencyBridge,
  accountBridge,
};
