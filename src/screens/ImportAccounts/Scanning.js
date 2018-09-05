/* @flow */
import React, { PureComponent } from "react";
import { StyleSheet, View, Dimensions, StatusBar } from "react-native";
import { RNCamera } from "react-native-camera";
import toLength from "lodash/toLength";
import ProgressCircle from "react-native-progress/Circle";
import {
  parseChunksReducer,
  areChunksComplete,
  chunksToResult,
} from "@ledgerhq/live-common/lib/bridgestream/importer";
import type { Result } from "@ledgerhq/live-common/lib/bridgestream/types";
import colors, { rgba } from "../../colors";

type Props = { onResult: Result => void };

export default class Scanning extends PureComponent<
  Props,
  {
    progress: number,
    width: number,
    height: number,
  },
> {
  constructor(props: Props) {
    super(props);

    this.state = { progress: 0, ...this.getDimensions() };
  }

  lastData: ?string = null;
  nbChunks: ?number = null;
  chunks: * = [];
  completed: boolean = false;

  onBarCodeRead = ({ data }: { data: string }) => {
    if (data && data !== this.lastData && !this.completed) {
      const previousLength = this.chunks.length;

      this.lastData = data;
      this.chunks = parseChunksReducer(this.chunks, data);

      if (this.chunks.length <= previousLength) {
        return;
      }

      if (this.nbChunks === null) {
        this.nbChunks = toLength(this.chunks[0][0]);
      }

      if (!this.nbChunks) {
        return;
      }

      if (this.nbChunks) {
        this.setState({ progress: this.chunks.length / this.nbChunks });
      }

      if (areChunksComplete(this.chunks)) {
        this.completed = true;
        // TODO read the chunks version and check it's correctly supported (if newers version, we deny the import with an error)
        this.props.onResult(chunksToResult(this.chunks));
      }
    }
  };

  // Force ratio for camera view to prevent image stretching
  getDimensions = () => {
    const { width, height } = Dimensions.get("window");
    const ratio = 16 / 9;

    return width < height
      ? { width, height: width * ratio }
      : { width: height * ratio, height };
  };

  setDimensions = () => {
    const dimensions = this.getDimensions();

    this.setState(dimensions);
  };

  render() {
    const { progress, width, height } = this.state;

    // Make the viewfinder borders 2/3 of the screen shortest border
    const viewFinderSize = (width > height ? height : width) * (2 / 3);

    StatusBar.setTranslucent(true);
    StatusBar.setBarStyle("light-content");
    StatusBar.setBackgroundColor("rgba(0, 0, 0, 0)", true);

    // TODO some instruction on screen + progress indicator
    return (
      <View style={styles.root} onLayout={this.setDimensions}>
        <RNCamera
          barCodeTypes={[RNCamera.Constants.BarCodeType.qr]} // Do not look for barCodes other than QR
          onBarCodeRead={this.onBarCodeRead}
          ratio="16:9"
          style={{ width, height }}
        >
          <View style={styles.darken} />
          <View style={styles.row}>
            <View style={styles.darken} />
            <View style={{ width: viewFinderSize, height: viewFinderSize }}>
              <View style={styles.innerRow}>
                <View
                  style={[styles.border, styles.borderLeft, styles.borderTop]}
                />
                <View style={styles.border} />
                <View
                  style={[styles.border, styles.borderRight, styles.borderTop]}
                />
              </View>
              <View style={styles.innerRow} />
              <View style={styles.innerRow}>
                <View
                  style={[
                    styles.border,
                    styles.borderLeft,
                    styles.borderBottom,
                  ]}
                />
                <View style={styles.border} />
                <View
                  style={[
                    styles.border,
                    styles.borderRight,
                    styles.borderBottom,
                  ]}
                />
              </View>
            </View>
            <View style={styles.darken} />
          </View>
          <View style={[styles.darken, styles.bottom]}>
            <ProgressCircle
              showsText
              indeterminate={!progress}
              progress={progress}
              color={colors.live}
              size={viewFinderSize / 4}
              strokeCap="round"
              textStyle={{ color: "white" }}
            />
          </View>
        </RNCamera>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
  },
  column: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  innerRow: {
    flexDirection: "row",
    alignItems: "stretch",
    flexGrow: 1,
  },
  darken: {
    backgroundColor: rgba(colors.darkBlue, 0.4),
    flexGrow: 1,
  },
  border: {
    borderColor: "white",
    flexGrow: 1,
  },
  borderTop: {
    borderTopWidth: 6,
  },
  borderBottom: {
    borderBottomWidth: 6,
  },
  borderLeft: {
    borderLeftWidth: 6,
  },
  borderRight: {
    borderRightWidth: 6,
  },
  bottom: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
