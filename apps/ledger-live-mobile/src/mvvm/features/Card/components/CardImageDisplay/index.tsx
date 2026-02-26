import React, { memo } from "react";
import { Image, StyleSheet } from "react-native";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { CARD_LANDING_TEST_IDS } from "../../testIds";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const cardImage = require("~/images/card/card-landing.webp") as number;

const IMAGE_SIZE = 350;
const CARD_IMAGE_TOP_CROP = 50;

const CardImageDisplay = () => {
  return (
    <Box
      lx={{ alignItems: "center" }}
      style={{ height: IMAGE_SIZE - CARD_IMAGE_TOP_CROP, overflow: "hidden" }}
    >
      <Image
        source={cardImage}
        style={styles.cardImage}
        resizeMode="contain"
        testID={CARD_LANDING_TEST_IDS.cardImage}
      />
    </Box>
  );
};

const styles = StyleSheet.create({
  cardImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    position: "absolute",
    bottom: 0,
  },
});

export default memo(CardImageDisplay);
