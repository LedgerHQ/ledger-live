// @flow

import React, { useState } from "react";

import FastImage from "react-native-fast-image";
import { Image, View, StyleSheet, Animated } from "react-native";
import ImageNotFoundIcon from "../../icons/ImageNotFound";
import { withTheme } from "../../colors";
import Skeleton from "../Skeleton";

const ImageComponent = ({
  style,
  source,
  resizeMode,
  onLoadEnd,
  onLoad,
}: {
  style: Object,
  source: { [string]: string },
  resizeMode: string,
  onLoadEnd: () => *,
  onLoad: () => *,
}) => (
  <FastImage
    style={style}
    resizeMode={FastImage.resizeMode[resizeMode]}
    source={source}
    onLoad={onLoad}
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
  colors: any,
};

type State = {
  loadError: boolean,
};

class NftImage extends React.PureComponent<Props, State> {
  state = {
    loadError: false,
  };

  opacityAnim = new Animated.Value(0);

  startAnimation = () => {
    Animated.timing(this.opacityAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  render() {
    const { style, status, src, colors } = this.props;
    const { loadError } = this.state;

    return (
      <View style={[style, styles.root]}>
        <Skeleton style={styles.skeleton} loading={true} />
        <Animated.View
          style={[
            styles.imageContainer,
            {
              opacity: this.opacityAnim,
            },
          ]}
        >
          {status === "nodata" ||
          status === "error" ||
          (status === "loaded" && !src) ||
          loadError ? (
            <NotFound colors={colors} onLayout={this.startAnimation} />
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
                uri: src,
              }}
              onLoad={({ nativeEvent }: Image.ImageLoadEvent) => {
                if (!nativeEvent) {
                  this.setState({ loadError: true });
                }
              }}
              onLoadEnd={this.startAnimation}
              onError={() => this.setState({ loadError: true })}
            />
          )}
        </Animated.View>
      </View>
    );
  }
}

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

export default withTheme(NftImage);
