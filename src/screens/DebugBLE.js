// @flow

import React, { Component } from "react";
import {
  FlatList,
  StyleSheet,
  View,
  Clipboard,
  ToastAndroid,
} from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import LText from "../components/LText";
import Button from "../components/Button";
import colors from "../colors";
import type { Log } from "../react-native-hw-transport-ble/debug";
import { logsObservable } from "../react-native-hw-transport-ble/debug";

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
        }}
      >
        <LText style={{ fontSize: 10 }}>{text}</LText>
      </View>
    );
  }
}

export default class DebugBLE extends Component<
  {
    navigation: NavigationScreenProp<*>,
  },
  {
    logs: Log[],
  },
> {
  static navigationOptions = {
    title: "Debug BLE – oto edition™",
  };

  state = {
    logs: [],
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

  renderItem = ({ item }: { item: Log }) => <LogItem log={item} />;

  copy = () => {
    const content = this.state.logs.map(mapLogToText).join("\n");
    Clipboard.setString(content);
    ToastAndroid.show("logs copied!", ToastAndroid.SHORT);
  };

  render() {
    const { logs } = this.state;
    return (
      <View style={{ flex: 1 }}>
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
          style={{ flex: 1 }}
          data={logs}
          renderItem={this.renderItem}
          keyExtractor={this.keyExtractor}
          contentContainerStyle={styles.root}
        />
      </View>
    );
  }
}
