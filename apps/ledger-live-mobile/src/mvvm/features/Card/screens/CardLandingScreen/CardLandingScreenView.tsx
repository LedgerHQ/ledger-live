import React, { memo } from "react";
import { ImageBackground, ImageSourcePropType } from "react-native";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import SafeAreaView from "~/components/SafeAreaView";
import { TrackScreen } from "~/analytics";
import { ScreenHeroSectionView } from "LLM/components/ScreenHeroSection/ScreenHeroSectionView";
import type { CardLandingCta } from "../../types";
import { CARD_LANDING_TEST_IDS } from "../../testIds";
import CardTitle from "../../components/CardTitle";
import CardActions from "../../components/CardActions";
import CardImageDisplay from "../../components/CardImageDisplay";

interface CardLandingScreenViewProps {
  readonly title: string;
  readonly subtitle: string;
  readonly ctas: readonly CardLandingCta[];
  readonly pageName: string;
  readonly topInset: number;
  readonly bottomInset: number;
  readonly backgroundColor: string;
  readonly imageLoaded: boolean;
  readonly onImageLoaded: () => void;
  readonly backgroundImageSource: ImageSourcePropType;
}

const CardLandingScreenView = ({
  title,
  subtitle,
  ctas,
  pageName,
  topInset,
  bottomInset,
  backgroundColor,
  imageLoaded,
  onImageLoaded,
  backgroundImageSource,
}: CardLandingScreenViewProps) => {
  return (
    <SafeAreaView isFlex style={{ backgroundColor }} testID={CARD_LANDING_TEST_IDS.screen}>
      <TrackScreen name={pageName} />
      <Box
        style={{
          position: "absolute",
          width: "100%",
          height: 500,
          top: 0,
          left: 0,
        }}
      >
        <ImageBackground
          source={backgroundImageSource}
          style={{ width: "100%", height: "100%" }}
          onLoad={onImageLoaded}
          fadeDuration={imageLoaded ? 0 : 300}
        />
      </Box>

      <Box style={{ flex: 1, paddingTop: topInset }}>
        <ScreenHeroSectionView ctas={<CardActions ctas={ctas} />}>
          <CardTitle title={title} subtitle={subtitle} />
        </ScreenHeroSectionView>

        <Box
          style={{
            paddingBottom: bottomInset,
            marginLeft: 16,
            marginRight: 16,
            flex: 1,
            height: "100%",
          }}
        >
          <CardImageDisplay />
        </Box>
      </Box>
    </SafeAreaView>
  );
};

export default memo(CardLandingScreenView);
