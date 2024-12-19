import React from "react";
import { View, StyleSheet, Linking } from "react-native";
import { Trans } from "react-i18next";

import type { DerivationMode } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

import Button from "~/components/Button";
import LText from "~/components/LText";
import QueuedDrawer from "~/components/QueuedDrawer";
import ExternalLink from "~/icons/ExternalLink";
import Info from "~/icons/Info";
import { urls } from "~/utils/urls";
import useAddressTypeTooltipViewModel from "./useAddressTypeTooltipViewModel";

const AddressTypeTooltip = ({
  accountSchemes,
  currency,
}: {
  accountSchemes: Array<DerivationMode> | null | undefined;
  currency: CryptoCurrency;
}) => {
  const { isOpen, onOpen, onClose, formattedAccountSchemes } =
    useAddressTypeTooltipViewModel(accountSchemes);

  return (
    <>
      <Button
        event={"AddAccountsAddressTypeTooltip"}
        type="lightSecondary"
        title={<Trans i18nKey="addAccounts.addressTypeInfo.title" />}
        onPress={onOpen}
        IconRight={Info}
      />
      <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onClose} style={styles.modal}>
        <View style={styles.modalContainer}>
          <LText style={styles.subtitle} color="grey">
            <Trans i18nKey="addAccounts.addressTypeInfo.subtitle" />
          </LText>
          <LText bold style={styles.modalTitle}>
            <Trans i18nKey="addAccounts.addressTypeInfo.title" />
          </LText>
        </View>

        {formattedAccountSchemes.map((scheme, i) => (
          <View key={i + scheme} style={styles.modalRow}>
            <LText bold style={styles.title}>
              <Trans i18nKey={`addAccounts.addressTypeInfo.${scheme}.title`} />
            </LText>
            <LText style={styles.subtitle} color="grey">
              <Trans
                i18nKey={`addAccounts.addressTypeInfo.${scheme}.desc`}
                values={{
                  currency: currency.name,
                }}
              />
            </LText>
          </View>
        ))}
        {currency && currency.family === "bitcoin" ? (
          <Button
            event={"AddAccountsSupportLink_AddressType"}
            type="lightSecondary"
            title={<Trans i18nKey={`common.learnMore`} />}
            IconLeft={ExternalLink}
            onPress={() => Linking.openURL(urls.bitcoinAddressType)}
          />
        ) : null}
      </QueuedDrawer>
    </>
  );
};

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 14,
  },
  title: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 20,
  },
  modal: {
    paddingHorizontal: 24,
  },
  modalContainer: {
    marginTop: 24,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalRow: {
    marginVertical: 16,
  },
});

export default AddressTypeTooltip;
