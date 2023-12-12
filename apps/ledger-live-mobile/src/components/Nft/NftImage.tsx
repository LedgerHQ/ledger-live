import React, { useState } from "react";
import FastImage, { OnLoadEvent, FastImageProps, ResizeMode } from "react-native-fast-image";
import { View, StyleSheet, Animated, StyleProp, ViewStyle } from "react-native";
import ImageNotFoundIcon from "~/icons/ImageNotFound";
import { Theme, withTheme } from "../../colors";
import Skeleton from "../Skeleton";

const ImageComponent: React.FC<FastImageProps> = props =>
  typeof props?.source === "object" && props?.source?.uri ? <FastImage {...props} /> : null;

const NotFound: React.FC<{
  colors: { [key: string]: string };
  onLayout: () => void;
}> = ({ colors, onLayout }) => {
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
  style?: StyleProp<ViewStyle>;
  status: string;
  src: string;
  srcFallback: string;
  resizeMode?: ResizeMode;
  colors: Theme["colors"];
  transparency?: boolean;
  children?: React.ReactNode | null;
};

type State = {
  error: boolean;
  usingFallback: boolean;
};

class NftImage extends React.PureComponent<Props, State> {
  static defaultProps = {
    transparency: false,
  };

  state = {
    error: false,
    contentType: null,
    usingFallback: false,
  };

  contentOpacityAnim = new Animated.Value(0);
  skeletonOpacityAnim = new Animated.Value(1);

  startAnimation = () => {
    Animated.timing(this.contentOpacityAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    Animated.timing(this.skeletonOpacityAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
      delay: 250,
    }).start();
  };

  onLoad = ({ nativeEvent }: OnLoadEvent) => {
    if (!nativeEvent) {
      if (this.state.usingFallback) {
        this.setState({ error: true });
      } else {
        this.setState({ usingFallback: true });
      }
    }
  };

  onError = () => {
    if (this.state.usingFallback) {
      this.setState({ error: true });
    } else {
      this.setState({ usingFallback: true });
    }
  };

  render() {
    const {
      style,
      src,
      srcFallback,
      status,
      colors,
      resizeMode = "cover",
      transparency,
      children,
    } = this.props;
    const { error, usingFallback } = this.state;

    const noData = status === "nodata";
    const metadataError = status === "error";
    const noSource = status === "loaded" && !src;

    return (
      <View style={[style, styles.root]}>
        <Animated.View
          style={[
            styles.skeleton,
            {
              opacity: this.skeletonOpacityAnim,
            },
          ]}
        >
          <Skeleton style={styles.skeleton} loading={true} />
        </Animated.View>
        <Animated.View
          style={[
            styles.imageContainer,
            {
              opacity: this.contentOpacityAnim,
            },
          ]}
        >
          {noData || metadataError || noSource || error ? (
            <NotFound colors={colors} onLayout={this.startAnimation} />
          ) : (
            <ImageComponent
              key={Number(this.state.usingFallback)}
              style={[
                styles.image,
                {
                  backgroundColor: transparency ? undefined : colors.background,
                },
              ]}
              resizeMode={resizeMode}
              source={{
                uri: usingFallback ? srcFallback : src,
              }}
              onLoad={this.onLoad}
              onLoadEnd={this.startAnimation}
              onError={this.onError}
            />
          )}
        </Animated.View>
        {children}
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
