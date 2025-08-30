import React, { useState } from "react";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/stellar/types";
import SendFeeMode from "./SendFeeMode";
import FeeField from "./FeeField";
import Box from "~/renderer/components/Box";
import { track } from "~/renderer/analytics/segment";
import { Account } from "@ledgerhq/types-live";

type Props = {
  account: Account;
  updateTransaction: (updater: (t: Transaction) => Transaction) => void;
  onChange: (t: Transaction) => void;
  transaction: Transaction;
  status: TransactionStatus;
  trackProperties?: Record<string, unknown>;
};

const Root = (props: Props) => {
  const { transaction, trackProperties } = props;
  const { fees } = transaction;
  const bridge = getAccountBridge(props.account);
  const [estimatedFees, setEstimatedFees] = useState(fees || null);

  React.useEffect(() => {
    const fetchEstimatedFees = async () => {
      const preparedTransaction = await bridge.prepareTransaction(props.account, {
        ...transaction,
        customFees: { parameters: { fees: null } },
      });
      setEstimatedFees(preparedTransaction.fees);
    };

    fetchEstimatedFees();
  }, [bridge, transaction, props.account]);

  const isCustomFee = !fees?.eq(estimatedFees || 0);
  const [isCustomMode, setCustomMode] = useState(isCustomFee);
  if (!fees) return null; // these were loaded on the previous send step
  const onFeeModeChange = (isCustom: boolean) => {
    track("button_clicked2", {
      ...trackProperties,
      button: "fee",
      isCustom,
      fees: estimatedFees,
    });
    setCustomMode(isCustom);
    if (!isCustom) {
      props.updateTransaction(t =>
        bridge.updateTransaction(t, {
          fees: estimatedFees,
          customFees: { parameters: { fees: estimatedFees } },
        }),
      );
    }
  };
  return (
    <>
      <SendFeeMode isCustomMode={isCustomMode} setCustomMode={onFeeModeChange} />
      {isCustomMode ? (
        <Box mb={10} horizontal grow>
          <FeeField
            onChange={props.onChange}
            account={props.account}
            transaction={props.transaction}
            status={props.status}
          />
        </Box>
      ) : null}
    </>
  );
};
export default {
  component: Root,
  fields: [],
};
