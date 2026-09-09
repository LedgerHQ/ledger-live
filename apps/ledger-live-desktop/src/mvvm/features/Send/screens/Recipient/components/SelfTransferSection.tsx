import React, { useCallback, useMemo } from "react";
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
import { ChevronRight, Eye, ShieldCheck } from "@ledgerhq/lumen-ui-react/symbols";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";
import type { SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";

/**
 * Offers a transfer to the account's other balance pool, for currencies whose send
 * descriptor declares several (see `SendDescriptor.balanceType`). The descriptor owns
 * which address that is; this only prefills it as the recipient.
 */
export function SelfTransferSection() {
  const { t } = useTranslation();
  const { state } = useSendFlowData();
  const { transaction } = useSendFlowActions();
  const { navigation } = useFlowWizard<SendFlowStep>();

  const account = state.account.account;

  const target = useMemo(() => {
    if (!account) return null;
    const config = sendFeatures.getBalanceTypeConfig(getAccountCurrency(account));
    return (
      config?.getSelfTransferTarget({
        account,
        transaction: state.transaction.transaction,
      }) ?? null
    );
  }, [account, state.transaction.transaction]);

  const displayLabel = target ? t(`newSendFlow.${target.translationKey}.label`) : "";

  const onSelfTransfer = useCallback(() => {
    if (!target) return;
    transaction.setRecipient({
      ...(state.recipient ?? {}),
      address: target.address,
      displayLabel,
      ensName: undefined,
    });
    navigation.goToNextStep();
  }, [target, transaction, state.recipient, navigation, displayLabel]);

  if (!target) return null;

  const IconComponent = target.isDestinationPublic ? Eye : ShieldCheck;

  return (
    <div className="mb-12" data-testid="self-transfer-section">
      <Subheader className="mb-12">
        <SubheaderRow>
          <SubheaderTitle>{t("newSendFlow.recipient.selfTransfer.title")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <ListItem onClick={onSelfTransfer} data-testid="self-transfer-button" className="mt-6">
        <ListItemLeading>
          <Spot appearance="icon" icon={IconComponent} />
          <ListItemContent>
            <ListItemTitle>{t(`newSendFlow.${target.translationKey}.action`)}</ListItemTitle>
          </ListItemContent>
        </ListItemLeading>
        <ListItemTrailing>
          <ChevronRight size={24} />
        </ListItemTrailing>
      </ListItem>
    </div>
  );
}
