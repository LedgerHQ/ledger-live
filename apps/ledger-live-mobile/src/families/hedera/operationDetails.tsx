import React from "react";
import { StyleSheet } from "react-native";
import { Trans, useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { getTransactionExplorer, isValidExtra } from "@ledgerhq/live-common/families/hedera/logic";
import type { HederaAccount, HederaOperation } from "@ledgerhq/live-common/families/hedera/types";
import { useTokenByAddress } from "@ledgerhq/live-common/hooks";
import { Text } from "@ledgerhq/native-ui";
import Alert from "~/components/Alert";
import { NavigatorName, ScreenName } from "~/const";
import Section from "~/screens/OperationDetails/Section";
import { urls } from "~/utils/urls";

interface OperationDetailsPostAccountSectionProps {
  operation: HederaOperation;
}

function OperationDetailsPostAccountSection({
  operation,
}: Readonly<OperationDetailsPostAccountSectionProps>) {
  const { t } = useTranslation();
  const associatedTokenId = operation.extra.associatedTokenId;
  const token = useTokenByAddress(
    operation.type === "ASSOCIATE_TOKEN" ? associatedTokenId : undefined,
    "hedera",
  );

  if (operation.type !== "ASSOCIATE_TOKEN" || !token) {
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
  const extra =
    operation.type === "ASSOCIATE_TOKEN" && isValidExtra(operation.extra) ? operation.extra : null;
  const token = useTokenByAddress(extra?.associatedTokenId, "hedera");

  if (operation.type !== "ASSOCIATE_TOKEN" || !token) {
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
