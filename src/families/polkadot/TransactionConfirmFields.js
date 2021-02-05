// @flow
import invariant from "invariant";
import React, { useMemo, useCallback } from "react";
import { StyleSheet, Linking, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { Account } from "@ledgerhq/live-common/lib/types";
import type { Transaction } from "@ledgerhq/live-common/lib/families/polkadot/types";
import { usePolkadotPreloadData } from "@ledgerhq/live-common/lib/families/polkadot/react";
import {
  getDefaultExplorerView,
  getAddressExplorer,
} from "@ledgerhq/live-common/lib/explorers";

import { useTheme } from "@react-navigation/native";
import LText from "../../components/LText";
import { DataRow, HeaderRow } from "../../components/ValidateOnDeviceDataRow";
import InfoIcon from "../../icons/Info";

import NominationInfo from "./components/NominationInfo";
import PolkadotFeeRow from "./SendRowsFee";

type FieldProps = {
  account: Account,
  transaction: Transaction,
  field: {
    type: string,
    label: string,
  },
};

function PolkadotValidatorsField({ account, transaction, field }: FieldProps) {
  const { validators: polkadotValidators } = usePolkadotPreloadData();

  const validators = transaction.validators;

  const mappedValidators = useMemo(
    () =>
      (validators || [])
        .map(address => polkadotValidators.find(v => v.address === address))
        .filter(Boolean),
    [validators, polkadotValidators],
  );

  const redirectAddressCreator = useCallback(
    address => () => {
      const url = getAddressExplorer(
        getDefaultExplorerView(account.currency),
        address,
      );
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
          <LText
            semiBold
            style={[styles.text, styles.infoText]}
            color="live"
            numberOfLines={3}
          >
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
        { borderColor: colors.grey, backgroundColor: colors.lightGrey },
      ]}
    >
      <PolkadotFeeRow account={account} transaction={transaction} />
    </View>
  );
};

const Warning = (props: FieldProps) => (
  <>
    <EstimatedFees {...props} />
    <Info {...props} />
  </>
);

const fieldComponents = {
  "polkadot.validators": PolkadotValidatorsField,
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
});

export default {
  fieldComponents,
  warning: Warning,
};
