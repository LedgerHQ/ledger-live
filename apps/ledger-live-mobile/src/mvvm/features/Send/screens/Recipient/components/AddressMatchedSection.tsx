import {
  Banner,
  BottomSheet,
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  Text,
  useBottomSheetRef,
} from "@ledgerhq/lumen-ui-rnative";
import React, { useCallback } from "react";
import { Keyboard } from "react-native";
import { useTranslation } from "~/context/Locale";
import type { AddressMatchedSectionViewModel } from "../hooks/useAddressMatchedSectionViewModel";
import { AccountRowWithBalance } from "./AccountRowWithBalance";
import { AddressListItem } from "./AddressListItem";
import { RecipientCard } from "./RecipientCard";

type AddressMatchedSectionProps = Readonly<{
  viewModel: AddressMatchedSectionViewModel;
}>;

export function AddressMatchedSection({ viewModel }: AddressMatchedSectionProps) {
  const { t } = useTranslation();
  const helpSheetRef = useBottomSheetRef();
  const openHelpSheet = useCallback(() => {
    Keyboard.dismiss();
    helpSheetRef.current?.present();
  }, [helpSheetRef]);

  if (!viewModel.isVisible || !viewModel.suggestion) {
    return null;
  }

  const { suggestion } = viewModel;

  return (
    <Box lx={{ flexDirection: "column" }}>
      {viewModel.showHeader && (
        <Subheader lx={{ marginBottom: "s12", marginHorizontal: "s8" }}>
          <SubheaderRow>
            <SubheaderTitle>{viewModel.addressMatchedLabel}</SubheaderTitle>
          </SubheaderRow>
        </Subheader>
      )}
      <Box lx={{ flexDirection: "column" }}>
        {suggestion.kind === "recipient-card" ? (
          <RecipientCard
            recipient={suggestion.recipient}
            description={suggestion.description}
            contact={suggestion.contact}
            isReady={suggestion.isReady}
            showActions={suggestion.showActions}
            hasAddressBook={suggestion.hasAddressBook}
            addressBookUnsupportedTitle={suggestion.addressBookUnsupportedTitle}
            addressBookUnsupportedDescription={suggestion.addressBookUnsupportedDescription}
            addContactLabel={suggestion.addContactLabel}
            sendLabel={suggestion.sendLabel}
            onAddContact={suggestion.onAddContact}
            onSend={suggestion.onSend}
            onUnsupportedNetwork={suggestion.onUnsupportedNetwork}
            onDismissUnsupportedNetwork={suggestion.onDismissUnsupportedNetwork}
          />
        ) : suggestion.kind === "matched-ledger-accounts" ? (
          suggestion.matchedAccounts.map(({ account }) => (
            <AccountRowWithBalance
              key={account.id}
              account={account}
              onSelect={() => suggestion.onSelect(account.freshAddress)}
              showSendTo
              disabled={suggestion.isDisabled}
              testID="new-send-flow-address-confirm"
            />
          ))
        ) : (
          <AddressListItem
            address={suggestion.address}
            name={suggestion.name}
            description={suggestion.description}
            onSelect={suggestion.onSelect}
            showSendTo
            isLedgerAccount={suggestion.isLedgerAccount}
            disabled={suggestion.disabled}
            hideDescription={suggestion.hideDescription}
            testID="new-send-flow-address-confirm"
          />
        )}
      </Box>
      {viewModel.showFirstInteractionWarning && (
        <Box lx={{ flexDirection: "column", marginVertical: "s16", marginHorizontal: "s8" }}>
          <Banner
            appearance="info"
            description={t("send.newSendFlow.firstInteraction.description")}
            primaryAction={
              <Button appearance="gray" size="sm" onPress={openHelpSheet}>
                {t("send.newSendFlow.firstInteraction.learnMore")}
              </Button>
            }
          />
        </Box>
      )}
      <BottomSheet ref={helpSheetRef} enableDynamicSizing snapPoints={null}>
        <BottomSheetView>
          <BottomSheetHeader />
          <Box lx={{ paddingHorizontal: "s16", paddingBottom: "s48", gap: "s12" }}>
            <Text typography="heading2SemiBold" lx={{ color: "base" }}>
              {t("send.newSendFlow.firstInteraction.helpTitle")}
            </Text>
            <Text typography="body1" lx={{ color: "base" }}>
              {t("send.newSendFlow.firstInteraction.helpDescription")}
            </Text>
          </Box>
        </BottomSheetView>
      </BottomSheet>
    </Box>
  );
}
