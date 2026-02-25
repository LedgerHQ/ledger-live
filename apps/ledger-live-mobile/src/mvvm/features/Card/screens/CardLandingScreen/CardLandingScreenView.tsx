import React, { memo } from "react";
import { ImageBackground } from "react-native";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import LinearGradient from "react-native-linear-gradient";
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
  readonly backgroundColor: string;
  readonly isWallet40DarkMode: boolean;
  readonly imageLoaded: boolean;
  readonly onImageLoaded: () => void;
}

const CardLandingScreenView = ({
  title,
  subtitle,
  ctas,
  pageName,
  topInset,
  backgroundColor,
  isWallet40DarkMode,
  imageLoaded,
  onImageLoaded,
}: CardLandingScreenViewProps) => {
  return (
    <SafeAreaView isFlex style={{ backgroundColor }} testID={CARD_LANDING_TEST_IDS.screen}>
      <TrackScreen name={pageName} />

      {isWallet40DarkMode && (
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
            source={require("~/images/portfolio/v4-dark.webp")}
            style={{ width: "100%", height: "100%" }}
            onLoad={onImageLoaded}
            fadeDuration={imageLoaded ? 0 : 300}
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.6)", "#000000"]}
            locations={[0, 0.5, 0.85]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              top: 0,
              left: 0,
            }}
          />
        </Box>
      )}

      <Box style={{ paddingTop: topInset }}>
        <ScreenHeroSectionView ctas={<CardActions ctas={ctas} />}>
          <CardTitle title={title} subtitle={subtitle} />
        </ScreenHeroSectionView>

        <CardImageDisplay />
      </Box>
    </SafeAreaView>
  );
};

export default memo(CardLandingScreenView);
