import React, { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import { Trans, useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { findTokenByAddress } from "@ledgerhq/live-common/currencies/index";
import { getTransactionExplorer, isValidExtra } from "@ledgerhq/live-common/families/hedera/logic";
import type { HederaAccount, HederaOperation } from "@ledgerhq/live-common/families/hedera/types";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
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
  const [token, setToken] = useState<TokenCurrency | null>(null);

  useEffect(() => {
    if (operation.type !== "ASSOCIATE_TOKEN" || !operation.extra.associatedTokenId) {
      return;
    }

    async function loadToken() {
      try {
        const foundToken = await findTokenByAddress(operation.extra.associatedTokenId!);
        if (foundToken) {
          setToken(foundToken);
        }
      } catch (error) {
        console.error("Failed to load token:", error);
      }
    }
    loadToken();
  }, [operation.extra.associatedTokenId, operation.type]);

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
  const [token, setToken] = useState<TokenCurrency | null>(null);

  useEffect(() => {
    if (operation.type !== "ASSOCIATE_TOKEN") {
      return;
    }

    const extra = isValidExtra(operation.extra) ? operation.extra : null;
    const associatedTokenId = extra?.associatedTokenId;

    if (!associatedTokenId) {
      return;
    }

    async function loadToken() {
      try {
        const foundToken = await findTokenByAddress(associatedTokenId!);
        if (foundToken) {
          setToken(foundToken);
        }
      } catch (error) {
        console.error("Failed to load token:", error);
      }
    }
    loadToken();
  }, [operation.extra, operation.type]);

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
