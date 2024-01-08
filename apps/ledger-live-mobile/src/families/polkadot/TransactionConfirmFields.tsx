import invariant from "invariant";
import React, { useMemo, useCallback } from "react";
import { StyleSheet, Linking, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { Account } from "@ledgerhq/types-live";
import type { PolkadotValidator, Transaction } from "@ledgerhq/live-common/families/polkadot/types";
import { usePolkadotPreloadData } from "@ledgerhq/live-common/families/polkadot/react";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import { useTheme } from "@react-navigation/native";
import LText from "~/components/LText";
import { DataRow, HeaderRow } from "~/components/ValidateOnDeviceDataRow";
import InfoIcon from "~/icons/Info";
import NominationInfo from "./components/NominationInfo";
import PolkadotFeeRow from "./SendRowsFee";
import Alert from "~/components/Alert";

type FieldProps = {
  account: Account;
  transaction: Transaction;
  field: {
    type: string;
    label: string;
  };
};

function PolkadotValidatorsField({ account, transaction, field }: FieldProps) {
  const { validators: polkadotValidators } = usePolkadotPreloadData();
  const validators = transaction.validators;
  const mappedValidators = useMemo(
    () =>
      (validators || [])
        .map<PolkadotValidator | null>(address => {
          const found = polkadotValidators.find(v => v.address === address);
          return found || null;
        })
        .filter(Boolean) as PolkadotValidator[],
    [validators, polkadotValidators],
  );
  const redirectAddressCreator = useCallback(
    (address: string) => () => {
      const url = getAddressExplorer(getDefaultExplorerView(account.currency), address);
      if (url) Linking.openURL(url);
    },
    [account],
  );
  return (
    <>
      <HeaderRow label={field.label} value={""} />

      {mappedValidators &&
        mappedValidators.map(({ address, identity }, i) => (
          <NominationInfo
            key={address + i}
            address={address}
            identity={identity}
            onPress={redirectAddressCreator(address)}
          />
        ))}
    </>
  );
}

const Info = ({ transaction }: FieldProps) => {
  invariant(transaction.family === "polkadot", "polkadot transaction");
  const { colors } = useTheme();
  const { t } = useTranslation();

  switch (transaction.mode) {
    case "bond":
    case "unbond":
    case "rebond":
      return (
        <DataRow>
          <InfoIcon size={22} color={colors.live} />
          <LText semiBold style={[styles.text, styles.infoText]} color="live" numberOfLines={3}>
            {t(`polkadot.${transaction.mode}.steps.confirm.info`)}
          </LText>
        </DataRow>
      );

    default:
      return null;
  }
};

const EstimatedFees = ({ account, transaction }: FieldProps) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.feesWrapper,
        {
          borderColor: colors.grey,
          backgroundColor: colors.lightGrey,
        },
      ]}
    >
      <PolkadotFeeRow account={account} transaction={transaction} />
    </View>
  );
};

const Warning = (props: FieldProps) => {
  const { t } = useTranslation();
  return (
    <>
      <EstimatedFees {...props} />
      <Info {...props} />
      <Alert type="secondary">{t("polkadot.networkFees")}</Alert>
    </>
  );
};

const Footer = ({
  transaction,
  recipientWording,
}: {
  transaction: Transaction;
  recipientWording: string;
}) => (
  <>
    {["send", "nominate"].includes(transaction.mode) ? (
      <View style={styles.container}>
        <Alert type="help">{recipientWording}</Alert>
      </View>
    ) : null}
  </>
);

const fieldComponents = {
  "polkadot.validators": PolkadotValidatorsField,
  fees: null,
};
const styles = StyleSheet.create({
  text: {
    textAlign: "right",
    flex: 1,
  },
  infoText: {
    textAlign: "left",
    marginLeft: 8,
  },
  feesWrapper: {
    borderRadius: 4,
    marginVertical: 1,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderStyle: "solid",
  },
  container: {
    padding: 16,
  },
});
export default {
  fieldComponents,
  warning: Warning,
  footer: Footer,
};
