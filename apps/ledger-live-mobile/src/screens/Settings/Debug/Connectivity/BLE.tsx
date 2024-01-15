import React, { Component, memo } from "react";
import {
  FlatList,
  StyleSheet,
  TextInput,
  View,
  ToastAndroid,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { v4 as uuid } from "uuid";
import { firstValueFrom, from, Observable, Subscription } from "rxjs";
import { listen } from "@ledgerhq/logs";
import type { Log } from "@ledgerhq/logs";
import { bufferTime, shareReplay } from "rxjs/operators";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { disconnect } from "@ledgerhq/live-common/hw/index";
import { useTheme } from "@react-navigation/native";
import { Button, IconsLegacy } from "@ledgerhq/native-ui";
import BluetoothTransport from "@ledgerhq/react-native-hw-transport-ble";
import LText from "~/components/LText";
import KeyboardView from "~/components/KeyboardView";
import Switch from "~/components/Switch";
import { ScreenName } from "~/const";
import { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { Theme } from "../../../../colors";

const tags = ["apdu", "ble-verbose", "error", "ble-frame"];
const logsObservable = new Observable(o =>
  listen(log => {
    if (tags.includes(log.type)) {
      o.next(log);
    }
  }),
).pipe(shareReplay(1000));
logsObservable.subscribe();
const styles = StyleSheet.create({
  root: {
    paddingTop: 16,
    paddingBottom: 64,
  },
});

const mapLogToColor = (colors: Theme["colors"], log: Log) => {
  if (log.type.includes("error")) return colors.alert;
  if (log.type === "verbose") return colors.grey;
  if (log.type.includes("frame")) return colors.live;
  if (log.type.includes("apdu")) return colors.success;
  return colors.darkBlue;
};

const mapLogToText = (log: Log) => log.message;

function LogItemComponent({ log }: { log: Log }) {
  const text = mapLogToText(log);
  const { colors } = useTheme();
  const color = mapLogToColor(colors, log);
  return (
    <View
      style={{
        padding: 5,
        borderBottomWidth: 1,
        borderBottomColor: colors.lightFog,
        flexDirection: "row",
      }}
    >
      <LText
        selectable
        style={{
          fontSize: 10,
          flex: 1,
          color,
        }}
      >
        {text}
      </LText>
      <LText
        style={{
          marginRight: 5,
          fontSize: 8,
        }}
      >
        {log.date.toISOString().split("T")[1].replace("Z", "")}
      </LText>
    </View>
  );
}

const LogItem = memo<{
  log: Log;
}>(LogItemComponent);

type Choices = "Balanced" | "High" | "LowPower";

class DebugBLE extends Component<
  StackNavigatorProps<SettingsNavigatorStackParamList, ScreenName.DebugBLE>,
  {
    logs: Log[];
    apdu: string;
    bleframe: string;
    useBLEframe: boolean;
  }
> {
  state = {
    logs: [],
    apdu: "b001000000".toUpperCase(),
    bleframe: "0800000000",
    useBLEframe: false,
  };
  sub: Subscription | undefined;

  componentDidMount() {
    this.sub = logsObservable.pipe(bufferTime(200)).subscribe(buffer => {
      this.setState(({ logs }) =>
        buffer.length === 0
          ? null
          : {
              logs: logs.concat(buffer as Log[]),
            },
      );
    });
  }

  componentWillUnmount() {
    if (this.sub) this.sub.unsubscribe();
  }

  keyExtractor = (item: Log) => item.id;
  renderItem = ({ item }: { item: Log }) => (
    <View
      style={{
        transform: [
          {
            scaleY: -1,
          },
        ],
      }}
    >
      <LogItem log={item} />
    </View>
  );
  addError = (error: Error, ctx: string) => {
    const date = new Date();
    this.setState(({ logs }) => ({
      logs: logs.concat({
        id: uuid(),
        type: "error",
        message: "@" + ctx + ": " + error.message,
        date,
      }),
    }));
  };
  onBLEframeChange = (bleframe: string) => {
    this.setState({
      bleframe,
    });
  };
  onAPDUChange = (apdu: string) => {
    this.setState({
      apdu,
    });
  };
  send = async () => {
    const { apdu, bleframe, useBLEframe } = this.state;
    const deviceId = this.props.route.params?.deviceId;
    const msg = Buffer.from(useBLEframe ? bleframe : apdu, "hex");

    try {
      await firstValueFrom(
        withDevice(deviceId)(t =>
          from(
            useBLEframe
              ? (t as BluetoothTransport).write(msg)
              : (t as BluetoothTransport).exchange(msg),
          ),
        ),
      );
    } catch (error) {
      this.addError(error as Error, "send");
    }
  };
  inferMTU = async () => {
    const deviceId = this.props.route.params?.deviceId;

    try {
      const mtu = await firstValueFrom(
        withDevice(deviceId)(t => from((t as BluetoothTransport).inferMTU())),
      );

      if (Platform.OS === "android") {
        ToastAndroid.show("mtu set to " + mtu, ToastAndroid.SHORT);
      } else {
        Alert.alert("mtu set to " + mtu);
      }
    } catch (error) {
      this.addError(error as Error, "inferMTU");
    }
  };
  currentConnectionPriority: Choices = "Balanced";
  toggleConnectionPriority = async () => {
    const deviceId = this.props.route.params?.deviceId;
    const choices = ["Balanced", "High", "LowPower"] as const;
    const nextPriority =
      choices[(choices.indexOf(this.currentConnectionPriority) + 1) % choices.length];
    this.currentConnectionPriority = nextPriority;

    try {
      await firstValueFrom(
        withDevice(deviceId)(t =>
          from((t as BluetoothTransport).requestConnectionPriority(nextPriority)),
        ),
      );
      if (Platform.OS === "android") {
        ToastAndroid.show("connection priority set to " + nextPriority, ToastAndroid.SHORT);
      } else {
        Alert.alert("connection priority set to " + nextPriority);
      }
    } catch (error) {
      this.addError(error as Error, "changePrio");
    }
  };
  connect = async () => {
    const deviceId = this.props.route.params?.deviceId;
    // TODO with auto disconnect this wouldn't work.
    try {
      await firstValueFrom(withDevice(deviceId)(() => from([{}])));
    } catch (error) {
      this.addError(error as Error, "connect");
    }
  };
  disconnect = async () => {
    const deviceId = this.props.route.params?.deviceId;

    try {
      await disconnect(deviceId);
    } catch (error) {
      this.addError(error as Error, "disconnect");
    }
  };
  onBleFrameChange = () => {
    this.setState(({ useBLEframe }) => ({
      useBLEframe: !useBLEframe,
    }));
  };

  render() {
    const deviceId = this.props.route.params?.deviceId;
    const { logs, useBLEframe } = this.state;
    return (
      <KeyboardView
        style={{
          flex: 1,
        }}
      >
        <FlatList
          style={{
            flex: 1,
            transform: [
              {
                scaleY: -1,
              },
            ],
          }}
          data={logs.slice().reverse()}
          renderItem={this.renderItem}
          keyExtractor={this.keyExtractor}
          contentContainerStyle={styles.root}
        />

        <View
          style={{
            padding: 8,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TextInput
            style={{
              flex: 1,
              backgroundColor: "white",
              borderWidth: 1,
              borderColor: "#eee",
              marginRight: 8,
              padding: 12,
            }}
            selectTextOnFocus
            placeholder={useBLEframe ? "BLE frame here" : "APDU here"}
            onChangeText={useBLEframe ? this.onBLEframeChange : this.onAPDUChange}
            value={useBLEframe ? this.state.bleframe : this.state.apdu}
            autoCapitalize="characters"
            autoCorrect={false}
            onSubmitEditing={this.send}
          />
          <Button type="main" Icon={IconsLegacy.ArrowRightMedium} onPress={this.send} />
          <Switch value={useBLEframe} onValueChange={this.onBleFrameChange} />
        </View>
        <LText
          style={{
            fontSize: 10,
            margin: 8,
          }}
        >
          {deviceId}
        </LText>
        <View
          style={{
            maxHeight: 80,
          }}
        >
          <ScrollView
            horizontal
            style={{
              padding: 16,
            }}
          >
            <Button type="main" onPress={this.connect}>
              {"Connect"}
            </Button>
            <Button type="main" onPress={this.disconnect}>
              {"Disconnect"}
            </Button>
            <Button outline type="main" onPress={this.toggleConnectionPriority}>
              {"Change Prio"}
            </Button>
            <Button outline type="main" onPress={this.inferMTU}>
              {"Infer MTU"}
            </Button>
          </ScrollView>
        </View>
      </KeyboardView>
    );
  }
}

export default DebugBLE;
