import React, { memo } from "react";
import { Image, StyleSheet } from "react-native";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { CARD_LANDING_TEST_IDS } from "../../testIds";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const cardImage = require("~/images/card/card-landing.webp") as number;

const CardImageDisplay = () => {
  return (
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
  );
};

const styles = StyleSheet.create({
  cardImage: {
    width: 350,
    height: 350,
    alignSelf: "center",
  },
});

export default memo(CardImageDisplay);
