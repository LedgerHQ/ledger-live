import React from "react";
import { StyleSheet } from "react-native";
import { Trans, useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { findTokenByAddress } from "@ledgerhq/live-common/currencies/index";
import { getTransactionExplorer, isValidExtra } from "@ledgerhq/live-common/families/hedera/logic";
import type { HederaAccount, HederaOperation } from "@ledgerhq/live-common/families/hedera/types";
import type { OperationType } from "@ledgerhq/types-live";
import { Text } from "@ledgerhq/native-ui";
import Alert from "~/components/Alert";
import { NavigatorName, ScreenName } from "~/const";
import Section from "~/screens/OperationDetails/Section";
import { urls } from "~/utils/urls";

interface OperationDetailsPostAccountSectionProps {
  operation: HederaOperation;
  type: OperationType;
  account: HederaAccount;
}

function OperationDetailsPostAccountSection({
  operation,
}: OperationDetailsPostAccountSectionProps) {
  const { t } = useTranslation();

  if (operation.type !== "ASSOCIATE_TOKEN") {
    return null;
  }

  const token = operation.extra.associatedTokenId
    ? findTokenByAddress(operation.extra.associatedTokenId)
    : null;

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
  type: OperationType;
}

function OperationDetailsPostAlert({ account, operation }: OperationDetailsExtraProps) {
  const navigation = useNavigation();

  if (operation.type !== "ASSOCIATE_TOKEN") {
    return null;
  }

  const extra = isValidExtra(operation.extra) ? operation.extra : null;
  const associatedTokenId = extra?.associatedTokenId;
  const token = associatedTokenId ? findTokenByAddress(associatedTokenId) : null;

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
