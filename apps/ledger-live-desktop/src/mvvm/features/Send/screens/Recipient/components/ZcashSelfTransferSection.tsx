import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Spot,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-react";
import { ChevronRight, Lock, Unlock } from "@ledgerhq/lumen-ui-react/symbols";
import type { ZcashAccount, Transaction as ZcashTransaction } from "@ledgerhq/coin-zcash/types";
import { useSendFlowData, useSendFlowActions } from "../../../context/SendFlowContext";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";
import type { SendFlowStep } from "@ledgerhq/live-common/flows/send/types";

export function ZcashSelfTransferSection() {
  const { t } = useTranslation();
  const { state, uiConfig } = useSendFlowData();
  const { transaction } = useSendFlowActions();
  const { navigation } = useFlowWizard<SendFlowStep>();

  const account = state.account.account;
  const tx = state.transaction.transaction as unknown as ZcashTransaction | null;

  const sender: "public" | "private" = tx?.sender === "private" ? "private" : "public";
  const zcashAccount = account as ZcashAccount;

  // Destination: opposite pool from the selected source.
  // public→private: unified/shielded address; private→public: transparent address.
  const targetAddress =
    sender === "public"
      ? (zcashAccount?.privateInfo?.shieldedAddress ?? null)
      : (zcashAccount?.freshAddress ?? null);

  const labelKey =
    sender === "public"
      ? "newSendFlow.recipient.selfTransfer.toPrivate"
      : "newSendFlow.recipient.selfTransfer.toPublic";

  const displayLabel = t(
    sender === "public"
      ? "newSendFlow.recipient.selfTransfer.privateBalance"
      : "newSendFlow.recipient.selfTransfer.publicBalance",
  );

  const onSelfTransfer = useCallback(() => {
    if (!targetAddress) return;
    transaction.setRecipient({
      ...state.recipient,
      address: targetAddress,
      displayLabel,
    });
    navigation.goToNextStep();
  }, [targetAddress, transaction, state.recipient, navigation, displayLabel]);

  if (!uiConfig.hasBalanceTypeStep || !account || !targetAddress) return null;

  const IconComponent = sender === "public" ? Lock : Unlock;

  return (
    <div className="mb-12" data-testid="zcash-self-transfer-section">
      <Subheader className="mb-12">
        <SubheaderRow>
          <SubheaderTitle>{t("newSendFlow.recipient.selfTransfer.title")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <ListItem onClick={onSelfTransfer} data-testid="zcash-self-transfer-button" className="mt-6">
        <ListItemLeading>
          <Spot appearance="icon" icon={IconComponent} />
          <ListItemContent>
            <ListItemTitle>{t(labelKey)}</ListItemTitle>
          </ListItemContent>
        </ListItemLeading>
        <ListItemTrailing>
          <ChevronRight size={24} />
        </ListItemTrailing>
      </ListItem>
    </div>
  );
}
