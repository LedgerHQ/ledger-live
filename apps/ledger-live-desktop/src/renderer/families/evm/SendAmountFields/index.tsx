import { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useGasOptions } from "@ledgerhq/live-common/families/evm/react";
import { log } from "@ledgerhq/logs";
import { AccountBridge } from "@ledgerhq/types-live";
import React, { useCallback, useEffect, useState } from "react";
import SendFeeMode from "~/renderer/components/SendFeeMode";
import Spinner from "~/renderer/components/Spinner";
import { EvmFamily } from "../types";
import GasLimitField from "./GasLimitField";
import GasPriceField from "./GasPriceField";
import MaxFeeField from "./MaxFeeField";
import PriorityFeeField from "./PriorityFeeField";
import SelectFeeStrategy from "./SelectFeeStrategy";

const Root: NonNullable<EvmFamily["sendAmountFields"]>["component"] = props => {
  const { account, updateTransaction, transaction } = props;
  const bridge: AccountBridge<EvmTransaction> = getAccountBridge(account);

  const [gasOptions, error, loading] = useGasOptions({
    currency: account.currency,
    transaction,
    interval: account.currency.blockAvgTime ? account.currency.blockAvgTime * 1000 : undefined,
  });

  if (error) {
    log("SendAmountFields/index.tsx", error.message);
  }

  useEffect(() => {
    updateTransaction((tx: EvmTransaction) => bridge.updateTransaction(tx, { ...tx, gasOptions }));
  }, [bridge, updateTransaction, gasOptions]);

  const [isAdvanceMode, setAdvanceMode] = useState(false);

  const shouldUseEip1559 = transaction.type === 2;

  const onFeeStrategyClick = useCallback(
    ({ feesStrategy }) => {
      updateTransaction((tx: EvmTransaction) =>
        bridge.updateTransaction(tx, {
          feesStrategy,
        }),
      );
    },
    [updateTransaction, bridge],
  );

  if (loading) {
    return (
      <Spinner
        style={{
          margin: "auto",
        }}
        size={32}
      />
    );
  }

  /**
   * If no gasOptions available, this means this currency does not have a
   * gasTracker. Hence, we do not display the fee fields.
   */
  if (!gasOptions) {
    return null;
  }

  return (
    <>
      <SendFeeMode isAdvanceMode={isAdvanceMode} setAdvanceMode={setAdvanceMode} />
      {isAdvanceMode ? (
        shouldUseEip1559 ? (
          <>
            <PriorityFeeField {...props} />
            <MaxFeeField {...props} />
            <GasLimitField {...props} />
          </>
        ) : (
          <>
            <GasPriceField {...props} />
            <GasLimitField {...props} />
          </>
        )
      ) : (
        <>
          <SelectFeeStrategy gasOptions={gasOptions} onClick={onFeeStrategyClick} {...props} />
        </>
      )}
    </>
  );
};

export default {
  component: Root,
  fields: ["feeStrategy", "gasLimit", "gasPrice"],
};
