import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Range, inferDynamicRange } from "@ledgerhq/live-common/range";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import React, { memo, useCallback } from "react";
import FeeSliderField from "~/renderer/components/FeeSliderField";
import { EvmFamily } from "../types";

const fallbackGasPrice = inferDynamicRange(BigNumber(10e9));
let lastNetworkGasPrice: Range | undefined; // local cache of last value to prevent extra blinks

const FeesField: NonNullable<EvmFamily["sendAmountFields"]>["component"] = ({
  account,
  transaction,
  status,
  updateTransaction,
}) => {
  invariant(transaction.family === "evm", "FeeField: evm family expected");
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

  // FIXME: gasPrice should always be defined if gasOptions is defined
  const networkGasPrice =
    gasOptions &&
    inferDynamicRange(gasOptions.medium.gasPrice || new BigNumber(0), {
      minValue: gasOptions.slow.gasPrice || undefined,
      maxValue: gasOptions.fast.gasPrice || undefined,
    });

  if (!lastNetworkGasPrice && networkGasPrice) {
    lastNetworkGasPrice = networkGasPrice;
  }
  const range = networkGasPrice || lastNetworkGasPrice || fallbackGasPrice;
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
