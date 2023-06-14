import React, { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Banner } from "../Banner";
import { StackNavigatorNavigation } from "../../../../components/RootNavigator/types/helpers";
import { SwapNavigatorParamList } from "../../../../components/RootNavigator/types/SwapNavigator";
import { ScreenName } from "../../../../const";
import { useAnalytics } from "../../../../analytics";
import { sharedSwapTracking } from "../../utils";

interface Props {
  required: ScreenName.SwapLogin | ScreenName.SwapKYC | ScreenName.SwapMFA;
  provider?: string;
}

export function RequirementBanner({ provider, required }: Props) {
  const { t } = useTranslation();
  const { track } = useAnalytics();
  const navigation = useNavigation<StackNavigatorNavigation<SwapNavigatorParamList>>();

  const onPress = useCallback(() => {
    if (provider) {
      track("button_clicked", {
        ...sharedSwapTracking,
        provider,
        button: required,
      });
      navigation.navigate(required, { provider });
    }
  }, [navigation, provider, required, track]);

  const key = useMemo(() => required.toString().toLowerCase(), [required]);

  return (
    <Banner
      message={t(`transfer.swap2.form.providers.${key}.required`)}
      cta={t(`transfer.swap2.form.providers.${key}.complete`)}
      onPress={onPress}
    />
  );
}
