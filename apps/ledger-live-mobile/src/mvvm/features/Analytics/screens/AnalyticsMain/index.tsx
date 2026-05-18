import React, { JSX } from "react";
import { ScrollView } from "react-native";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { TrackScreen } from "~/analytics";
import SafeAreaView from "~/components/SafeAreaView";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { AnalyticsNavigatorParamsList } from "../../types";
import AssetAllocationBanner from "./components/AssetAllocationBanner";
import FooterButton from "./components/FooterButton";
import MainGraph from "./components/MainGraph";
import PnlSection from "./components/PnlSection";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { ANALYTICS_PAGE } from "../../const";
import useAnalyticsMainViewModel from "./useAnalyticsMainViewModel";

type Props = StackNavigatorProps<AnalyticsNavigatorParamsList, ScreenName.Analytics>;

export default function AnalyticsMain({ route }: Props): JSX.Element {
  const { params } = route;
  const sourceScreenName = params?.sourceScreenName;
  const { isExchangeEnabled } = useAnalyticsMainViewModel();

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen name={ANALYTICS_PAGE} source={sourceScreenName} />
      <Box lx={Container}>
        <ScrollView style={scrollViewStyle} contentContainerStyle={scrollViewContentStyle}>
          <Box lx={ContentContainer}>
            <MainGraph />
            <PnlSection />
            <Box lx={AssetAllocationBannerContainer}>
              <AssetAllocationBanner />
            </Box>
          </Box>
        </ScrollView>
        {isExchangeEnabled && (
          <Box lx={FooterButtonContainer}>
            <FooterButton />
          </Box>
        )}
      </Box>
    </SafeAreaView>
  );
}

const scrollViewStyle = { flex: 1 } as const;
const scrollViewContentStyle = { flexGrow: 1 } as const;

const FlexContainer: LumenViewStyle = {
  flex: 1,
};

const Container: LumenViewStyle = {
  ...FlexContainer,
  flexDirection: "column",
};

const ContentContainer: LumenViewStyle = {
  ...FlexContainer,
  flexDirection: "column",
  gap: "s16",
};

const AssetAllocationBannerContainer: LumenViewStyle = {
  ...FlexContainer,
  marginHorizontal: "s16",
};

const FooterButtonContainer: LumenViewStyle = {
  marginHorizontal: "s16",
  paddingBottom: "s16",
};
