import React, { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { ActionRequired } from "@ledgerhq/live-common/exchange/swap/types";
import { useTranslation } from "react-i18next";
import { Banner } from "../Banner";

interface Props {
  required: ActionRequired;
  provider?: string;
}

export function RequirementBanner({ provider, required }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const onPress = useCallback(() => {
    if (provider) {
      navigation.navigate(required, { provider });
    }
  }, [navigation, provider, required]);

  const key = useMemo(() => required.toString().toLowerCase(), [required]);

  return (
    <Banner
      message={t(`transfer.swap2.form.providers.${key}.required`)}
      cta={t(`transfer.swap2.form.providers.${key}.complete`)}
      onPress={onPress}
    />
  );
}
