// @flow
import React, { useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { useTranslation, Trans } from "react-i18next";
import {
  getDefaultExplorerView,
  getAddressExplorer,
} from "@ledgerhq/live-common/lib/explorers";
import type { Account, OperationType } from "@ledgerhq/live-common/lib/types";
import { useMappedExtraOperationDetials } from "@ledgerhq/live-common/lib/families/cosmos/react";
import type {
  CosmosExtraTxInfo,
  CosmosMappedDelegationInfo,
} from "@ledgerhq/live-common/lib/families/cosmos/types";
import colors from "../../colors";
import LText from "../../components/LText";
import Section from "../../screens/OperationDetails/Section";

type Props = {
  extra: CosmosExtraTxInfo,
  type: OperationType,
  account: Account,
};

function OperationDetailsExtra({ extra, type, account }: Props) {
  const { t } = useTranslation();

  console.log(extra);

  const mappedExtra = useMappedExtraOperationDetials({
    extra,
    account,
  });

  switch (type) {
    case "DELEGATE":
      return (
        <OperationDetailsValidators
          account={account}
          delegations={mappedExtra.validators}
        />
      );
    case "REDELEGATE":
      return (
        <Section
          title={t("operationDetails.extra.redelegatedTo")}
          // $FlowFixMe
          value={extra.validator.address}
        />
      );
    case "UNDELEGATE":
      return (
        <Section
          title={t("operationDetails.extra.validatorAddress")}
          // $FlowFixMe
          value={extra.validator.address}
        />
      );
    case "REWARD":
    default:
      return null;
  }
}

export default {
  OperationDetailsExtra,
};

type OperationDetialsValidatorsProps = {
  account: Account,
  delegations: CosmosMappedDelegationInfo[],
};

function OperationDetailsValidators({
  account,
  delegations,
}: OperationDetialsValidatorsProps) {
  const { t } = useTranslation();

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
    <Section
      title={t("operationDetails.extra.validators", {
        number: delegations.length,
      })}
    >
      {delegations.map(({ validator, formattedAmount }, i) => (
        <View key={validator.validatorAddress + i} style={styles.wrapper}>
          <LText style={styles.greyText}>
            <Trans
              i18nKey="operationDetails.extra.validatorAddress"
              values={{
                amount: formattedAmount,
                name: validator && validator.name,
              }}
            >
              <LText semiBold style={styles.text}>
                text
              </LText>
            </Trans>
          </LText>

          <TouchableOpacity
            onPress={redirectAddressCreator(validator.validatorAddress)}
          >
            <LText style={styles.greyText}>{validator.validatorAddress}</LText>
          </TouchableOpacity>
        </View>
      ))}
    </Section>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderLeftWidth: 3,
    borderLeftColor: colors.fog,
    paddingLeft: 16,
    marginBottom: 24,
  },
  text: {
    color: colors.darkBlue,
  },
  greyText: { color: colors.grey },
});
