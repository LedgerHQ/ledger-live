import { TooManyUtxosCritical, TooManyUtxosWarning } from "@ledgerhq/coin-canton";
import {
  CantonAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/canton/types";
import { Account } from "@ledgerhq/types-live";
import React, { useEffect } from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "react-redux";
import { closeAllModal, openModal } from "~/renderer/actions/modals";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import CommentField from "./CommentField";

const Root = (props: {
  account: Account;
  parentAccount?: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  onChange: (a: Transaction) => void;
  trackProperties?: object;
  autoFocus?: boolean;
}) => {
  const { status, account } = props;
  const dispatch = useDispatch();
  const cantonAccount = account as CantonAccount;

  const tooManyUtxosCritical = status?.warnings?.tooManyUtxos instanceof TooManyUtxosCritical;
  const tooManyUtxosWarning = status?.warnings?.tooManyUtxos instanceof TooManyUtxosWarning;

  useEffect(() => {
    if (tooManyUtxosCritical) {
      dispatch(closeAllModal());
      dispatch(openModal("MODAL_CANTON_TOO_MANY_UTXOS", { account: cantonAccount }));
    }
  }, [tooManyUtxosCritical, dispatch, cantonAccount]);

  return (
    <Box flow={1}>
      <Box
        mb={15}
        horizontal
        grow
        alignItems="center"
        justifyContent="space-between"
        maxWidth={"100%"}
        id="commentField"
      >
        <Box grow={1} maxWidth={"100%"}>
          <CommentField {...props} />
        </Box>
      </Box>
      {tooManyUtxosWarning && (
        <Alert type="warning">
          <Trans i18nKey={status.warnings.tooManyUtxos.message} />
        </Alert>
      )}
    </Box>
  );
};
export default {
  component: Root,
  // Transaction is used here to prevent user to forward
  // If he format a comment incorrectly
  fields: ["comment", "transaction"],
};
