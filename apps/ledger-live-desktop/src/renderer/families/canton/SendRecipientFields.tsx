import { TooManyUtxosCritical, TooManyUtxosWarning } from "@ledgerhq/coin-canton";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import {
  CantonAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/canton/types";
import { Account } from "@ledgerhq/types-live";
import React, { useEffect } from "react";
import { Trans } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { closeAllModal, openModal } from "~/renderer/reducers/modals";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { modalsStateSelector } from "~/renderer/reducers/modals";
import { handleTopologyChangeError, TopologyChangeError } from "./hooks/topologyChangeError";
import CommentField from "./CommentField";
import ExpiryDurationField from "./ExpiryDurationField";

const Root = (props: {
  account: Account;
  onChange: (a: Transaction) => void;
  status: TransactionStatus;
  transaction: Transaction;
  autoFocus?: boolean;
  parentAccount?: Account | null;
  trackProperties?: object;
}) => {
  const { status, account, parentAccount, transaction } = props;
  const dispatch = useDispatch();
  const device = useSelector(getCurrentDevice);
  const modalsState = useSelector(modalsStateSelector);
  const sendModalData = modalsState.MODAL_SEND?.isOpened ? modalsState.MODAL_SEND.data : undefined;
  const cantonAccount = account as CantonAccount;
  const mainAccount = getMainAccount(account, parentAccount);

  const tooManyUtxosCritical = status?.warnings?.tooManyUtxos instanceof TooManyUtxosCritical;
  const tooManyUtxosWarning = status?.warnings?.tooManyUtxos instanceof TooManyUtxosWarning;
  const topologyChangeError = status?.errors?.topologyChange instanceof TopologyChangeError;

  useEffect(() => {
    if (topologyChangeError) {
      // Create a navigation snapshot to restore the send modal after reonboarding
      const navigationSnapshot = {
        type: "modal" as const,
        modalName: "MODAL_SEND" as const,
        modalData: {
          account,
          parentAccount: parentAccount || undefined,
          stepId: "recipient" as const,
          transaction,
          ...sendModalData,
        },
      };

      handleTopologyChangeError(dispatch, {
        accounts: [],
        currency: account.currency,
        device,
        mainAccount,
        navigationSnapshot,
      });
    } else if (tooManyUtxosCritical) {
      dispatch(closeAllModal());
      dispatch(openModal("MODAL_CANTON_TOO_MANY_UTXOS", { account: cantonAccount }));
    }
  }, [
    account,
    cantonAccount,
    device,
    dispatch,
    mainAccount,
    parentAccount,
    sendModalData,
    tooManyUtxosCritical,
    topologyChangeError,
    transaction,
  ]);

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
      <Box mb={15}>
        <ExpiryDurationField {...props} />
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
