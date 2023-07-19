import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Range, inferDynamicRange } from "@ledgerhq/live-common/range";
import invariant from "invariant";
import React, { memo, useCallback } from "react";
import FeeSliderField from "~/renderer/components/FeeSliderField";
import { EvmFamily } from "../types";

let lastNetworkGasPrice: Range | undefined; // local cache of last value to prevent extra blinks

const FeesField: NonNullable<EvmFamily["sendAmountFields"]>["component"] = ({
  account,
  transaction,
  status,
  updateTransaction,
}) => {
  invariant(transaction.family === "evm", "GasPriceField: evm family expected");
  const bridge = getAccountBridge(account);
  const onGasPriceChange = useCallback(
    gasPrice => {
      updateTransaction(transaction =>
        bridge.updateTransaction(transaction, {
          gasPrice,
          feesStrategy: "custom",
        }),
      );
    },
    [updateTransaction, bridge],
  );

  const { gasOptions } = transaction;

  invariant(gasOptions, "GasPriceField: 'transaction.gasOptions' should be defined");
  invariant(
    gasOptions.medium.gasPrice,
    "GasPriceField: 'transaction.gasOptions.medium.gasPrice' should be defined",
  );

  const networkGasPrice = inferDynamicRange(gasOptions.medium.gasPrice, {
    minValue: gasOptions.slow.gasPrice,
    maxValue: gasOptions.fast.gasPrice,
  });

  if (!lastNetworkGasPrice) {
    lastNetworkGasPrice = networkGasPrice;
  }

  const range = networkGasPrice || lastNetworkGasPrice;
  const gasPrice = transaction.gasPrice || range.initial;
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
export default memo(FeesField);
