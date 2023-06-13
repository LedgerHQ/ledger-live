import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useGasOptions } from "@ledgerhq/live-common/families/evm/react";
import { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types";
import { AccountBridge } from "@ledgerhq/types-live";
import React, { useCallback, useState } from "react";
import SendFeeMode from "~/renderer/components/SendFeeMode";
import { ContextValue, context } from "~/renderer/drawers/Provider";
import GasLimitField from "./GasLimitField";
import GasPriceField from "./GasPriceField";
import MaxFeeField from "./MaxFeeField";
import PriorityFeeField from "./PriorityFeeField";
import SelectFeeStrategy from "./SelectFeeStrategy";
import { EvmFamily } from "../types";
import { isError } from "lodash";

const Root: NonNullable<EvmFamily["sendAmountFields"]>["component"] = props => {
  const { account, updateTransaction, transaction } = props;
  const bridge: AccountBridge<EvmTransaction> = getAccountBridge(account);
  const { state: drawerState, setDrawer } = React.useContext<ContextValue>(context);

  console.log("interval", account.currency.blockAvgTime);

  // FIXME: handle gasOptions is error
  const gasOptions = useGasOptions({
    currency: account.currency,
    transaction,
    interval: account.currency.blockAvgTime,
  });
  const [isAdvanceMode, setAdvanceMode] = useState(!transaction.feesStrategy);

  const shouldUseEip1559 = transaction.type === 2;

  const onFeeStrategyClick = useCallback(
    ({ feesStrategy }) => {
      updateTransaction((tx: EvmTransaction) =>
        bridge.updateTransaction(tx, {
          feesStrategy,
        }),
      );
      if (drawerState.open) setDrawer(undefined);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateTransaction, bridge],
  );

  /**
   * If no gasOptions available, this means this currency does not have a
   * gasTracker. Hence, we do not display the fee fields.
   */
  if (!gasOptions || isError(gasOptions)) {
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
