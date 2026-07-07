import React from "react";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { PtxNavigatorParamList } from "~/components/RootNavigator/types/PtxNavigator";
import { NavigatorName, ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { PtxScreen } from "~/screens/PTX";
import { CARD_APP_ID } from "../../constants";
import { BackConfig } from "~/components/WebPTXPlayer";
type CardLiveAppScreenProps = StackNavigatorProps<PtxNavigatorParamList, ScreenName.Card>;

export function CardLiveAppScreen(props: CardLiveAppScreenProps) {
  const { t } = useTranslation();
  const { goToURL, lastScreen, platform, path, referrer } = props.route.params || {};
  const config: BackConfig =
    platform === CARD_APP_ID
      ? {
          screen: ScreenName.Card,
          btnText: t("browseWeb3.webPlatformPlayer.back.card"),
        }
      : {
          screen: NavigatorName.CardTab,
          btnText: t("browseWeb3.webPlatformPlayer.back.cardTab"),
        };

  return (
    <PtxScreen
      {...props}
      config={config}
      route={{
        ...props.route,
        params: {
          goToURL,
          lastScreen,
          platform: platform || CARD_APP_ID,
          path,
          referrer,
        },
      }}
    />
  );
}
