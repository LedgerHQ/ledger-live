/* @flow */
import React, { PureComponent } from "react";
import { StyleSheet, View } from "react-native";
import {
  parseFramesReducer,
  framesToData,
  areFramesComplete,
  progressOfFrames,
} from "qrloop";
import { decode } from "@ledgerhq/live-common/lib/cross";

import { TrackScreen } from "../../analytics";
import { ScreenName } from "../../const";
import Scanner from "../../components/Scanner";
import GenericErrorBottomModal from "../../components/GenericErrorBottomModal";
import getWindowDimensions from "../../logic/getWindowDimensions";
import { withTheme } from "../../colors";

type Props = {
  navigation: any,
  route: any,
  colors: *,
};

class Scan extends PureComponent<
  Props,
  {
    progress: number,
    error: ?Error,
    width: number,
    height: number,
  },
> {
  state = {
    progress: 0,
    error: null,
    ...getWindowDimensions(),
  };

  componentDidMount() {
    const data = this.props.route.params?.data;
    if (data) {
      const frames = data.reduce(parseFramesReducer, null);
      if (areFramesComplete(frames)) {
        this.onResult(decode(framesToData(frames).toString()));
      }
    }
  }

  lastData: ?string = null;

  frames: * = null;

  completed: boolean = false;

  onBarCodeRead = (data: string) => {
    if (data && data !== this.lastData && !this.completed) {
      this.lastData = data;
      try {
        this.frames = parseFramesReducer(this.frames, data);

        this.setState({ progress: progressOfFrames(this.frames) });

        if (areFramesComplete(this.frames)) {
          try {
            this.onResult(decode(framesToData(this.frames).toString()));
            this.completed = true;
          } catch (error) {
            this.frames = null;
            this.setState({ error, progress: 0 });
          }
        }
      } catch (e) {
        console.warn(e);
      }
    }
  };

  onCloseError = () => {
    this.setState({ error: null });
  };

  onResult = result => {
    const onFinish = this.props.route.params?.onFinish;

    this.props.navigation.replace(ScreenName.DisplayResult, {
      result,
      onFinish,
    });
  };

  render() {
    const { progress, error } = this.state;
    const { colors } = this.props;

    return (
      <View style={[styles.root, { backgroundColor: colors.darkBlue }]}>
        <TrackScreen category="ImportAccounts" name="Scan" />
        <Scanner onResult={this.onBarCodeRead} progress={progress} liveQrCode />
        <GenericErrorBottomModal error={error} onClose={this.onCloseError} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",
  },
  camera: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default withTheme(Scan);
