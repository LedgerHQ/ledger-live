import React, { useEffect, useMemo } from "react";
import { View, Pressable } from "react-native";
import {
  AddressInput,
  IconButton,
  NavBar,
  NavBarBackButton,
  NavBarContent,
  NavBarDescription,
  NavBarTitle,
  NavBarTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { Close } from "@ledgerhq/lumen-ui-rnative/symbols";

import { useTranslation } from "~/context/Locale";

import { AddressDisclaimer } from "./AddressDisclaimer";
import { useSendHeaderViewModel } from "../hooks/useSendHeaderViewModel";
import { useSendFlowData } from "../context/SendFlowContext";
import { useAnalytics } from "~/analytics";
import { getSendFlowTrackingProperties } from "@ledgerhq/ledger-wallet-framework/tracking/send";

type SendHeaderProps = Readonly<{
  headerRight?: React.ReactNode;
}>;

/** Width reserved on the right of the address row for the info icon. */
const DISCLAIMER_HIT_AREA = 56;

export function SendHeader({ headerRight }: SendHeaderProps) {
  const { t } = useTranslation();
  const viewModel = useSendHeaderViewModel();
  const styles = useStyleSheet(
    theme => ({
      addressInputContainer: {
        marginTop: theme.spacings.s8,
        paddingHorizontal: theme.spacings.s16,
        position: "relative",
      },
      addressValue: {
        color: theme.colors.text.base,
      },
      editOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        // Stops short of the trailing info icon so the disclaimer stays pressable.
        right: DISCLAIMER_HIT_AREA,
        bottom: 0,
      },
    }),
    [],
  );

  const { state } = useSendFlowData();
  const { account, parentAccount } = state.account;

  const { track } = useAnalytics();
  const trackingProperties = useMemo(() => {
    return getSendFlowTrackingProperties(account ?? null, parentAccount);
  }, [account, parentAccount]);

  useEffect(() => {
    if (!viewModel.isRecipientStep) {
      return;
    }

    track("send_modal", {
      ...trackingProperties,
      name: "step recipient",
      flow: "send",
    });
  }, [track, trackingProperties, viewModel.isRecipientStep]);

  return (
    <>
      <NavBar density="compact">
        {viewModel.canGoBack ? (
          <NavBarBackButton
            onPress={viewModel.handleBackPress}
            accessibilityLabel={t("common.back")}
          />
        ) : null}
        <NavBarContent>
          {viewModel.showTitle && viewModel.title ? (
            <NavBarTitle>{viewModel.title}</NavBarTitle>
          ) : null}
          {viewModel.descriptionText ? (
            <NavBarDescription>{viewModel.descriptionText}</NavBarDescription>
          ) : null}
        </NavBarContent>
        {viewModel.showHeaderRight && (
          <NavBarTrailing>
            {headerRight ?? (
              <IconButton
                appearance="no-background"
                size="md"
                icon={Close}
                accessibilityLabel={t("common.close")}
                onPress={viewModel.handleClose}
              />
            )}
          </NavBarTrailing>
        )}
      </NavBar>
      {viewModel.showRecipientInput ? (
        <View style={styles.addressInputContainer}>
          {viewModel.isRecipientStep ? (
            <AddressInput
              testID="recipient-input"
              prefix={t("send.newSendFlow.to")}
              value={viewModel.recipientSearch.value}
              onChangeText={viewModel.recipientSearch.setValue}
              onClear={viewModel.clearRecipientSearch}
              onQrCodeClick={viewModel.handleQrCodeClick}
              placeholder={viewModel.recipientPlaceholder}
              autoFocus
            />
          ) : (
            <>
              <AddressInput
                prefix={t("send.newSendFlow.to")}
                value={viewModel.formattedAddress}
                editable={false}
                hideClearButton
                placeholder={viewModel.recipientPlaceholder}
                inputStyle={styles.addressValue}
                suffix={<AddressDisclaimer />}
              />
              <Pressable
                style={styles.editOverlay}
                accessibilityRole="button"
                accessibilityLabel={t("send.newSendFlow.editRecipientAccessibilityLabel")}
                onPress={viewModel.handleRecipientInputPress}
              />
            </>
          )}
        </View>
      ) : null}
    </>
  );
}
