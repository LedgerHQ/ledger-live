// @flow

import React, { Component } from "react";
import {
  FlatList,
  StyleSheet,
  TextInput,
  View,
  Clipboard,
  ToastAndroid,
} from "react-native";
import { from } from "rxjs";
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
  },
> {
  static navigationOptions = {
    title: "Debug BLE – oto edition™",
  };

  state = {
    logs: [],
    apdu: "E001000000",
  };

  sub: *;

  componentDidMount() {
    this.sub = logsObservable.subscribe(log => {
      this.setState(({ logs }) => ({ logs: logs.concat(log) }));
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
    await withDevice(knownDevice.id)(t => from(t.exchange(msg))).toPromise();
  };

  render() {
    const { logs } = this.state;
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
            placeholder="E0D2000000"
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
