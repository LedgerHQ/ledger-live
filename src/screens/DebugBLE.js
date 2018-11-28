// @flow

import React, { Component } from "react";
import {
  FlatList,
  StyleSheet,
  TextInput,
  View,
  Clipboard,
  ToastAndroid,
  Switch,
} from "react-native";
import { from, of } from "rxjs";
import { concatMap, bufferTime } from "rxjs/operators";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import { knownDevicesSelector } from "../reducers/ble";
import LText from "../components/LText";
import Button from "../components/Button";
import KeyboardView from "../components/KeyboardView";
import colors from "../colors";
import type { Log } from "../react-native-hw-transport-ble/debug";
import { logsObservable } from "../react-native-hw-transport-ble/debug";
import { withDevice } from "../logic/hw/deviceAccess";
import { disconnect } from "../logic/hw";

const styles = StyleSheet.create({
  root: {
    paddingTop: 16,
    paddingBottom: 64,
  },
});

const mapLogToText = (log: Log) => {
  switch (log.type) {
    case "ble-apdu-in":
      return "";

    case "ble-frame-in":
      return `<=  ${String(log.message)}`;

    case "ble-frame-out":
      return `=>  ${String(log.message)}`;

    case "ble-apdu-out":
      return "DONE";

    default:
      return log.message;
  }
};

class LogItem extends Component<{ log: Log }> {
  render() {
    const { log } = this.props;
    const text = mapLogToText(log);
    return (
      <View
        style={{
          padding: 5,
          borderBottomWidth: 1,
          borderBottomColor: colors.lightFog,
          flexDirection: "row",
        }}
      >
        <LText style={{ fontSize: 10, flex: 1 }}>{text}</LText>
        <LText style={{ fontSize: 8 }}>{log.date.toISOString()}</LText>
      </View>
    );
  }
}

class DebugBLE extends Component<
  {
    navigation: NavigationScreenProp<*>,
    devices: *,
  },
  {
    logs: Log[],
    apdu: string,
    loopMode: boolean,
  },
> {
  static navigationOptions = ({ navigation }) => ({
    title: "Debug BLE",
    headerRight: (
      <Button
        containerStyle={{ width: 80 }}
        type="lightSecondary"
        title="Options"
        onPress={() => navigation.navigate("DebugBLEOptions")}
      />
    ),
  });

  state = {
    logs: [],
    apdu: "E0FF0000FE000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfd".toUpperCase(),
    loopMode: false,
  };

  sub: *;

  componentDidMount() {
    this.sub = logsObservable.pipe(bufferTime(200)).subscribe(buffer => {
      this.setState(
        ({ logs }) =>
          buffer.length === 0 ? null : { logs: logs.concat(buffer) },
      );
    });
  }

  componentWillUnmount() {
    if (this.sub) this.sub.unsubscribe();
  }

  keyExtractor = (item: Log) => String(item.id);

  renderItem = ({ item }: { item: Log }) => (
    <View style={{ transform: [{ scaleY: -1 }] }}>
      <LogItem log={item} />
    </View>
  );

  copy = () => {
    const content = this.state.logs.map(mapLogToText).join("\n");
    Clipboard.setString(content);
    ToastAndroid.show("logs copied!", ToastAndroid.SHORT);
  };

  onAPDUChange = (apdu: string) => {
    this.setState({
      apdu,
    });
  };

  send = async () => {
    const {
      devices: [knownDevice],
    } = this.props;
    const { apdu } = this.state;
    const msg = Buffer.from(apdu, "hex");
    if (msg.length < 5) return;

    const step = () =>
      withDevice(knownDevice.id)(t => from(t.exchange(msg))).pipe(
        concatMap(() => {
          if (this.state.loopMode) {
            return step();
          }
          return of(null);
        }),
      );

    await step().toPromise();
  };

  inferMTU = async () => {
    const {
      devices: [device],
    } = this.props;
    const mtu = await withDevice(device.id)(t =>
      // $FlowFixMe bro i know
      from(t.inferMTU()),
    ).toPromise();
    ToastAndroid.show("mtu set to " + mtu, ToastAndroid.SHORT);
  };

  currentConnectionPriority = "Balanced";
  toggleConnectionPriority = async () => {
    const {
      devices: [device],
    } = this.props;
    const choices = ["Balanced", "High", "LowPower"];
    const nextPriority =
      choices[
        (choices.indexOf(this.currentConnectionPriority) + 1) % choices.length
      ];
    this.currentConnectionPriority = nextPriority;
    await withDevice(device.id)(t =>
      // $FlowFixMe bro i know
      from(t.requestConnectionPriority(nextPriority)),
    ).toPromise();
    ToastAndroid.show(
      "connection priority set to " + nextPriority,
      ToastAndroid.SHORT,
    );
  };

  connect = async () => {
    const {
      devices: [device],
    } = this.props;
    await withDevice(device.id)(() => from([{}])).toPromise();
  };

  disconnect = async () => {
    const {
      devices: [device],
    } = this.props;
    await disconnect(device.id);
  };

  onLoopMode = () => {
    this.setState(({ loopMode }) => ({ loopMode: !loopMode }));
  };

  onLoopModeOff = () => {
    this.setState({ loopMode: false });
  };

  render() {
    const {
      devices: [device],
    } = this.props;
    const { logs, loopMode } = this.state;
    return (
      <KeyboardView style={{ flex: 1 }}>
        <View
          style={{
            padding: 5,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <LText bold>BLE Framing logs</LText>
          <Button
            containerStyle={{ width: 100 }}
            type="lightSecondary"
            title="Copy"
            onPress={this.copy}
          />
        </View>
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
            placeholder="E0D2000000"
            onFocus={this.onLoopModeOff}
            onChangeText={this.onAPDUChange}
            value={this.state.apdu}
            autoCapitalize="characters"
            autoCorrect={false}
            onSubmitEditing={this.send}
          />
          <Button
            containerStyle={{ width: 60 }}
            type="lightSecondary"
            title="Send"
            onPress={this.send}
          />
          <Switch value={loopMode} onValueChange={this.onLoopMode} />
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
            <LText style={{ fontSize: 12 }}>{device.id}</LText>
            <LText bold style={{ fontSize: 12 }}>
              {device.name}
            </LText>
          </View>
          <Button
            containerStyle={{ width: 60, marginRight: 8 }}
            type="lightSecondary"
            title="change prio"
            onPress={this.toggleConnectionPriority}
          />
          <Button
            containerStyle={{ width: 60, marginRight: 8 }}
            type="lightSecondary"
            title="infer MTU"
            onPress={this.inferMTU}
          />
          <Button
            containerStyle={{ width: 40, marginRight: 8 }}
            type="primary"
            title="CO"
            onPress={this.connect}
          />
          <Button
            containerStyle={{ width: 40 }}
            type="primary"
            title="DI"
            onPress={this.disconnect}
          />
        </View>
      </KeyboardView>
    );
  }
}

export default connect(
  createStructuredSelector({
    devices: knownDevicesSelector,
  }),
)(DebugBLE);
