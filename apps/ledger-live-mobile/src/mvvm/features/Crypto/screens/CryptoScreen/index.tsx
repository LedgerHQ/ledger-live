import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, NavBar, NavBarBackButton, Text } from "@ledgerhq/lumen-ui-rnative";
import { LumenTextStyle, LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { ScreenName } from "~/const";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { TrackScreen } from "~/analytics";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { CryptoContent } from "../../components/CryptoContent";
import { CryptoScreenNavigator, CryptoScreenViewData } from "./types";
import useCryptoViewModel from "./useCryptoViewModel";

type Props = BaseComposite<StackNavigatorProps<CryptoScreenNavigator, ScreenName.Crypto>>;

const CryptoScreenView: React.FC<CryptoScreenViewData> = ({
  assetsToDisplay,
  onItemPress,
  isLoading,
  sourceScreenName,
  onNavigateBack,
  title,
  screenTrackingName,
}) => {
  const { top } = useSafeAreaInsets();

  return (
    <Box style={{ paddingTop: top, flex: 1 }}>
      <TrackScreen name={screenTrackingName} source={sourceScreenName} />
      <NavBar appearance="compact">
        <NavBarBackButton onPress={onNavigateBack} />
      </NavBar>
      <Box lx={titleContainerStyle}>
        <Text typography="heading3SemiBold" lx={titleTextStyle}>
          {title}
        </Text>
      </Box>
      <CryptoContent
        isLoading={isLoading}
        assetsToDisplay={assetsToDisplay}
        onItemPress={onItemPress}
      />
    </Box>
  );
};

const CryptoScreen = ({ route }: Props) => {
  const { params } = route;
  const viewModel = useCryptoViewModel({
    sourceScreenName: params?.sourceScreenName,
    variant: params?.variant,
  });

  return <CryptoScreenView {...viewModel} />;
};

export default withDiscreetMode(CryptoScreen);

const titleContainerStyle: LumenViewStyle = {
  paddingHorizontal: "s16",
  paddingBottom: "s12",
};

const titleTextStyle: LumenTextStyle = {
  color: "base",
};
