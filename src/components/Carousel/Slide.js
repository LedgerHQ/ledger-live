// @flow

import React, { useCallback } from "react";
import { Linking, Image, View, StyleSheet } from "react-native";
import getWindowDimensions from "../../logic/getWindowDimensions";
import LText from "../LText";
import Touchable from "../Touchable";

type PropType = {
  url: string,
  name: string,
  title: *,
  description: *,
  image: *,
  position: *,
};

const Slide = ({
  url,
  name,
  title,
  description,
  image,
  position,
}: PropType) => {
  const slideWidth = getWindowDimensions().width - 32;
  const onClick = useCallback(() => {
    Linking.openURL(url);
  }, [url]);
  return (
    <Touchable event={`${name} Carousel`} onPress={onClick}>
      <View style={[styles.wrapper, { width: slideWidth }]}>
        <Image style={[{ position: "absolute" }, position]} source={image} />
        <View>
          <LText semiBold secondary style={styles.label}>
            {title}
          </LText>
          <LText primary style={styles.description}>
            {description}
          </LText>
        </View>
      </View>
    </Touchable>
  );
};

const styles = StyleSheet.create({
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

export default Slide;
