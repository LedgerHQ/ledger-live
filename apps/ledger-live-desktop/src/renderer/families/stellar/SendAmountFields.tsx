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
  const { fees, networkInfo } = transaction;
  const isCustomFee = !fees?.eq(networkInfo?.fees || 0);
  const [isCustomMode, setCustomMode] = useState(isCustomFee);
  if (!networkInfo || !fees) return null; // these were loaded on the previous send step
  const bridge = getAccountBridge(props.account);
  const onFeeModeChange = (isCustom: boolean) => {
    track("button_clicked2", {
      ...trackProperties,
      button: "fee",
      isCustom,
      fees: networkInfo.fees,
    });
    setCustomMode(isCustom);
    if (!isCustom) {
      props.updateTransaction(t =>
        bridge.updateTransaction(t, {
          fees: networkInfo.fees,
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
