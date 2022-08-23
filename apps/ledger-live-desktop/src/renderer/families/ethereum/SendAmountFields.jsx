// @flow
import React, { useState, useCallback, useMemo, useEffect } from "react";

import SendFeeMode from "~/renderer/components/SendFeeMode";
import SelectFeeStrategy from "~/renderer/components/SelectFeeStrategy";
import GasLimitField from "./GasLimitField";
import GasPriceField from "./GasPriceField";
import MaxBaseFeeField from "./MaxBaseFeeField";
import PriorityFeeField from "./PriorityFeeField";
import { useFeesStrategy } from "@ledgerhq/live-common/families/ethereum/react";
import { EIP1559ShouldBeUsed, getGasLimit } from "@ledgerhq/live-common/families/ethereum/transaction";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { context } from "~/renderer/drawers/Provider";

const Root = (props: *) => {
  const { transaction } = props;
  const { account, updateTransaction } = props;
  const bridge = getAccountBridge(account);
  const { state: drawerState, setDrawer } = React.useContext(context);

  const defaultStrategies = useFeesStrategy(transaction);
  const [isAdvanceMode, setAdvanceMode] = useState(!transaction.feesStrategy);
  const strategies = defaultStrategies

  const onFeeStrategyClick = useCallback(
    ({ amount, feesStrategy, txParameters }) => {
      updateTransaction(transaction =>
        bridge.updateTransaction(transaction, {
          gasPrice: amount,
          maxBaseFeePerGas: txParameters?.maxBaseFeePerGas,
          maxPriorityFeePerGas: txParameters?.maxPriorityFeePerGas,
          feesStrategy
        }),
      );
      if (drawerState.open) setDrawer(undefined);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateTransaction, bridge],
  );

  return (
    <>
      <SendFeeMode isAdvanceMode={isAdvanceMode} setAdvanceMode={setAdvanceMode} />
      {isAdvanceMode ?
        EIP1559ShouldBeUsed(account.currency) ?
          (
            <>
              <MaxBaseFeeField {...props} />
              <PriorityFeeField {...props} />
              <GasLimitField {...props} />
            </>
          ) :
          (
            <>
              <GasPriceField {...props} />
              <GasLimitField {...props} />
            </>
          ) :
        (
          <>
            <SelectFeeStrategy strategies={strategies} onClick={onFeeStrategyClick} {...props} />
            <GasLimitField {...props} />
          </>
        )}
    </>
  );
};

export default {
  component: Root,
  fields: ["feeStrategy", "gasLimit", "gasPrice"],
};
