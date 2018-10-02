// @flow

import React, { PureComponent } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import { RNCamera } from "react-native-camera";
import type { NavigationScreenProp } from "react-navigation";
import LText from "../components/LText";
import colors, { rgba } from "../colors";

const getDimensions = () => {
  const { width, height } = Dimensions.get("window");
  return { width, height };
};

export default class BenchmarkQRStream extends PureComponent<
  {
    navigation: NavigationScreenProp<*>,
  },
  *,
> {
  static navigationOptions = {
    title: "Benchmark QRStream",
  };

  state = {
    ...getDimensions(),
    benchmarks: [],
    end: false,
  };

  count = 0;

  dataSize = 0;

  previous = "";

  end = false;

  onBarCodeRead = ({ data }: { data: string }) => {
    if (this.previous === data || this.end) return;
    this.previous = data;
    if (data.indexOf("bench:") === 0 || data === "end") {
      if (this.dataSize) {
        const bench = { count: this.count, dataSize: this.dataSize };
        this.setState(({ benchmarks }) => ({
          end: data === "end",
          benchmarks: benchmarks.some(b => b.dataSize === bench.dataSize)
            ? benchmarks
            : benchmarks.concat(bench),
        }));
      }
      if (data === "end") {
        this.end = true;
      } else {
        this.count = 0;
        this.dataSize = parseInt(data.slice(6), 10);
      }
    } else {
      this.count++;
    }
  };

  render() {
    const { width, height, benchmarks, end } = this.state;
    const summary = benchmarks.map(b => `${b.dataSize}:${b.count}`).join(" ");
    const cameraRatio = 16 / 9;
    const cameraDimensions =
      width > height
        ? { width, height: width / cameraRatio }
        : { width: height / cameraRatio, height };
    const viewFinderSize = (width > height ? height : width) * (2 / 3);
    const wrapperStyle =
      width > height
        ? { height, alignSelf: "stretch" }
        : { width, flexGrow: 1 };

    if (end) {
      return (
        <View style={styles.resultRoot}>
          <LText selectable style={styles.result}>
            {benchmarks.map(b => `${b.dataSize} ${b.count}`).join("\n")}
          </LText>
        </View>
      );
    }

    return (
      <View style={styles.root}>
        <RNCamera
          barCodeTypes={[RNCamera.Constants.BarCodeType.qr]} // Do not look for barCodes other than QR
          onBarCodeRead={this.onBarCodeRead}
          ratio="16:9"
          style={[styles.camera, cameraDimensions]}
        >
          <View style={wrapperStyle}>
            <View style={[styles.darken, styles.centered, styles.topCell]}>
              <LText semibold style={styles.text}>
                {"ledger-live-tools.netlify.com/qrstreambenchmark"}
              </LText>
            </View>

            <View style={styles.row}>
              <View style={styles.darken} />
              <View style={{ width: viewFinderSize, height: viewFinderSize }}>
                <View style={styles.innerRow}>
                  <View
                    style={[styles.border, styles.borderLeft, styles.borderTop]}
                  />
                  <View style={styles.border} />
                  <View
                    style={[
                      styles.border,
                      styles.borderRight,
                      styles.borderTop,
                    ]}
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
            <View style={[styles.darken, styles.centered]}>
              <View style={styles.centered}>
                <LText semibold style={styles.text}>
                  {summary}
                </LText>
              </View>
            </View>
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
  resultRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  result: {
    color: "black",
    padding: 20,
  },
  camera: {
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
  topCell: {
    paddingTop: 64,
  },
  darken: {
    backgroundColor: rgba(colors.darkBlue, 0.4),
    flexGrow: 1,
  },
  text: {
    fontSize: 14,
    textAlign: "center",
    color: colors.white,
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    color: colors.white,
    fontSize: 16,
  },
});
