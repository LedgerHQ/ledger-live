import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { Contact, Plus } from "@ledgerhq/lumen-ui-react/symbols";
import useLedgerSyncEntryPointViewModel from "LLD/features/LedgerSyncEntryPoints/useLedgerSyncEntryPointViewModel";
import { EntryPoint } from "LLD/features/LedgerSyncEntryPoints/types";
import { useSendFlowActions } from "../../context/SendFlowContext";
import { WalletSyncView } from "./WalletSyncView";

export type AddContactViewProps = Readonly<{
  onAddNewContact?: () => void;
  onAddToExistingContact?: () => void;
}>;

export function AddContactView({ onAddNewContact, onAddToExistingContact }: AddContactViewProps) {
  const [skipWalletSync, setSkipWalletSync] = useState(false);

  const { t } = useTranslation();
  const { close } = useSendFlowActions();
  const { shouldDisplayEntryPoint, entryPointComponent, openDrawer, onClickEntryPoint } =
    useLedgerSyncEntryPointViewModel({
      entryPoint: EntryPoint.sendFlow,
      needEligibleDevice: true,
      onboardingNewDevice: true,
    });

  const WalletSyncButton = entryPointComponent;

  function handleOnWalletSyncPress() {
    onClickEntryPoint();
    close();
    openDrawer();
  }

  function handleOnSkipWalletSyncPress() {
    setSkipWalletSync(true);
  }

  if (shouldDisplayEntryPoint && !skipWalletSync) {
    return (
      <WalletSyncView
        WalletSyncButton={WalletSyncButton}
        onWalletSyncPress={handleOnWalletSyncPress}
        onSkipWalletSyncPress={handleOnSkipWalletSyncPress}
      />
    );
  }

  return (
    <div className="flex flex-col" data-testid="send-add-contact-step">
      <ListItem onClick={onAddNewContact} data-testid="send-add-contact-new">
        <ListItemLeading>
          <Spot appearance="icon" icon={Plus} />
          <ListItemContent>
            <ListItemTitle>{t("newSendFlow.addContact.newContact")}</ListItemTitle>
          </ListItemContent>
        </ListItemLeading>
      </ListItem>
      <ListItem onClick={onAddToExistingContact} data-testid="send-add-contact-existing">
        <ListItemLeading>
          <Spot appearance="icon" icon={Contact} />
          <ListItemContent>
            <ListItemTitle>{t("newSendFlow.addContact.existingContact")}</ListItemTitle>
          </ListItemContent>
        </ListItemLeading>
      </ListItem>
    </div>
  );
}
