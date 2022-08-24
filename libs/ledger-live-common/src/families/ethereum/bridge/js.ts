import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import {
  NotEnoughGas,
  FeeNotLoaded,
  FeeRequired,
  GasLessThanEstimate,
  PriorityFeeTooLow,
  PriorityFeeOutOfSuggestedRange,
} from "@ledgerhq/errors";
import type { CurrencyBridge, AccountBridge } from "@ledgerhq/types-live";
import {
  makeSync,
  makeScanAccounts,
  makeAccountBridgeReceive,
} from "../../../bridge/jsHelpers";
import { getMainAccount } from "../../../account";
import { patchOperationWithHash } from "../../../operation";
import { getCryptoCurrencyById } from "../../../currencies";
import { apiForCurrency } from "../../../api/Ethereum";
import { getEstimatedFees } from "../../../api/Fees";
import type { Transaction, NetworkInfo } from "../types";
import {
  getGasLimit,
  inferEthereumGasLimitRequest,
  estimateGasLimit,
  EIP1559ShouldBeUsed,
  getLowerBoundForPriorityFee,
} from "../transaction";
import { getAccountShape } from "../synchronisation";
import {
  preload,
  hydrate,
  prepareTransaction as prepareTransactionModules,
} from "../modules";
import { signOperation } from "../signOperation";
import { modes } from "../modules";
import postSyncPatch from "../postSyncPatch";
import { inferDynamicRange } from "../../../range";
import { nftMetadata, collectionMetadata } from "../nftResolvers";

const receive = makeAccountBridgeReceive();

const broadcast = async ({
  account,
  signedOperation: { operation, signature },
}) => {
  const api = apiForCurrency(account.currency);
  const hash = await api.broadcastTransaction(signature);
  return patchOperationWithHash(operation, hash);
};

const scanAccounts = makeScanAccounts({ getAccountShape });
const sync = makeSync({
  getAccountShape,
  postSync: postSyncPatch,
  shouldMergeOps: false,
});

const createTransaction = (): Transaction => ({
  family: "ethereum",
  mode: "send",
  amount: new BigNumber(0),
  recipient: "",
  gasPrice: null,
  maxBaseFeePerGas: null,
  maxPriorityFeePerGas: null,
  userGasLimit: null,
  estimatedGasLimit: null,
  networkInfo: null,
  feeCustomUnit: getCryptoCurrencyById("ethereum").units[1],
  useAllAmount: false,
  feesStrategy: "medium",
});

const updateTransaction = (t, patch) => {
  if ("recipient" in patch && patch.recipient !== t.recipient) {
    return { ...t, ...patch, userGasLimit: null, estimatedGasLimit: null };
  }

  return { ...t, ...patch };
};

const getTransactionStatus = (a, t) => {
  const gasLimit = getGasLimit(t);
  const priorityFeeLowerBound = getLowerBoundForPriorityFee(t);
  let estimatedGasPrice;
  if (EIP1559ShouldBeUsed(a.currency)) {
    estimatedGasPrice = (t.maxBaseFeePerGas || new BigNumber(0)).plus(
      t.maxPriorityFeePerGas
    );
  } else {
    estimatedGasPrice = t.gasPrice;
  }
  const estimatedFees = (estimatedGasPrice || new BigNumber(0)).times(gasLimit);
  const errors: {
    gasPrice?: Error;
    maxBaseFee?: Error;
    maxPriorityFee?: Error;
    gasLimit?: Error;
    recipient?: Error;
  } = {};
  const warnings: {
    gasLimit?: Error;
    maxBaseFee?: Error;
    maxPriorityFee?: Error;
  } = {};
  const result = {
    errors,
    warnings,
    estimatedFees,
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
  };
  const m = modes[t.mode];
  invariant(m, "missing module for mode=" + t.mode);
  m.fillTransactionStatus(a, t, result);

  // generic gas errors and warnings
  if (EIP1559ShouldBeUsed(a.currency)) {
    if (!t.maxBaseFeePerGas) errors.maxBaseFee = new FeeNotLoaded();
    if (!t.maxPriorityFeePerGas) errors.maxPriorityFee = new FeeNotLoaded();
  } else if (!t.gasPrice) {
    errors.gasPrice = new FeeNotLoaded();
  }
  if (gasLimit.eq(0)) {
    errors.gasLimit = new FeeRequired();
  } else if (!errors.recipient) {
    if (estimatedFees.gt(a.balance)) {
      errors.gasPrice = new NotEnoughGas();
    }
  }

  if (t.maxPriorityFeePerGas) {
    if (t.maxPriorityFeePerGas.lt(priorityFeeLowerBound)) {
      errors.maxPriorityFee = new PriorityFeeTooLow();
    } else if (
      t.maxPriorityFeePerGas.lt(t.networkInfo.maxPriorityFeePerGas.min) ||
      t.maxPriorityFeePerGas.gt(t.networkInfo.maxPriorityFeePerGas.max)
    ) {
      const weiToGweiMultiplier = new BigNumber(10e-10);
      warnings.maxPriorityFee = new PriorityFeeOutOfSuggestedRange(undefined, {
        lowPriorityFee: t.networkInfo.maxPriorityFeePerGas.min
          .times(weiToGweiMultiplier)
          .toString(),
        highPriorityFee: t.networkInfo.maxPriorityFeePerGas.max
          .times(weiToGweiMultiplier)
          .toString(),
      });
    }
  }

  if (t.estimatedGasLimit && gasLimit.lt(t.estimatedGasLimit)) {
    warnings.gasLimit = new GasLessThanEstimate();
  }

  return Promise.resolve(result);
};

