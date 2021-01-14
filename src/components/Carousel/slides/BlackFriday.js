// @flow

import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import {
  Linking,
  Image,
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import getWindowDimensions from "../../../logic/getWindowDimensions";
import blackfriday from "../../../images/banners/blackfriday.png";
import LText from "../../LText";
import { urls } from "../../../config/urls";

const Blackfriday = () => {
  const slideWidth = getWindowDimensions().width - 32;
  const onClick = useCallback(() => {
    Linking.openURL(urls.banners.blackfriday);
  }, []);
  return (
    <TouchableOpacity onPress={onClick}>
      <View style={[styles.wrapper, { width: slideWidth }]}>
        <Image style={styles.illustration} source={blackfriday} />
        <View>
          <LText semiBold secondary style={styles.label}>
            <Trans i18nKey={`carousel.banners.blackfriday.title`} />
          </LText>
          <LText primary style={styles.description}>
            <Trans i18nKey={`carousel.banners.blackfriday.description`} />
          </LText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  illustration: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 127,
    height: 88,
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

export default Blackfriday;
