// @flow

import React, { Component, PureComponent } from "react";
import {
  FlatList,
  StyleSheet,
  TextInput,
  View,
  ToastAndroid,
  Switch,
} from "react-native";
import uuid from "uuid/v4";
import { from, Observable } from "rxjs";
import { listen } from "@ledgerhq/logs";
import type { Log } from "@ledgerhq/logs";
import { bufferTime, shareReplay } from "rxjs/operators";
import type { NavigationScreenProp } from "react-navigation";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import { disconnect } from "@ledgerhq/live-common/lib/hw";
import LText from "../components/LText";
import Button from "../components/Button";
import KeyboardView from "../components/KeyboardView";
import colors from "../colors";

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

const mapLogToColor = (log: Log) => {
  if (log.type.includes("error")) return colors.alert;
  if (log.type === "verbose") return colors.grey;
  if (log.type.includes("frame")) return colors.live;
  if (log.type.includes("apdu")) return colors.success;
  return colors.darkBlue;
};

const mapLogToText = (log: Log) => log.message;

class LogItem extends PureComponent<{ log: Log }> {
  render() {
    const { log } = this.props;
    const text = mapLogToText(log);
    const color = mapLogToColor(log);
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
}

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
    logs: Log[],
    apdu: string,
    bleframe: string,
    useBLEframe: boolean,
  },
> {
  static navigationOptions = ({ navigation }: *) => ({
    title: "Debug BLE",
    headerRight: (
      <Button
        event="DebugBLEBenchmark"
        type="lightSecondary"
        containerStyle={{ width: 100 }}
        onPress={() =>
          navigation.navigate("DebugBLEBenchmark", {
            deviceId: navigation.getParam("deviceId"),
          })
        }
        title="Benchmark"
      />
    ),
  });

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
    const { navigation } = this.props;
    const deviceId = navigation.getParam("deviceId");
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
    const { navigation } = this.props;
    const deviceId = navigation.getParam("deviceId");
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
    const { navigation } = this.props;
    const deviceId = navigation.getParam("deviceId");
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
    const { navigation } = this.props;
    const deviceId = navigation.getParam("deviceId");
    try {
      await withDevice(deviceId)(() => from([{}])).toPromise();
    } catch (error) {
      this.addError(error, "connect");
    }
  };

  disconnect = async () => {
    const { navigation } = this.props;
    const deviceId = navigation.getParam("deviceId");
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
    const { navigation } = this.props;
    const deviceId = navigation.getParam("deviceId");
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
            containerStyle={{ width: 60 }}
            type="lightSecondary"
            event="DebugBLESend"
            title="Send"
            onPress={this.send}
          />
          <Switch value={useBLEframe} onValueChange={this.onBleFrameChange} />
        </View>

        <View
          style={{
            padding: 10,
            borderBottomWidth: 1,
            borderBottomColor: colors.lightFog,
            flexDirection: "row",
          }}
        >
          <View
            style={{
              flexDirection: "column",
              flex: 1,
              justifyContent: "space-around",
            }}
          >
            <LText style={{ fontSize: 10 }}>{deviceId}</LText>
          </View>
          <Button
            containerStyle={{ width: 56, marginRight: 8 }}
            event="DebugBLEPRIO"
            type="lightSecondary"
            title="change prio"
            onPress={this.toggleConnectionPriority}
          />
          <Button
            containerStyle={{ width: 50, marginRight: 8 }}
            event="DebugBLEMTU"
            type="lightSecondary"
            title="infer MTU"
            onPress={this.inferMTU}
          />
          <Button
            containerStyle={{ width: 38, marginRight: 8 }}
            event="DebugBLECO"
            type="primary"
            title="CO"
            onPress={this.connect}
          />
          <Button
            event="DebugBLEDI"
            containerStyle={{ width: 38 }}
            type="primary"
            title="DI"
            onPress={this.disconnect}
          />
        </View>
      </KeyboardView>
    );
  }
}

export default DebugBLE;
