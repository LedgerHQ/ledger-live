import React, { useCallback } from "react";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { NavigatorName, ScreenName } from "~/const";
import type { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import FloatingDebugButton from "~/components/FloatingDebugButton";

const AssetDetailFab = () => {
  const enabled = useEnv("DEBUG_ASSET_DETAIL_FAB");
  const navigation = useNavigation<BaseNavigation>();

  const onPress = useCallback(() => {
    navigation.navigate(NavigatorName.AssetDetail, {
      screen: ScreenName.AssetDetail,
      params: { currencyId: "bitcoin" },
    });
  }, [navigation]);

  if (!enabled) return null;

  return <FloatingDebugButton onPress={onPress} Icon={IconsLegacy.CoinsMedium} />;
};

export default AssetDetailFab;
