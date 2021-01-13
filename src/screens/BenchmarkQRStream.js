// @flow

import React, { PureComponent } from "react";
import { StyleSheet, View } from "react-native";
import { RNCamera } from "react-native-camera";
import LText from "../components/LText";
import { rgba, withTheme } from "../colors";
import getWindowDimensions from "../logic/getWindowDimensions";

class BenchmarkQRStream extends PureComponent<
  {
    navigation: *,
    colors: *,
  },
  *,
> {
  state = {
    ...getWindowDimensions(),
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
    const { colors } = this.props;
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

    const darkenStyle = {
      ...styles.darken,
      backgroundColor: rgba(colors.darkBlue, 0.4),
    };

    return (
      <View style={[styles.root, { backgroundColor: colors.darkBlue }]}>
        <RNCamera
          barCodeTypes={[RNCamera.Constants.BarCodeType.qr]} // Do not look for barCodes other than QR
          onBarCodeRead={this.onBarCodeRead}
          ratio="16:9"
          captureAudio={false}
          style={[styles.camera, cameraDimensions]}
        >
          {({ status }) =>
            status === "READY" ? (
              <View style={wrapperStyle}>
                <View style={[darkenStyle, styles.centered, styles.topCell]}>
                  <LText semiBold style={styles.text} color="white">
                    {"ledger-live-tools.netlify.com/qrstreambenchmark"}
                  </LText>
                </View>

                <View style={styles.row}>
                  <View style={[darkenStyle]} />
                  <View
                    style={{ width: viewFinderSize, height: viewFinderSize }}
                  >
                    <View style={styles.innerRow}>
                      <View
                        style={[
                          styles.border,
                          styles.borderLeft,
                          styles.borderTop,
                        ]}
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
                  <View style={[darkenStyle]} />
                </View>
                <View style={[darkenStyle, styles.centered]}>
                  <View style={styles.centered}>
                    <LText semiBold style={styles.text} color="white">
                      {summary}
                    </LText>
                  </View>
                </View>
              </View>
            ) : null
          }
        </RNCamera>
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
  resultRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  result: {
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
    flexGrow: 1,
  },
  text: {
    fontSize: 14,
    textAlign: "center",
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
});

export default withTheme(BenchmarkQRStream);
