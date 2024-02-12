import React from "react";
import Video, { OnLoadData, VideoProperties } from "react-native-video";
import { View, StyleSheet, Animated, StyleProp, ViewStyle, Platform } from "react-native";
import { ResizeMode } from "react-native-fast-image";
import { Theme, withTheme } from "../../colors";
import Skeleton from "../Skeleton";
import NftImage from "./NftImage";
import { TouchableOpacity } from "react-native-gesture-handler";

const isAndroid = Platform.OS === "android";

type Props = {
  style?: StyleProp<ViewStyle>;
  status: string;
  src: string;
  srcFallback: string;
  resizeMode?: VideoProperties["resizeMode"] & ResizeMode;
  colors: Theme["colors"];
  children?: React.ReactNode | null;
  transparency?: boolean;
};

class NftVideo extends React.PureComponent<Props> {
  state = {
    isPosterMode: false,
    loaded: false,
  };

  opacityAnim = new Animated.Value(0);

  videoRef: Video | null = null;

  startAnimation = () => {
    Animated.timing(this.opacityAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  onError = () => {
    this.setState({ ...this.state, loaded: true, isPosterMode: true });
    this.startAnimation();
  };

  onLoad = (onLoadEvent: OnLoadData) => {
    if (!onLoadEvent?.duration) {
      this.onError();
    } else {
      this.setState({ ...this.state, loaded: true });
    }
  };

  render() {
    const {
      style,
      src,
      colors,
      transparency,
      resizeMode = "cover",
      srcFallback,
      children,
    } = this.props;
    const { isPosterMode } = this.state;

    return (
      <View style={[style, styles.root]}>
        <Skeleton style={styles.skeleton} loading={!this.state.loaded} />
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
            <TouchableOpacity
              // Android video doesn't seem to support fullscreen without a custom
              // implmentation so we're leaving the old functionality in place.
              disabled={isAndroid}
              onPress={() => {
                if (this.videoRef) {
                  this.videoRef.presentFullscreenPlayer();
                }
              }}
              style={styles.videoContainer}
            >
              <Video
                ref={ref => {
                  this.videoRef = ref;
                }}
                style={[
                  styles.video,
                  !transparency
                    ? {
                        backgroundColor: colors.white,
                      }
                    : {},
                ]}
                resizeMode={resizeMode}
                source={{
                  uri: src,
                }}
                onLoad={this.onLoad}
                onReadyForDisplay={this.startAnimation}
                onError={this.onError}
                repeat={true}
                controls={false}
              />
            </TouchableOpacity>
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
  videoContainer: {
    display: "flex",
    width: "100%",
    height: "100%",
  },
  video: {
    flex: 1,
  },
  notFoundView: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default withTheme(NftVideo);
