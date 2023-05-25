import React, { useCallback } from "react";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { Account } from "@ledgerhq/types-live";
import {
  Transaction,
  TransactionStatus,
  TransactionRaw,
} from "@ledgerhq/live-common/families/ethereum/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import FeeSliderField from "~/renderer/components/FeeSliderField";
import { inferDynamicRange } from "@ledgerhq/live-common/range";
import { getEnv } from "@ledgerhq/live-env";

type Props = {
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
  updateTransaction: (updater: any) => void;
  transactionRaw?: TransactionRaw;
};
const fallbackGasPrice = inferDynamicRange(BigNumber(10e9));
let lastNetworkGasPrice; // local cache of last value to prevent extra blinks

const FeesField = ({ account, transaction, status, updateTransaction, transactionRaw }: Props) => {
  invariant(transaction.family === "ethereum", "FeeField: ethereum family expected");
  const bridge = getAccountBridge(account);
  const onGasPriceChange = useCallback(
    gasPrice => {
      updateTransaction(transaction =>
        bridge.updateTransaction(transaction, {
          gasPrice,
          feesStrategy: "advanced",
        }),
      );
    },
    [updateTransaction, bridge],
  );
  const networkGasPrice = transaction.networkInfo && transaction.networkInfo.gasPrice;
  if (!lastNetworkGasPrice && networkGasPrice) {
    lastNetworkGasPrice = networkGasPrice;
  }
  let range = networkGasPrice || lastNetworkGasPrice || fallbackGasPrice;
  const gasPrice = transaction.gasPrice || range.initial;
  // update gas price range according to previous pending transaction if necessary
  if (transactionRaw && transactionRaw.gasPrice) {
    const gaspriceGap: number = getEnv("EDIT_TX_LEGACY_GASPRICE_GAP_SPEEDUP_FACTOR");
    const minNewGasPrice = new BigNumber(transactionRaw.gasPrice).times(1 + gaspriceGap);
    const minValue = BigNumber.max(range.min, minNewGasPrice);
    let maxValue = BigNumber.max(range.max, minNewGasPrice);
    // avoid lower bound = upper bound, which will cause an error in inferDynamicRange
    if (minValue.isEqualTo(maxValue)) {
      maxValue = minValue.times(2);
    }
    range = inferDynamicRange(minValue, {
      minValue,
      maxValue,
    });
  }
  const { units } = account.currency;
  return (
    <FeeSliderField
      range={range}
      defaultValue={range.initial}
      value={gasPrice}
      onChange={onGasPriceChange}
      unit={units.length > 1 ? units[1] : units[0]}
      error={status.errors.gasPrice}
    />
  );
};
export default FeesField;
