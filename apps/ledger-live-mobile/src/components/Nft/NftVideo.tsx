import React from "react";
import Video, { OnLoadData, VideoProperties } from "react-native-video";
import { View, StyleSheet, Animated, StyleProp, ViewStyle } from "react-native";
import { ResizeMode } from "react-native-fast-image";
import { Theme, withTheme } from "../../colors";
import Skeleton from "../Skeleton";
import NftImage from "./NftImage";

type Props = {
  style?: StyleProp<ViewStyle>;
  status: string;
  src: string;
  srcFallback: string;
  resizeMode?: VideoProperties["resizeMode"] & ResizeMode;
  colors: Theme["colors"];
  children?: React.ReactNode | null;
};

class NftVideo extends React.PureComponent<Props> {
  state = {
    isPosterMode: false,
  };

  opacityAnim = new Animated.Value(0);

  startAnimation = () => {
    Animated.timing(this.opacityAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  onError = () => {
    this.setState({ isPosterMode: true });
    this.startAnimation();
  };

  onLoad = (onLoadEvent: OnLoadData) => {
    if (!onLoadEvent?.duration) {
      this.onError();
    }
  };

  render() {
    const {
      style,
      src,
      colors,
      resizeMode = "cover",
      srcFallback,
      children,
    } = this.props;
    const { isPosterMode } = this.state;

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
          {isPosterMode ? (
            <NftImage {...this.props} status="loaded" src={srcFallback} />
          ) : (
            <Video
              style={[
                styles.image,
                {
                  backgroundColor: colors.white,
                },
              ]}
              resizeMode={resizeMode}
              source={{
                uri: src,
              }}
              onLoad={this.onLoad}
              onReadyForDisplay={this.startAnimation}
              onError={this.onError}
              repeat={true}
              controls={true}
              paused={true}
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

export default withTheme(NftVideo);
