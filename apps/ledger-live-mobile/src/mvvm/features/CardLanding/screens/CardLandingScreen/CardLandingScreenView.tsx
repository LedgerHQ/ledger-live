import React, { memo } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Box, TileButton, Text } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import LinearGradient from "react-native-linear-gradient";
import { TrackScreen } from "~/analytics";
import type { CardLandingCta } from "../../types";
import { CARD_LANDING_TEST_IDS } from "../../testIds";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const cardImage = require("~/images/card/card-landing.webp") as number;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bgImage = require("~/images/card/card-landing-bg.webp") as number;

// Height of the gradient overlay that fades from transparent at the top to black
const GRADIENT_OVERLAY_HEIGHT = 402;

interface CardLandingScreenViewProps {
  readonly title: string;
  readonly subtitle: string;
  readonly ctas: readonly CardLandingCta[];
  readonly pageName: string;
  readonly topInset: number;
}

// CTAs container
const ctasContainerStyle: LumenViewStyle = {
  flexDirection: "row",
  gap: "s8",
  width: "full",
  paddingHorizontal: "s16",
};

const CardLandingScreenView = ({
  title,
  subtitle,
  ctas,
  pageName,
  topInset,
}: CardLandingScreenViewProps) => {
  const contentStyle = [styles.content, { paddingTop: topInset }];

  return (
    <View style={styles.root} testID={CARD_LANDING_TEST_IDS.screen}>
      <TrackScreen name={pageName} />

      {/* Background image — full width, blurred, darkened */}
      <Image source={bgImage} style={styles.bgImage} resizeMode="cover" blurRadius={6} />
      {/* Dark overlay to tone down the image */}
      <View style={styles.bgDarkOverlay} />
      {/* Gradient overlay — fades to black */}
      <LinearGradient
        colors={["rgba(0, 0, 0, 0)", "#000000"]}
        locations={[0, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bgGradient}
      />

      {/* Content — positioned below transparent header */}
      <View style={contentStyle}>
        {/* Title and subtitle */}
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

        {/* CTAs */}
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

        {/* Card image — positioned with fixed spacing */}
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
            style={styles.cardImage}
            resizeMode="contain"
            testID={CARD_LANDING_TEST_IDS.cardImage}
          />
        </Box>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  bgImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    aspectRatio: 23 / 50,
    width: "100%",
  },
  bgDarkOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    aspectRatio: 23 / 50,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  bgGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: GRADIENT_OVERLAY_HEIGHT,
  },
  content: {
    flex: 1,
  },
  cardImage: {
    width: 350,
    height: 350,
    alignSelf: "center",
  },
});

export default memo(CardLandingScreenView);
