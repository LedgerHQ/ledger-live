import React, { JSX } from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { TrackScreen } from "~/analytics";
import SafeAreaView from "~/components/SafeAreaView";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { AnalyticsNavigatorParamsList } from "../../types";
import AssetAllocationBanner from "./components/AssetAllocationBanner";
import FooterButton from "./components/FooterButton";
import MainGraph from "./components/MainGraph";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { ANALYTICS_PAGE } from "../../const";

type Props = StackNavigatorProps<AnalyticsNavigatorParamsList, ScreenName.Analytics>;

export default function AnalyticsMain({ route }: Props): JSX.Element {
  const { params } = route;
  const sourceScreenName = params?.sourceScreenName;

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen name={ANALYTICS_PAGE} source={sourceScreenName} />
      <Box lx={Container}>
        <Box lx={FlexContainer}>
          <MainGraph />
          <Box lx={AssetAllocationBannerContainer}>
            <AssetAllocationBanner />
          </Box>
        </Box>
        <Box lx={FooterButtonContainer}>
          <FooterButton />
        </Box>
      </Box>
    </SafeAreaView>
  );
}

const FlexContainer: LumenViewStyle = {
  flex: 1,
};

const Container: LumenViewStyle = {
  ...FlexContainer,
  flexDirection: "column",
  justifyContent: "space-between",
};

const AssetAllocationBannerContainer: LumenViewStyle = {
  marginHorizontal: "s16",
  ...FlexContainer,
};

const FooterButtonContainer: LumenViewStyle = {
  marginHorizontal: "s16",
  paddingBottom: "s16",
};
