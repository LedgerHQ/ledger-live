// @flow
import React, { useState, useCallback, useMemo, useEffect } from "react";

import SendFeeMode from "~/renderer/components/SendFeeMode";
import SelectFeeStrategy from "~/renderer/components/SelectFeeStrategy";
import GasLimitField from "./GasLimitField";
import GasPriceField from "./GasPriceField";
import { useFeesStrategy } from "@ledgerhq/live-common/families/ethereum/react";
import { getGasLimit } from "@ledgerhq/live-common/families/ethereum/transaction";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { context } from "~/renderer/drawers/Provider";
import { track } from "~/renderer/analytics/segment";

const hasAdvancedStrategy = transaction => {
  return !["slow", "medium", "fast"].includes(transaction.feesStrategy);
};

const getAdvancedStrategy = transaction => {
  if (hasAdvancedStrategy(transaction)) {
    return {
      label: transaction.feesStrategy,
      amount: transaction.gasPrice,
      displayedAmount: transaction.gasPrice.multipliedBy(getGasLimit(transaction)),
    };
  }

  return null;
};

const Root = (props: *) => {
  const { transaction, account, updateTransaction, trackProperties = {} } = props;
  const bridge = getAccountBridge(account);
  const { state: drawerState, setDrawer } = React.useContext(context);

  const defaultStrategies = useFeesStrategy(transaction);
  const [advancedStrategy, setAdvancedStrategy] = useState(getAdvancedStrategy(transaction));
  const [isAdvanceMode, setAdvanceMode] = useState(!transaction.feesStrategy);
  const strategies = useMemo(
    () => (advancedStrategy ? [...defaultStrategies, advancedStrategy] : defaultStrategies),
    [defaultStrategies, advancedStrategy],
  );

  useEffect(() => {
    const newAdvancedStrategy = getAdvancedStrategy(transaction);
    if (newAdvancedStrategy) {
      setAdvancedStrategy(newAdvancedStrategy);
      track("button_clicked", {
        ...trackProperties,
        ...newAdvancedStrategy,
        button: "advanced",
      });
    }
  }, [transaction, setAdvancedStrategy, trackProperties]);

  const onFeeStrategyClick = useCallback(
    ({ amount, feesStrategy }) => {
      track("button_clicked", {
        ...trackProperties,
        button: feesStrategy,
        gasPrice: amount,
      });
      updateTransaction(transaction =>
        bridge.updateTransaction(transaction, { gasPrice: amount, feesStrategy }),
      );
      if (drawerState.open) setDrawer(undefined);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateTransaction, bridge],
  );

  const setAdvanceModeAndTrack = useCallback(
    state => {
      track("button_clicked", {
        ...trackProperties,
        button: state ? "advanced" : "standard",
      });
      setAdvanceMode(state);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateTransaction, bridge],
  );
  return (
    <>
      <SendFeeMode
        isAdvanceMode={isAdvanceMode}
        setAdvanceMode={setAdvanceModeAndTrack}
        trackProperties={trackProperties}
      />
      {isAdvanceMode ? (
        <>
          <GasPriceField {...props} />
          <GasLimitField {...props} />
        </>
      ) : (
        <SelectFeeStrategy strategies={strategies} onClick={onFeeStrategyClick} {...props} />
      )}
    </>
  );
};

export default {
  component: Root,
  fields: ["feeStrategy", "gasLimit", "gasPrice"],
};
