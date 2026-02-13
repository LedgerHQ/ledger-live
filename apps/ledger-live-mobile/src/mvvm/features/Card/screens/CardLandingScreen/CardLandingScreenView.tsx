import React, { memo } from "react";
import { Image } from "react-native";
import { Box, LinearGradient, TileButton, Text } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { TrackScreen } from "~/analytics";
import type { CardLandingCta } from "../../types";
import { CARD_LANDING_TEST_IDS } from "../../testIds";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const cardImage = require("~/images/card/card-landing.webp") as number;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bgImage = require("~/images/card/card-landing-bg.webp") as number;

const GRADIENT_OVERLAY_HEIGHT = 402;

const bgImageLx: LumenViewStyle = {
  position: "absolute",
  top: "s0",
  left: "s0",
  right: "s0",
  width: "full",
};

const bgDarkOverlayLx: LumenViewStyle = {
  ...bgImageLx,
};

const bgGradientLx: LumenViewStyle = {
  position: "absolute",
  top: "s0",
  left: "s0",
  right: "s0",
  width: "full",
};

const ctasContainerStyle: LumenViewStyle = {
  flexDirection: "row",
  gap: "s8",
  width: "full",
  paddingHorizontal: "s16",
};

interface CardLandingScreenViewProps {
  readonly title: string;
  readonly subtitle: string;
  readonly ctas: readonly CardLandingCta[];
  readonly pageName: string;
  readonly topInset: number;
}

const CardLandingScreenView = ({ title, subtitle, ctas, pageName }: CardLandingScreenViewProps) => (
  <Box lx={{ flex: 1, backgroundColor: "base" }} testID={CARD_LANDING_TEST_IDS.screen}>
    <TrackScreen name={pageName} />

    <Box lx={bgImageLx} style={{ aspectRatio: 23 / 50 }} pointerEvents="none">
      <Image source={bgImage} style={{ flex: 1 }} resizeMode="cover" blurRadius={6} />
    </Box>
    <Box
      lx={bgDarkOverlayLx}
      style={{ aspectRatio: 23 / 50, backgroundColor: "rgba(0, 0, 0, 0.4)" }}
      pointerEvents="none"
    />
    <LinearGradient
      direction="to-bottom"
      stops={[
        { color: "rgba(0, 0, 0, 0)", offset: 0 },
        { color: "#000000", offset: 1 },
      ]}
      lx={bgGradientLx}
      style={{ height: GRADIENT_OVERLAY_HEIGHT }}
      pointerEvents="none"
    />

    <Box lx={{ flex: 1 }} style={{ paddingTop: 112 }}>
      <Box lx={{ paddingTop: "s56", paddingHorizontal: "s24", alignItems: "center" }}>
        <Text
          typography="heading1SemiBold"
          lx={{ color: "base", textAlign: "center" }}
          numberOfLines={2}
          adjustsFontSizeToFit
          testID={CARD_LANDING_TEST_IDS.title}
        >
          {title}
        </Text>

        <Text
          typography="body2"
          lx={{ color: "muted", textAlign: "center", marginTop: "s4" }}
          testID={CARD_LANDING_TEST_IDS.subtitle}
        >
          {subtitle}
        </Text>
      </Box>

      <Box
        lx={{ ...ctasContainerStyle, marginTop: "s56" }}
        testID={CARD_LANDING_TEST_IDS.ctas.container}
      >
        {ctas.map(cta => (
          <TileButton
            key={cta.id}
            lx={{ flex: 1 }}
            icon={cta.icon}
            onPress={cta.onPress}
            testID={cta.testID}
            accessibilityLabel={cta.label}
            isFull
          >
            {cta.label}
          </TileButton>
        ))}
      </Box>

      <Box
        lx={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingTop: "s24",
          paddingBottom: "s24",
        }}
      >
        <Image
          source={cardImage}
          style={{ width: 350, height: 350, alignSelf: "center" }}
          resizeMode="contain"
          testID={CARD_LANDING_TEST_IDS.cardImage}
        />
      </Box>
    </Box>
  </Box>
);

export default memo(CardLandingScreenView);
