import React, { Component, memo } from "react";
import { View } from "react-native";
import { from, Observable, Subscription } from "rxjs";
import { concatMap } from "rxjs/operators";
import * as shape from "d3-shape";
import * as scale from "d3-scale";
import maxBy from "lodash/maxBy";
import Svg, { Path } from "react-native-svg";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { useTheme } from "@react-navigation/native";
import { Slider } from "@ledgerhq/native-ui";
import LText from "~/components/LText";
import TranslatedError from "~/components/TranslatedError";
import { ScreenName } from "~/const";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

type GraphProps = {
  width: number;
  height: number;
  data: number[];
};

type Point = {
  value: number;
  index: number;
};

function GraphComponent({ width, height, data }: GraphProps) {
  const { colors } = useTheme();
  const points: Point[] = data.map((value, index) => ({
    value,
    index,
  }));
  const maxY = maxBy(data, v => v);
  const x = scale
    .scaleLinear()
    .range([0, width])
    .domain([0, data.length - 1]);
  const y = scale
    .scaleLinear()
    .range([height - 10, 10])
    .domain([0, maxY as number]);
  const line = shape
    .line<Point>()
    .x(d => x(d.index))
    .y(d => y(d.value))
    .curve(shape.curveLinear)(points);
  return (
    <Svg height={height} width={width}>
      <Path d={line as string} stroke={colors.live} strokeWidth={4} fill="none" />
    </Svg>
  );
}

const Graph = memo<GraphProps>(GraphComponent);

const benchmark = ({
  inputAPDUSize,
  outputAPDUSize,
}: {
  inputAPDUSize: number;
  outputAPDUSize: number;
}) => {
  const inSize = inputAPDUSize - 5;
  const head = Buffer.from([0xe0, 0xff, 0x00, 0x00, inSize]);
  head.writeInt16BE(outputAPDUSize, 2);
  const data = Buffer.from(
    Array(inSize)
      .fill(0)
      .map((_, i) => i % 255),
  );
  return Buffer.concat([head, data]);
};

const speedStatusSize = 10;
class DebugBLEBenchmark extends Component<
  StackNavigatorProps<SettingsNavigatorStackParamList, ScreenName.DebugBLEBenchmark>,
  {
    exchangeStats: number[][];
    speedStats: number[];
    inputAPDUSize: number;
    outputAPDUSize: number;
    error: Error | null | undefined;
  }
> {
  state = {
    exchangeStats: [],
    speedStats: Array(speedStatusSize).fill(0),
    inputAPDUSize: 100,
    outputAPDUSize: 100,
    error: null,
  };
  killswitch = false;
  sub: Subscription | undefined;

  componentDidMount() {
    this.benchmark();
  }

  componentWillUnmount() {
    this.killswitch = true;
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  updateInputAPDUSize = (inputAPDUSize: number) => {
    this.setState({ inputAPDUSize });
  };

  updateOutputAPDUSize = (outputAPDUSize: number) => {
    this.setState({ outputAPDUSize });
  };

  benchmark = () => {
    this.setState({
      exchangeStats: [],
      speedStats: Array(speedStatusSize).fill(0),
    });

    if (this.sub) {
      this.sub.unsubscribe();
    }

    const deviceId = this.props.route.params?.deviceId;
    this.sub = withDevice(deviceId)(t => {
      // FIXME: PROBABLY WRONG HERE BUT WE NEED TO REWORK withDevice FIRST
      const loop = (): Observable<{
        exchangeStats: number[][];
        speedStats: number[];
      }> => {
        if (this.killswitch) return from([]);
        const input = benchmark(this.state);
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
    }).subscribe({
      error: error => {
        this.setState({
          error,
        });
      },
    });
  };

  render() {
    const { speedStats, inputAPDUSize, outputAPDUSize, error } = this.state;
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
        <LText
          style={{
            color: "red",
          }}
        >
          <TranslatedError error={error} />
        </LText>

        <Graph width={300} height={200} data={speedStats} />
        <LText
          bold
          style={{
            fontSize: 20,
            marginBottom: 10,
          }}
        >
          {speed.toFixed(1)} byte/s
        </LText>

        <View
          style={{
            padding: 40,
          }}
        >
          <View
            style={{
              flexDirection: "row",
            }}
          >
            <LText>input apdu size</LText>
            <Slider
              min={5}
              max={260}
              step={1}
              onChange={this.updateInputAPDUSize}
              value={inputAPDUSize}
            />
            <LText bold>{inputAPDUSize}</LText>
          </View>
          <View
            style={{
              flexDirection: "row",
            }}
          >
            <LText>output apdu size</LText>
            <Slider
              min={5}
              max={255}
              step={1}
              onChange={this.updateOutputAPDUSize}
              value={outputAPDUSize}
            />
            <LText bold>{outputAPDUSize}</LText>
          </View>
        </View>
      </View>
    );
  }
}

export default DebugBLEBenchmark;