const getNetworkInfoByOneGasPrice = async (c) => {
  const { gas_price } = await getEstimatedFees(c);
  const initial = new BigNumber(gas_price);
  const gasPrice = inferDynamicRange(initial);
  return {
    family: "ethereum",
    gasPrice,
  };
};

const getNetworkInfoByGasTrackerBarometer = async (c) => {
  const api = apiForCurrency(c);
  const { low, medium, high, next_base } = await api.getGasTrackerBarometer(c);
  const minValue = low;
  const maxValue = high.lte(low) ? low.times(2) : high;
  const initial = medium;
  if (EIP1559ShouldBeUsed(c)) {
    const maxPriorityFeePerGas = inferDynamicRange(initial, {
      minValue,
      maxValue,
    });
    const nextBaseFeePerGas = next_base;
    return {
      family: "ethereum",
      maxPriorityFeePerGas,
      nextBaseFeePerGas,
    };
  } else {
    const gasPrice = inferDynamicRange(initial, {
      minValue,
      maxValue,
    });
    return {
      family: "ethereum",
      gasPrice,
    };
  }
};

const getNetworkInfo = (c) =>
  getNetworkInfoByGasTrackerBarometer(c).catch((e) => {
    // TODO: drop this fallback when the API is 100% in production
    if (e.status === 404) {
      return getNetworkInfoByOneGasPrice(c);
    }

    throw e;
  });

const inferGasPrice = (t: Transaction, networkInfo: NetworkInfo) => {
  return t.feesStrategy === "slow"
    ? networkInfo?.gasPrice?.min
    : t.feesStrategy === "medium"
    ? networkInfo?.gasPrice?.initial
    : t.feesStrategy === "fast"
    ? networkInfo?.gasPrice?.max
    : t.gasPrice || networkInfo?.gasPrice?.initial;
};

const inferNextBaseFeePerGas = (t: Transaction, networkInfo: NetworkInfo) => {
  return ["slow", "medium", "fast"].includes(String(t.feesStrategy))
    ? networkInfo?.nextBaseFeePerGas
    : t.maxBaseFeePerGas;
};

const inferMaxPriorityFeePerGas = (
  t: Transaction,
  networkInfo: NetworkInfo
) => {
  if (networkInfo.maxPriorityFeePerGas)
    return t.feesStrategy === "slow"
      ? networkInfo?.maxPriorityFeePerGas?.min
      : t.feesStrategy === "medium"
      ? networkInfo?.maxPriorityFeePerGas?.initial
      : t.feesStrategy === "fast"
      ? networkInfo?.maxPriorityFeePerGas?.max
      : t.maxPriorityFeePerGas || networkInfo?.maxPriorityFeePerGas?.initial;
};

const prepareTransaction = async (a, t: Transaction): Promise<Transaction> => {
  const networkInfo = t.networkInfo || (await getNetworkInfo(a.currency));

  if (EIP1559ShouldBeUsed(a.currency)) {
    const maxPriorityFeePerGas = inferMaxPriorityFeePerGas(
      t,
      networkInfo as NetworkInfo
    );
    const maxBaseFeePerGas = inferNextBaseFeePerGas(
      t,
      networkInfo as NetworkInfo
    );
    if (
      t.maxBaseFeePerGas !== maxBaseFeePerGas ||
      t.maxPriorityFeePerGas !== maxPriorityFeePerGas ||
      t.networkInfo !== networkInfo
    ) {
      t = {
        ...t,
        networkInfo: networkInfo as NetworkInfo,
        maxBaseFeePerGas,
        maxPriorityFeePerGas,
      };
    }
  } else {
    const gasPrice = inferGasPrice(t, networkInfo as NetworkInfo);
    if (t.gasPrice !== gasPrice || t.networkInfo !== networkInfo) {
      t = { ...t, networkInfo: networkInfo as NetworkInfo, gasPrice };
    }
  }

  let estimatedGasLimit;
  const request = inferEthereumGasLimitRequest(a, t);

  if (request.to) {
    estimatedGasLimit = await estimateGasLimit(a, request.to, request);
  }

  if (
    !t.estimatedGasLimit ||
    (estimatedGasLimit && !estimatedGasLimit.eq(t.estimatedGasLimit))
  ) {
    t.estimatedGasLimit = estimatedGasLimit;
  }

  t = await prepareTransactionModules(a, t);

  return t;
};

const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
}) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const t = await prepareTransaction(mainAccount, {
    ...createTransaction(),
    subAccountId: account.type === "Account" ? null : account.id,
    ...transaction,
    recipient:
      transaction?.recipient || "0x0000000000000000000000000000000000000000",
    useAllAmount: true,
  });
  const s = await getTransactionStatus(mainAccount, t);
  return s.amount;
};

const getPreloadStrategy = (_currency) => ({
  preloadMaxAge: 30 * 1000,
});

const currencyBridge: CurrencyBridge = {
  getPreloadStrategy,
  preload,
  hydrate,
  scanAccounts,
  nftResolvers: {
    nftMetadata,
    collectionMetadata,
  },
};
const accountBridge: AccountBridge<Transaction> = {
  createTransaction,
  updateTransaction,
  prepareTransaction,
  estimateMaxSpendable,
  getTransactionStatus,
  sync,
  receive,
  signOperation,
  broadcast,
};
export default {
  currencyBridge,
  accountBridge,
};
