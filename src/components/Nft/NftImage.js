// @flow

import React, { useCallback, useRef, useState } from "react";

import FastImage from "react-native-fast-image";
import { useTheme } from "@react-navigation/native";
import { Image, View, StyleSheet, Animated, Platform } from "react-native";
import ImageNotFoundIcon from "../../icons/ImageNotFound";
import Skeleton from "../Skeleton";

const ImageComponent = ({
  style,
  source,
  resizeMode,
  onLoadEnd,
}: {
  style: Object,
  source: { [string]: string },
  resizeMode: string,
  onLoadEnd: () => *,
}) =>
  Platform.OS === "android" ? (
    <Image
      style={style}
      resizeMode={resizeMode}
      source={source}
      onLoadEnd={onLoadEnd}
    />
  ) : (
    <FastImage
      style={style}
      resizeMode={FastImage.resizeMode[resizeMode]}
      source={source}
      onLoadEnd={onLoadEnd}
    />
  );

const NotFound = ({
  colors,
  onLayout,
}: {
  colors: Object,
  onLayout: () => *,
}) => {
  const [iconWidth, setIconWidth] = useState(40);

  return (
    <View
      style={[
        styles.notFoundView,
        {
          backgroundColor: colors.skeletonBg,
        },
      ]}
      onLayout={e => {
        setIconWidth(Math.min(e.nativeEvent.layout.width * 0.4, 40));
        onLayout?.();
      }}
    >
      <ImageNotFoundIcon width={iconWidth} height={iconWidth} />
    </View>
  );
};

type Props = {
  style?: Object,
  status: string,
  src: string,
  hackWidth?: number,
};

const NftImage = ({ src, status, style, hackWidth = 90 }: Props) => {
  const { colors } = useTheme();
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [loadError, setLoadError] = useState(null);

  const startAnimation = useCallback(() => {
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const hackSrc = (() => {
    const isPreProcessedSrc = /^https:\/\/lh3.googleusercontent.com\/.*/g;
    return isPreProcessedSrc.test(src) ? `${src}=s${hackWidth}` : src;
  })();

  return (
    <View style={[style, styles.root]}>
      <Skeleton style={styles.skeleton} loading={true} />
      <Animated.View
        style={[
          styles.imageContainer,
          {
            opacity: opacityAnim,
          },
        ]}
      >
        {status === "nodata" ||
        status === "error" ||
        (status === "loaded" && !src) ||
        loadError ? (
          <NotFound colors={colors} onLayout={startAnimation} />
        ) : (
          <ImageComponent
            style={[
              styles.image,
              {
                backgroundColor: colors.white,
              },
            ]}
            resizeMode="cover"
            source={{
              uri: hackSrc,
            }}
            onLoadEnd={startAnimation}
            onError={() => setLoadError(true)}
          />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    position: "relative",
  },
  skeleton: {
    position: "absolute",
    zIndex: -1,
    height: "100%",
    width: "100%",
  },
  imageContainer: {
    zIndex: 1,
    flex: 1,
  },
  image: {
    flex: 1,
  },
  notFoundView: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default NftImage;
