// @flow

import React, { Component, memo } from "react";
import {
  FlatList,
  StyleSheet,
  TextInput,
  View,
  ToastAndroid,
  ScrollView,
} from "react-native";
import { v4 as uuid } from "uuid";
import { from, Observable } from "rxjs";
import { listen } from "@ledgerhq/logs";
import type { Log } from "@ledgerhq/logs";
import { bufferTime, shareReplay } from "rxjs/operators";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import { disconnect } from "@ledgerhq/live-common/lib/hw";
import { useTheme } from "@react-navigation/native";
import LText from "../components/LText";
import Button from "../components/Button";
import KeyboardView from "../components/KeyboardView";
import Switch from "../components/Switch";

const logsObservable = Observable.create(o => listen(log => o.next(log))).pipe(
  shareReplay(1000),
);

logsObservable.subscribe();

const styles = StyleSheet.create({
  root: {
    paddingTop: 16,
    paddingBottom: 64,
  },
});

const mapLogToColor = (colors: *, log: Log) => {
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
      <LText selectable style={{ fontSize: 10, flex: 1, color }}>
        {text}
      </LText>
      <LText style={{ marginRight: 5, fontSize: 8 }}>
        {log.date
          .toISOString()
          .split("T")[1]
          .replace("Z", "")}
      </LText>
    </View>
  );
}

const LogItem = memo<{ log: Log }>(LogItemComponent);

type Props = {
  navigation: any,
  route: { params: RouteParams },
  device: any,
};

type RouteParams = {
  deviceId: string,
};

class DebugBLE extends Component<
  Props,
  {
    logs: Log[],
    apdu: string,
    bleframe: string,
    useBLEframe: boolean,
  },
> {
  state = {
    logs: [],
    apdu: "E0FF0000FE000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfd".toUpperCase(),
    bleframe: "0800000000",
    useBLEframe: false,
  };

  sub: *;

  componentDidMount() {
    this.sub = logsObservable.pipe(bufferTime(200)).subscribe(buffer => {
      this.setState(({ logs }) =>
        buffer.length === 0 ? null : { logs: logs.concat(buffer) },
      );
    });
  }

  componentWillUnmount() {
    if (this.sub) this.sub.unsubscribe();
  }

  keyExtractor = (item: Log) => item.id;

  renderItem = ({ item }: { item: Log }) => (
    <View style={{ transform: [{ scaleY: -1 }] }}>
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
      await withDevice(deviceId)(t =>
        // $FlowFixMe
        from(useBLEframe ? t.write(msg) : t.exchange(msg)),
      ).toPromise();
    } catch (error) {
      this.addError(error, "send");
    }
  };

  inferMTU = async () => {
    const deviceId = this.props.route.params?.deviceId;
    try {
      const mtu = await withDevice(deviceId)(t =>
        // $FlowFixMe bro i know
        from(t.inferMTU()),
      ).toPromise();
      ToastAndroid.show("mtu set to " + mtu, ToastAndroid.SHORT);
    } catch (error) {
      this.addError(error, "inferMTU");
    }
  };

  currentConnectionPriority = "Balanced";
  toggleConnectionPriority = async () => {
    const deviceId = this.props.route.params?.deviceId;
    const choices = ["Balanced", "High", "LowPower"];
    const nextPriority =
      choices[
        (choices.indexOf(this.currentConnectionPriority) + 1) % choices.length
      ];
    this.currentConnectionPriority = nextPriority;
    try {
      await withDevice(deviceId)(t =>
        // $FlowFixMe bro i know
        from(t.requestConnectionPriority(nextPriority)),
      ).toPromise();
      ToastAndroid.show(
        "connection priority set to " + nextPriority,
        ToastAndroid.SHORT,
      );
    } catch (error) {
      this.addError(error, "changePrio");
    }
  };

  connect = async () => {
    const deviceId = this.props.route.params?.deviceId;
    try {
      await withDevice(deviceId)(() => from([{}])).toPromise();
    } catch (error) {
      this.addError(error, "connect");
    }
  };

  disconnect = async () => {
    const deviceId = this.props.route.params?.deviceId;
    try {
      await disconnect(deviceId);
    } catch (error) {
      this.addError(error, "disconnect");
    }
  };

  onBleFrameChange = () => {
    this.setState(({ useBLEframe }) => ({ useBLEframe: !useBLEframe }));
  };

  render() {
    const deviceId = this.props.route.params?.deviceId;
    const { logs, useBLEframe } = this.state;
    return (
      <KeyboardView style={{ flex: 1 }}>
        <FlatList
          style={{ flex: 1, transform: [{ scaleY: -1 }] }}
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
            onChangeText={
              useBLEframe ? this.onBLEframeChange : this.onAPDUChange
            }
            value={useBLEframe ? this.state.bleframe : this.state.apdu}
            autoCapitalize="characters"
            autoCorrect={false}
            onSubmitEditing={this.send}
          />
          <Button
            type="lightSecondary"
            event="DebugBLESend"
            title="Send"
            onPress={this.send}
          />
          <Switch value={useBLEframe} onValueChange={this.onBleFrameChange} />
        </View>
        <LText style={{ fontSize: 10, margin: 8 }}>{deviceId}</LText>
        <View style={{ maxHeight: 80 }}>
          <ScrollView horizontal style={{ padding: 16 }}>
            <Button
              containerStyle={{ marginRight: 8 }}
              event="DebugBLEPRIO"
              outline
              type="primary"
              title="Change Prio"
              onPress={this.toggleConnectionPriority}
            />
            <Button
              containerStyle={{ marginRight: 8 }}
              event="DebugBLEMTU"
              outline
              type="primary"
              title="Infer MTU"
              onPress={this.inferMTU}
            />
            <Button
              containerStyle={{ marginRight: 8 }}
              event="DebugBLECO"
              type="primary"
              title="Connect"
              onPress={this.connect}
            />
            <Button
              event="DebugBLEDI"
              type="primary"
              title="Disconnect"
              onPress={this.disconnect}
            />
          </ScrollView>
        </View>
      </KeyboardView>
    );
  }
}

export default DebugBLE;
