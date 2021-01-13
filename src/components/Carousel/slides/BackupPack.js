// @flow

import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { Linking, Image, View, StyleSheet } from "react-native";
import getWindowDimensions from "../../../logic/getWindowDimensions";
import backupPack from "../../../images/banners/backuppack.png";
import LText from "../../LText";
import Touchable from "../../Touchable";
import { urls } from "../../../config/urls";

const BackupPack = () => {
  const slideWidth = getWindowDimensions().width - 32;
  const onClick = useCallback(() => {
    Linking.openURL(urls.banners.backupPack);
  }, []);
  return (
    <Touchable event="BackupPack Carousel" onPress={onClick}>
      <View style={[styles.wrapper, { width: slideWidth }]}>
        <Image style={styles.illustration} source={backupPack} />
        <View>
          <LText semiBold secondary style={styles.label}>
            <Trans i18nKey={`carousel.banners.backupPack.title`} />
          </LText>
          <LText primary style={styles.description}>
            <Trans i18nKey={`carousel.banners.backupPack.description`} />
          </LText>
        </View>
      </View>
    </Touchable>
  );
};

const styles = StyleSheet.create({
  illustration: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 146,
    height: 93,
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
    opacity: 0.7,
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

export default BackupPack;
