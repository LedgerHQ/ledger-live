// @flow

import React, { Component, PureComponent } from "react";
import { View, Picker, Slider } from "react-native";
import { from } from "rxjs";
import { concatMap } from "rxjs/operators";
import * as shape from "d3-shape";
import * as scale from "d3-scale";
import maxBy from "lodash/maxBy";
import Svg, { Path } from "react-native-svg";
import type { NavigationScreenProp } from "react-navigation";
import LText from "../components/LText";
import { withDevice } from "../logic/hw/deviceAccess";
import colors from "../colors";

type Props = {
  width: number,
  height: number,
  data: number[],
};

class Graph extends PureComponent<Props> {
  render() {
    const { width, height, data } = this.props;

    const points = data.map((value, index) => ({ value, index }));
    const maxY = maxBy(data, v => v);

    const x = scale
      .scaleLinear()
      .range([0, width])
      .domain([0, data.length - 1]);

    const y = scale
      .scaleLinear()
      .range([height - 10, 10])
      .domain([0, maxY]);

    const line = shape
      .line()
      .x(d => x(d.index))
      .y(d => y(d.value))
      .curve(shape.curveLinear)(points);

    return (
      <Svg height={height} width={width}>
        <Path d={line} stroke={colors.live} strokeWidth={4} fill="none" />
      </Svg>
    );
  }
}

const apdus = {
  echo: {
    title: "echo (E0 FF 00 00)",
    apdu: targetAPDUSize =>
      Buffer.from([
        0xe0,
        0xff,
        0x00,
        0x00,
        targetAPDUSize - 5,
        ...Array(targetAPDUSize - 5)
          .fill(0)
          .map((_, i) => i % 255),
      ]),
  },
  firmware: {
    title: "firmware (E0 01 00 00)",
    apdu: _number => Buffer.from([0xe0, 0x01, 0x00, 0x00, 0x00]),
  },
};

const speedStatusSize = 10;

class DebugBLEBenchmark extends Component<
  {
    navigation: NavigationScreenProp<{
      params: {
        deviceId: string,
      },
    }>,
    device: *,
  },
  {
    exchangeStats: [number, number][],
    speedStats: number[],
    apdu: $Keys<typeof apdus>,
    targetAPDUSize: number,
  },
> {
  static navigationOptions = {
    title: "Debug BLE Benchmark",
  };

  state = {
    exchangeStats: [],
    // $FlowFixMe
    speedStats: Array(speedStatusSize).fill(0),
    apdu: "echo",
    targetAPDUSize: 50,
  };

  sub: *;

  componentDidMount() {
    this.benchmark();
  }

  componentWillUnmount() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  benchmark = () => {
    this.setState({
      exchangeStats: [],
      speedStats: Array(speedStatusSize).fill(0),
    });
    if (this.sub) {
      this.sub.unsubscribe();
    }
    const { navigation } = this.props;
    const deviceId = navigation.getParam("deviceId");
    this.sub = withDevice(deviceId)(t => {
      const loop = () => {
        const input = apdus[this.state.apdu].apdu(this.state.targetAPDUSize);
        return from(t.exchange(input)).pipe(
          concatMap(output => {
            const dataExchanged = input.length + output.length;
            this.setState(prev => {
              const exchangeStats = [[Date.now(), dataExchanged]]
                .concat(prev.exchangeStats)
                .slice(0, 5);

              let speed = 0;
              if (exchangeStats.length > 2) {
                const [lastTime] = exchangeStats[0];
                let totalBytes = 0;
                for (let i = 0; i < exchangeStats.length - 1; i++) {
                  totalBytes += exchangeStats[i][1];
                }
                const [firstTime] = exchangeStats[exchangeStats.length - 1];
                speed = totalBytes / ((lastTime - firstTime) / 1000);
              }

              const speedStats = prev.speedStats.concat(speed);
              if (speedStats.length > 10) {
                speedStats.splice(0, speedStats.length - 10);
              }

              return {
                exchangeStats,
                speedStats,
              };
            });
            return loop();
          }),
        );
      };
      return loop();
    }).subscribe();
  };

  render() {
    const { speedStats, targetAPDUSize } = this.state;
    const speed = speedStats[speedStats.length - 1] || 0;

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
        <Graph width={300} height={200} data={speedStats} />
        <LText bold style={{ fontSize: 20, marginBottom: 10 }}>
          {speed.toFixed(1)} byte/s
        </LText>

        <View style={{ padding: 40 }}>
          <Picker
            selectedValue={this.state.apdu}
            style={{ height: 50, width: 200 }}
            onValueChange={itemValue => this.setState({ apdu: itemValue })}
          >
            {Object.keys(apdus).map(key => (
              <Picker.Item key={key} label={apdus[key].title} value={key} />
            ))}
          </Picker>
          <View style={{ flexDirection: "row" }}>
            <LText>target apdu size</LText>
            <Slider
              style={{ width: 150 }}
              minimumValue={5}
              maximumValue={200}
              step={1}
              onValueChange={targetAPDUSize => {
                this.setState({ targetAPDUSize });
              }}
              value={targetAPDUSize}
            />
            <LText bold>{targetAPDUSize}</LText>
          </View>
        </View>
      </View>
    );
  }
}

export default DebugBLEBenchmark;
