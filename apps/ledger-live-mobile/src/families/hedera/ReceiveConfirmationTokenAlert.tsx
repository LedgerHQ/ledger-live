import React from "react";
import { Trans } from "react-i18next";
import { StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { Text } from "@ledgerhq/native-ui";
import { isTokenAccount, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import {
  isAutoTokenAssociationEnabled,
  isTokenAssociationRequired,
} from "@ledgerhq/live-common/families/hedera/utils";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { track } from "~/analytics";
import Alert from "~/components/Alert";
import { NavigatorName, ScreenName } from "~/const";
import { urls } from "~/utils/urls";

interface Props {
  account: AccountLike;
  mainAccount: Account;
  token?: TokenCurrency;
}

function shouldShowTokenAssociationAlert({ account, mainAccount, token }: Props) {
  const isNotTokenAccount = !isTokenAccount(account);
  const isAutoAssociationDisabled = !isAutoTokenAssociationEnabled(mainAccount);
  const isNotAssociated = token ? isTokenAssociationRequired(account, token) : true;

  return isNotTokenAccount && isAutoAssociationDisabled && isNotAssociated;
}

export default function ReceiveConfirmationTokenAlert(props: Readonly<Props>) {
  const { account } = props;
  const navigation = useNavigation();
  const currency = getAccountCurrency(account);
  const showTokenAssociationAlert = shouldShowTokenAssociationAlert(props);

  function onAssociationClickHere() {
    track("button_clicked", {
      currency,
      button: "Click here to start the token association flow",
      page: ScreenName.ReceiveConfirmation,
    });

    navigation.navigate(NavigatorName.HederaAssociateTokenFlow, {
      screen: ScreenName.HederaAssociateTokenSelectToken,
      params: {
        accountId: account.id,
      },
    });
  }

  if (!showTokenAssociationAlert) {
    return null;
  }

  return (
    <Alert
      type="primary"
      learnMoreUrl={urls.hedera.tokenAssociation}
      learnMoreKey="hedera.receive.warnings.associationPrerequisite.learnMore"
    >
      <Trans i18nKey="hedera.receive.warnings.associationPrerequisite.text">
        <Text
          onPress={onAssociationClickHere}
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
