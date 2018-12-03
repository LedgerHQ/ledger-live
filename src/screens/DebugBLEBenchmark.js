// @flow

import React, { Component } from "react";
import { View } from "react-native";
import { from } from "rxjs";
import { concatMap } from "rxjs/operators";
import type { NavigationScreenProp } from "react-navigation";
import LText from "../components/LText";
import Button from "../components/Button";
import { withDevice } from "../logic/hw/deviceAccess";

class DebugBLE extends Component<
  {
    navigation: NavigationScreenProp<{
      params: {
        deviceId: string,
      },
    }>,
    device: *,
  },
  {
    datapoints: [number, number][],
  },
> {
  static navigationOptions = {
    title: "Debug BLE Benchmark",
  };

  state = {
    datapoints: [],
  };

  sub: *;

  componentWillUnmount() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  benchmark = () => {
    this.setState({ datapoints: [] });
    if (this.sub) {
      this.sub.unsubscribe();
    }
    const { navigation } = this.props;
    const deviceId = navigation.getParam("deviceId");
    const input = Buffer.from([
      0xfe,
      0xfe,
      0,
      0,
      ...Array(100)
        .fill(0)
        .map((_, i) => i % 255),
    ]);
    this.sub = withDevice(deviceId)(t => {
      const loop = () =>
        from(t.exchange(input)).pipe(
          concatMap(output => {
            const dataExchanged = input.length + output.length;
            this.setState(({ datapoints }) => ({
              datapoints: [[Date.now(), dataExchanged]]
                .concat(datapoints)
                .slice(0, 5),
            }));
            return loop();
          }),
        );
      return loop();
    }).subscribe();
  };

  render() {
    const { datapoints } = this.state;
    let speed = 0;
    if (datapoints.length > 2) {
      const [lastTime] = datapoints[0];
      let totalBytes = 0;
      for (let i = 0; i < datapoints.length - 1; i++) {
        totalBytes += datapoints[i][1];
      }
      const [firstTime] = datapoints[datapoints.length - 1];
      speed = totalBytes / ((lastTime - firstTime) / 1000);
    }

    return (
      <View
        style={{
          flex: 1,
          flexDirection: "column",
          padding: 40,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LText bold style={{ fontSize: 20, marginBottom: 10 }}>
          {speed.toFixed(1)} byte/s
        </LText>
        <Button
          event="DebugBLEBenchmark"
          containerStyle={{ width: 100 }}
          type="primary"
          title="Benchmark"
          onPress={this.benchmark}
        />
      </View>
    );
  }
}

export default DebugBLE;
