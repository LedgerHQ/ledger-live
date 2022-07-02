import { useNavigation } from "@react-navigation/native";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ActionRequired } from "@ledgerhq/live-common/lib/exchange/swap/types";
import { Banner } from "./Banner";

interface Props {
  actionRequired: ActionRequired;
  provider?: string;
}

export function Requirement({ actionRequired, provider }: Props) {
  if (!provider) {
    return null;
  }

  switch (Number(actionRequired)) {
    case ActionRequired.Login:
      return <LoginButton provider={provider} />;
    case ActionRequired.KYC:
    case ActionRequired.MFA:
    case ActionRequired.None:
    default:
      return null;
  }
}

export function LoginButton({ provider }: { provider: string }) {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const onPress = useCallback(() => {
    navigation.navigate("Login", { provider });
  }, [navigation, provider]);

  return (
    <Banner
      title={t("transfer.swap2.form.providers.login.complete")}
      message={t("transfer.swap2.form.providers.login.required")}
      onPress={onPress}
    />
  );
}
