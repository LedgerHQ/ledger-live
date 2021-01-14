// @flow

import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { Image, View, StyleSheet } from "react-native";
import getWindowDimensions from "../../../logic/getWindowDimensions";
import sell from "../../../images/banners/sell.png";
import LText from "../../LText";
import Touchable from "../../Touchable";

const Sell = () => {
  const slideWidth = getWindowDimensions().width - 32;

  const onClick = useCallback(
    () => {}, // TODO Add implementation when Sell reaches LLM
    [],
  );

  return (
    <Touchable event="Sell Carousel" onPress={onClick}>
      <View style={[styles.wrapper, { width: slideWidth }]}>
        <Image style={styles.illustration} source={sell} />
        <View>
          <LText semiBold secondary style={styles.label}>
            <Trans i18nKey={`carousel.banners.sell.title`} />
          </LText>
          <LText primary style={styles.description}>
            <Trans i18nKey={`carousel.banners.sell.description`} />
          </LText>
        </View>
      </View>
    </Touchable>
  );
};

const styles = StyleSheet.create({
  illustration: {
    position: "absolute",
    bottom: -10,
    right: 0,
    width: 120,
    height: 100,
  },
  wrapper: {
    width: "100%",
    height: 100,
    padding: 16,
    paddingBottom: 0,
    position: "relative",
  },
  buttonWrapper: {
    display: "flex",
    flexDirection: "row",
  },
  button: {
    marginBottom: 16,
  },
  label: {
    textTransform: "uppercase",
    letterSpacing: 1,
    opacity: 0.5,
    fontSize: 10,
    lineHeight: 15,
    marginRight: 100,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 16,
    marginRight: 100,
  },
  layer: {
    position: "absolute",
  },
});

export default Sell;
