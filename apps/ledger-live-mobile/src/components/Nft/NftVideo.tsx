import React from "react";
import Video, { OnLoadData, VideoProperties } from "react-native-video";
import { View, StyleSheet, Animated } from "react-native";
import { TpRegular } from "@ledgerhq/native-ui/assets/icons";
import { withTheme } from "../../colors";
import Skeleton from "../Skeleton";

type Props = {
  style?: Object;
  status: string;
  src: string;
  resizeMode?: VideoProperties["resizeMode"];
  colors: any;
  useFallback: boolean;
  setUseFallback: (_useFallback: boolean) => void;
};

class NftVideo extends React.PureComponent<Props> {
  opacityAnim = new Animated.Value(0);

  startAnimation = () => {
    Animated.timing(this.opacityAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  onLoad = (onLoadEvent: OnLoadData) => {
    if (!onLoadEvent?.duration) {
      this.props.setUseFallback(true);
    }
  };

  onError = () => {
    this.props.setUseFallback(true);
  };

  render() {
    const {
      style,
      status,
      src,
      colors,
      resizeMode = "cover",
      setUseFallback,
    } = this.props;

    const noData = status === "nodata";
    const metadataError = status === "error";
    const noSource = status === "loaded" && !src;

    if (noData || metadataError || noSource) {
      setUseFallback(true);
      return null;
    }

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

export default withTheme(NftVideo);
