import React, { PureComponent } from "react";
import { StyleSheet, View } from "react-native";
import { parseFramesReducer, framesToData, areFramesComplete, progressOfFrames } from "qrloop";
import { Result as ImportAccountsResult, decode } from "@ledgerhq/live-common/cross";
import { TrackScreen } from "~/analytics";
import { ScreenName } from "~/const";
import Scanner from "~/components/Scanner";
import GenericErrorBottomModal from "~/components/GenericErrorBottomModal";
import getWindowDimensions from "~/logic/getWindowDimensions";
import { withTheme } from "../../colors";
import type { Theme } from "../../colors";
import type { ImportAccountsNavigatorParamList } from "~/components/RootNavigator/types/ImportAccountsNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

type NavigationProps = StackNavigatorProps<
  ImportAccountsNavigatorParamList,
  ScreenName.ScanAccounts
>;

type Props = {
  colors: Theme["colors"];
} & NavigationProps;

class Scan extends PureComponent<
  Props,
  {
    progress: number;
    error?: Error | null;
    width: number;
    height: number;
  }
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

  lastData: string | null | undefined = null;
  frames: ReturnType<typeof parseFramesReducer> = null;
  completed = false;

  onBarCodeRead = (data: string) => {
    if (data && data !== this.lastData && !this.completed) {
      this.lastData = data;

      try {
        this.frames = parseFramesReducer(this.frames, data);
        this.setState({
          progress: progressOfFrames(this.frames),
        });

        if (areFramesComplete(this.frames)) {
          try {
            this.onResult(decode(framesToData(this.frames).toString()));
            this.completed = true;
          } catch (error) {
            this.frames = null;
            this.setState({
              error: error as Error,
              progress: 0,
            });
          }
        }
      } catch (e) {
        console.warn(e);
      }
    }
  };
  onCloseError = () => {
    this.setState({
      error: null,
    });
  };
  onResult = (result: ImportAccountsResult) => {
    const onFinish = this.props.route.params?.onFinish;
    this.props.navigation.replace(ScreenName.DisplayResult, {
      result,
      onFinish,
    });
  };

  render() {
    const { progress, error } = this.state;
    return (
      <View style={styles.root}>
        <TrackScreen category="Account Import Sync" />
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

const m: React.ComponentType<NavigationProps> = withTheme(Scan);

export default m;
