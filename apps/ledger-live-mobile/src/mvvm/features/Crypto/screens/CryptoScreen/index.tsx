import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { ScreenName } from "~/const";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { TrackScreen } from "~/analytics";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { CryptoContent } from "../../components/CryptoContent";
import { CryptoScreenNavigator, CryptoScreenViewData, CryptoVariant } from "./types";
import useCryptoViewModel from "./useCryptoViewModel";

type Props = BaseComposite<StackNavigatorProps<CryptoScreenNavigator, ScreenName.Crypto>>;

const LIST_TEST_ID_BY_VARIANT: Record<CryptoVariant, string> = {
  stablecoin: "StablecoinList",
  crypto: "CryptoList",
  all: "CryptoList",
};

const CryptoScreenView: React.FC<CryptoScreenViewData> = ({
  assetsToDisplay,
  onItemPress,
  isLoading,
  error,
  sourceScreenName,
  trackingType,
  variant,
}) => {
  return (
    <Box style={{ flex: 1 }}>
      <TrackScreen name="Assets" source={sourceScreenName} type={trackingType} />
      <CryptoContent
        isLoading={isLoading}
        error={error}
        assetsToDisplay={assetsToDisplay}
        onItemPress={onItemPress}
        listTestID={LIST_TEST_ID_BY_VARIANT[variant]}
      />
    </Box>
  );
};

const CryptoScreen = ({ route }: Props) => {
  const { params } = route;
  const viewModel = useCryptoViewModel({
    sourceScreenName: params.sourceScreenName,
    variant: params.variant,
  });

  return <CryptoScreenView {...viewModel} />;
};

export default withDiscreetMode(CryptoScreen);
