import React from "react";
import { StyleSheet } from "react-native";
import { Trans, useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { getTransactionExplorer, isValidExtra } from "@ledgerhq/live-common/families/hedera/utils";
import type { HederaAccount, HederaOperation } from "@ledgerhq/live-common/families/hedera/types";
import { Text } from "@ledgerhq/native-ui";
import Alert from "~/components/Alert";
import { NavigatorName, ScreenName } from "~/const";
import Section from "~/screens/OperationDetails/Section";
import { urls } from "~/utils/urls";
import { cryptoAssetsHooks } from "~/config/bridge-setup";

interface OperationDetailsPostAccountSectionProps {
  operation: HederaOperation;
}

function OperationDetailsPostAccountSection({
  operation,
}: Readonly<OperationDetailsPostAccountSectionProps>) {
  const { t } = useTranslation();

  if (operation.type !== "ASSOCIATE_TOKEN") {
    return null;
  }

  const { token } = cryptoAssetsHooks.useTokenByAddressInCurrency(
    operation.extra.associatedTokenId || "",
    "hedera",
  );

  if (!token) {
    return null;
  }

  return (
    <Section
      title={t("hedera.operationDetails.postAccountSection")}
      value={`${token.contractAddress} (${token.name})`}
    />
  );
}

interface OperationDetailsExtraProps {
  operation: HederaOperation;
  account: HederaAccount;
}

function OperationDetailsPostAlert({ account, operation }: Readonly<OperationDetailsExtraProps>) {
  const navigation = useNavigation();

  if (operation.type !== "ASSOCIATE_TOKEN") {
    return null;
  }

  const extra = isValidExtra(operation.extra) ? operation.extra : null;
  const associatedTokenId = extra?.associatedTokenId;

  const { token } = cryptoAssetsHooks.useTokenByAddressInCurrency(
    associatedTokenId || "",
    "hedera",
  );

  if (!token) {
    return null;
  }

  const goToReceive = () => {
    const subAccount = account.subAccounts?.find(
      a => a.token.contractAddress === token.contractAddress,
    );

    if (!subAccount) return;

    navigation.navigate(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveConfirmation,
      params: {
        currency: subAccount.token,
        accountId: subAccount.id,
        parentId: subAccount.parentId,
      },
    });
  };

  return (
    <Alert
      type="primary"
      learnMoreUrl={urls.hedera.tokenAssociation}
      learnMoreKey="hedera.operationDetails.postAlert.learnMore"
    >
      <Trans i18nKey="hedera.operationDetails.postAlert.text">
        <Text
          onPress={goToReceive}
          style={styles.textUnderline}
          variant="bodyLineHeight"
          fontWeight="semiBold"
        />
      </Trans>
    </Alert>
  );
}

const styles = StyleSheet.create({
  textUnderline: {
    textDecorationLine: "underline",
  },
});

export default {
  OperationDetailsPostAccountSection,
  OperationDetailsPostAlert,
  getTransactionExplorer,
};
