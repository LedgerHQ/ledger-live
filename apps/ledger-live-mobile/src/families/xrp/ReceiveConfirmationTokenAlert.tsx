import React from "react";
import { useNavigation } from "@react-navigation/native";
import type { ParamListBase } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { Banner, Button } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { findHeldTokenAccount, navigateToAddToken } from "./utils";

type Props = Readonly<{
  account: AccountLike;
  mainAccount: Account;
  token: TokenCurrency;
}>;

export default function ReceiveConfirmationTokenAlert({ mainAccount, token }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  const enabledStandards: string[] = getXrpEnabledTokenStandards(mainAccount.currency.id);
  const isEnabled = enabledStandards.includes(token.tokenType);
  if (!isEnabled || findHeldTokenAccount(mainAccount, token)) return null;

  return (
    <Banner
      appearance="info"
      title={t("xrp.addToken.receiveAlert")}
      primaryAction={
        <Button
          appearance="accent"
          size="sm"
          onPress={() => navigateToAddToken(navigation, mainAccount.id, token)}
          testID="xrp-receive-add-token"
        >
          {t("xrp.addToken.cta")}
        </Button>
      }
      testID="xrp-receive-add-token-alert"
    />
  );
}
