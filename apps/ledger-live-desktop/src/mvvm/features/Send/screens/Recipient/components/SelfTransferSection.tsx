import React from "react";
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
import { ChevronRight, UserCheck, UserLock } from "@ledgerhq/lumen-ui-react/symbols";
import { useSelfTransferSectionViewModel } from "./useSelfTransferSectionViewModel";

/**
 * Offers a transfer to the account's other balance pool, for currencies whose send
 * descriptor declares several (see `SendDescriptor.balanceType`). The descriptor owns
 * which address that is; this only prefills it as the recipient.
 */
export function SelfTransferSection() {
  const { t } = useTranslation();
  const viewModel = useSelfTransferSectionViewModel();

  if (!viewModel) return null;

  const { target, onSelfTransfer } = viewModel;
  const displayLabel = t(`newSendFlow.${target.translationKey}.label`);
  const IconComponent = target.isDestinationPublic ? UserCheck : UserLock;

  return (
    <div className="mb-12" data-testid="self-transfer-section">
      <Subheader className="mb-12">
        <SubheaderRow>
          <SubheaderTitle>{t("newSendFlow.recipient.selfTransfer.title")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <ListItem
        onClick={() => onSelfTransfer(displayLabel)}
        data-testid="self-transfer-button"
        className="mt-6"
      >
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
