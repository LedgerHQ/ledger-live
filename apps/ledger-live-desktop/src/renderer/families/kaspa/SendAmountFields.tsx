import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useFeesStrategy } from "@ledgerhq/live-common/families/kaspa/react";
import { Transaction } from "@ledgerhq/live-common/families/kaspa/types";
import React, { useCallback, useEffect, useState } from "react";
import SelectFeeStrategyKaspa, { OnClickType } from "./SelectFeeStrategyKaspa";
import { KaspaFamily } from "~/renderer/families/kaspa/types";
import SendFeeMode from "~/renderer/components/SendFeeMode";
import { track } from "~/renderer/analytics/segment";
import { FeesField } from "./FeesField";
import BigNumber from "bignumber.js";

type Props = NonNullable<KaspaFamily["sendAmountFields"]>["component"];

const getFeeRate = (transaction: Transaction | null | undefined): BigNumber => {
  if (!transaction) {
    return BigNumber(0);
  }
  if (transaction.feesStrategy === "custom") {
    return transaction.customFeeRate || BigNumber(0);
  }
  const filteredNetworkInfo = transaction.networkInfo.filter(
    ni => ni.label === transaction.feesStrategy,
  );

  if (!filteredNetworkInfo) {
    throw new Error("Invalid fee strategy provided");
  }

  return filteredNetworkInfo[0].amount;
};

const Fields: Props = ({
  transaction,
  account,
  status,
  updateTransaction,
  mapStrategies,
  trackProperties = {},
}) => {
  const [isAdvanceMode, setAdvanceMode] = useState(!transaction.feesStrategy);
  const bridge = getAccountBridge(account);

  const strategies = useFeesStrategy(account, transaction);

  useEffect(() => {
    updateTransaction((t: Transaction) =>
      bridge.updateTransaction(t, {
        rbf: true,
        // initially "fast" is selected - set this feerate
        feerate: strategies.filter(x => x.label === "fast")[0].amount,
      }),
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onFeeStrategyClick = useCallback(
    ({ feesStrategy }: OnClickType) => {
      updateTransaction(
        (transaction: Transaction) =>
          !isAdvanceMode &&
          bridge.updateTransaction(transaction, {
            feesStrategy,
          }),
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateTransaction, bridge],
  );

  const setAdvanceModeAndTrack = useCallback(
    (state: boolean) => {
      track("button_clicked2", {
        ...trackProperties,
        button: state ? "advanced" : "standard",
      });
      setAdvanceMode(state);
      if (state) {
        updateTransaction((transaction: Transaction) =>
          bridge.updateTransaction(transaction, {
            feesStrategy: "custom",
            customFeeRate: getFeeRate(transaction),
          }),
        );
      } else {
        updateTransaction((transaction: Transaction) =>
          bridge.updateTransaction(transaction, {
            feesStrategy: "fast",
          }),
        );
      }
    },
    [trackProperties, updateTransaction, bridge],
  );

  const customFeeChanged = useCallback(
    (feePerByte: BigNumber) => {
      updateTransaction((transaction: Transaction) =>
        bridge.updateTransaction(transaction, {
          feesStrategy: "custom",
          customFeeRate: feePerByte,
        }),
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateTransaction, bridge],
  );

  return (
    <>
      <SendFeeMode isAdvanceMode={isAdvanceMode} setAdvanceMode={setAdvanceModeAndTrack} />
      {!isAdvanceMode ? (
        <SelectFeeStrategyKaspa
          strategies={strategies}
          onClick={onFeeStrategyClick}
          transaction={transaction}
          account={account}
          suffixPerByte={true}
          mapStrategies={mapStrategies}
          status={status}
        />
      ) : (
        <FeesField
          account={account}
          onChange={customFeeChanged}
          transaction={transaction}
          status={status}
        />
      )}
    </>
  );
};
export default {
  component: Fields,
  fields: ["feePerByte", "rbf"],
};
