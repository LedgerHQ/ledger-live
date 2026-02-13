import React from "react";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { PtxNavigatorParamList } from "~/components/RootNavigator/types/PtxNavigator";
import { NavigatorName, ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { PtxScreen } from "~/screens/PTX";
import { CARD_APP_ID } from "../../constants";

type CardLiveAppScreenProps = StackNavigatorProps<PtxNavigatorParamList, ScreenName.Card>;

export function CardLiveAppScreen(props: CardLiveAppScreenProps) {
  const { t } = useTranslation();
  const { goToURL, lastScreen, platform, referrer } = props.route.params || {};
  return (
    <PtxScreen
      {...props}
      config={{
        screen: ScreenName.Card,
        navigator: NavigatorName.Card,
        btnText: t("browseWeb3.webPlatformPlayer.back.card"),
      }}
      route={{
        ...props.route,
        params: {
          goToURL,
          lastScreen,
          platform: platform || CARD_APP_ID,
          referrer,
        },
      }}
    />
  );
}
