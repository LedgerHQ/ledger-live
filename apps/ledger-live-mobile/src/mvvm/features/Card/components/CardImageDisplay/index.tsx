import React, { memo } from "react";
import { Image, StyleSheet } from "react-native";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { CARD_LANDING_TEST_IDS } from "../../testIds";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const cardImage = require("~/images/card/card-landing.webp");

const CardImageDisplay = () => {
  return (
    <Box lx={{ alignItems: "center", justifyContent: "flex-start", flex: 1 }}>
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
    flex: 1,
    width: "100%",
    height: "100%",
  },
});

export default memo(CardImageDisplay);
