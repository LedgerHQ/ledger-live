import React, { PureComponent } from "react";
import { StyleSheet, View } from "react-native";
import Scanner from "~/components/Scanner";
import LText from "~/components/LText";
import { rgba, Theme, withTheme } from "../../../../colors";
import getWindowDimensions from "~/logic/getWindowDimensions";
import { ScreenName } from "~/const";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

type Props = {
  colors: Theme["colors"];
} & StackNavigatorProps<SettingsNavigatorStackParamList, ScreenName.BenchmarkQRStream>;

type Benchmark = {
  count: number;
  dataSize: number;
};

type State = {
  width: number;
  height: number;
  benchmarks: Benchmark[];
  end: boolean;
};

class BenchmarkQRStream extends PureComponent<Props, State> {
  state = { ...getWindowDimensions(), benchmarks: [], end: false };
  count = 0;
  dataSize = 0;
  previous = "";
  end = false;
  onBarCodeRead = (data: string) => {
    if (this.previous === data || this.end) return;
    this.previous = data;

    if (data.indexOf("bench:") === 0 || data === "end") {
      if (this.dataSize) {
        const bench = {
          count: this.count,
          dataSize: this.dataSize,
        };
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
    const { benchmarks, end } = this.state;
    const summary = benchmarks.map((b: Benchmark) => `${b.dataSize}:${b.count}`).join(" ");

    if (end) {
      return (
        <View style={styles.resultRoot}>
          <LText selectable>
            {benchmarks.map((b: Benchmark) => `${b.dataSize} ${b.count}`).join("\n")}
          </LText>
        </View>
      );
    }

    const darkenStyle = {
      ...styles.darken,
      backgroundColor: rgba(colors.darkBlue, 0.4),
    };
    return (
      <View
        style={[
          styles.root,
          {
            backgroundColor: colors.darkBlue,
          },
        ]}
      >
        <Scanner onResult={this.onBarCodeRead} liveQrCode />
        <View style={[darkenStyle]} />
        <View style={[darkenStyle, styles.centered]}>
          <View style={styles.centered}>
            <LText semiBold style={styles.text} color="white">
              {summary}
            </LText>
          </View>
        </View>
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
  darken: {
    flexGrow: 1,
  },
  text: {
    fontSize: 14,
    textAlign: "center",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
export default withTheme(BenchmarkQRStream);
