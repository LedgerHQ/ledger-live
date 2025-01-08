import React from "react";
import { View, StyleSheet, Linking } from "react-native";
import { Trans } from "react-i18next";

import type { DerivationMode } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

import Button from "~/components/Button";
import QueuedDrawer from "~/components/QueuedDrawer";
import { urls } from "~/utils/urls";
import useAddressTypeTooltipViewModel from "./useAddressTypeTooltipViewModel";
import { Text, Icons } from "@ledgerhq/native-ui";

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
        IconRight={() => <Icons.Information size="M" color="primary.c10" />}
      />
      <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onClose} style={styles.modal}>
        <View style={styles.modalContainer}>
          <Text style={styles.subtitle} color="grey">
            <Trans i18nKey="addAccounts.addressTypeInfo.subtitle" />
          </Text>
          <Text style={styles.modalTitle}>
            <Trans i18nKey="addAccounts.addressTypeInfo.title" />
          </Text>
        </View>

        {formattedAccountSchemes.map((scheme, i) => (
          <View key={i + scheme} style={styles.modalRow}>
            <Text style={styles.title}>
              <Trans i18nKey={`addAccounts.addressTypeInfo.${scheme}.title`} />
            </Text>
            <Text style={styles.subtitle} color="grey">
              <Trans
                i18nKey={`addAccounts.addressTypeInfo.${scheme}.desc`}
                values={{
                  currency: currency.name,
                }}
              />
            </Text>
          </View>
        ))}
        {currency && currency.family === "bitcoin" ? (
          <Button
            event={"AddAccountsSupportLink_AddressType"}
            type="lightSecondary"
            title={<Trans i18nKey="common.learnMore" />}
            IconLeft={() => <Icons.ExternalLink size="M" color="primary.c10" />}
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
    fontWeight: "bold",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
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
