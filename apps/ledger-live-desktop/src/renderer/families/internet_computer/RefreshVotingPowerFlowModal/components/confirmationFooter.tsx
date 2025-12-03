import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { StepProps } from "../types";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";

export function ConfirmationFooter({
  account,
  onClose,
  transitionTo,
  neurons,
  onChangeTransaction,
  setLastManageAction,
  error,
}: StepProps) {
  const { t } = useTranslation();
  const currencyName = account.currency.name;
  const onClickSync = useCallback(() => {
    const bridge = getAccountBridge(account);
    const initTx = bridge.createTransaction(account);
    setLastManageAction("list_neurons");
    onChangeTransaction(
      bridge.updateTransaction(initTx, {
        type: "list_neurons",
      }),
    );
    transitionTo("device");
  }, [account, onChangeTransaction, transitionTo, setLastManageAction]);

  const onRetry = useCallback(() => {
    transitionTo("listNeuron");
  }, [transitionTo]);

  return (
    <Box width="100%" horizontal alignItems="center" justifyContent="space-between">
      <Box ff="Inter|SemiBold" fontSize={4} color="palette.text.shade60">
        {`${t("internetComputer.lastSynced")}: ${neurons.lastUpdatedMSecs ? new Date(neurons.lastUpdatedMSecs).toLocaleString() : t("common.never")}`}
      </Box>
      <Box horizontal>
        <Button ml={2} onClick={onClose}>
          {t("common.close")}
        </Button>
        <Button
          ml={2}
          event={`Manage Neurons ${currencyName} Flow Step 3 Sync Neurons Clicked`}
          onClick={error ? onRetry : onClickSync}
          outline={true}
        >
          {error ? t("common.retry") : t("internetComputer.sync")}
        </Button>
      </Box>
    </Box>
  );
}
