import React, { useState } from "react";
import FastImage, {
  OnLoadEvent,
  FastImageProps,
  ResizeMode,
} from "react-native-fast-image";
import { View, StyleSheet, Animated } from "react-native";
import ImageNotFoundIcon from "../../icons/ImageNotFound";
import { withTheme } from "../../colors";
import Skeleton from "../Skeleton";

const ImageComponent: React.FC<FastImageProps> = props =>
  typeof props?.source === "object" && props?.source?.uri ? (
    <FastImage {...props} />
  ) : null;

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
  style?: Object;
  status: string;
  src: string;
  resizeMode?: ResizeMode;
  colors: any;
  useFallback: boolean;
  setUseFallback: (_useFallback: boolean) => void;
};

type State = {
  error: boolean;
  loading: boolean;
};

class NftImage extends React.PureComponent<Props, State> {
  state = {
    beforeLoadDone: false,
    error: false,
    contentType: null,
    loading: true,
  };

  opacityAnim = new Animated.Value(0);

  startAnimation = () => {
    Animated.timing(this.opacityAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(({ finished }) => {
      finished && this.setState({ loading: false });
    });
  };

  onLoad = ({ nativeEvent }: OnLoadEvent) => {
    if (!nativeEvent) {
      if (!this.props.useFallback) {
        this.props.setUseFallback(true);
      } else {
        this.setState({ loading: true, error: true });
      }
    }
  };

  onError = () => {
    if (!this.props.useFallback) {
      this.props.setUseFallback(true);
    } else {
      this.setState({ error: true });
    }
  };

  render() {
    const { style, status, src, colors, resizeMode = "cover" } = this.props;
    const { error, loading } = this.state;

    const noData = status === "nodata";
    const metadataError = status === "error";
    const noSource = status === "loaded" && !src;

    return (
      <View style={[style, styles.root]}>
        <Skeleton style={styles.skeleton} loading={loading} />
        <Animated.View
          style={[
            styles.imageContainer,
            {
              opacity: this.opacityAnim,
            },
          ]}
        >
          {noData || metadataError || noSource || error ? (
            <NotFound colors={colors} onLayout={this.startAnimation} />
          ) : (
            <ImageComponent
              style={[
                styles.image,
                {
                  backgroundColor: colors.background.main,
                },
              ]}
              resizeMode={resizeMode}
              source={{
                uri: src,
              }}
              onLoad={this.onLoad}
              onLoadEnd={this.startAnimation}
              onError={this.onError}
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
