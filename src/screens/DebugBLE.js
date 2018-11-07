// @flow

import React, { Component } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Observable } from "rxjs";
import type { NavigationScreenProp } from "react-navigation";
import LText from "../components/LText";
import Button from "../components/Button";
import TransportBLE from "../react-native-hw-transport-ble";
import colors from "../colors";

const styles = StyleSheet.create({
  root: {
    paddingTop: 16,
    paddingBottom: 64,
  },
});

class DeviceItem extends Component<{ device: * }, *> {
  state = {
    data: null,
    error: null,
  };

  onPress = async () => {
    this.setState({ data: null, error: null });
    const { device } = this.props;
    try {
      const transport = await TransportBLE.open(device.id);
      transport.setDebugMode(true);
      try {
        const data = await transport.send(0, 0, 0, 0);
        this.setState({ data });
      } finally {
        transport.close();
      }
    } catch (error) {
      this.setState({ error });
    }
  };

  render() {
    const { device } = this.props;
    const { data, error } = this.state;
    return (
      <View
        style={{
          margin: 5,
          padding: 5,
          borderBottomWidth: 1,
          borderBottomColor: colors.grey,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <LText semiBold numberOfLines={1} style={{ fontSize: 14, flex: 2 }}>
            {device.name}
          </LText>
          <Button
            containerStyle={{ flex: 1 }}
            type="secondary"
            title="send APDU"
            onPress={this.onPress}
          />
        </View>
        {data ? (
          <LText style={{ color: colors.success }}>
            {data.toString("hex")}
          </LText>
        ) : null}
        {error ? (
          <LText style={{ color: colors.alert }}>{String(error)}</LText>
        ) : null}
      </View>
    );
  }
}

export default class DebugBLE extends Component<
  {
    navigation: NavigationScreenProp<*>,
  },
  {
    items: *[],
    bleError: ?Error,
    scanning: boolean,
  },
> {
  static navigationOptions = {
    title: "Debug BLE",
  };

  state = {
    items: [],
    bleError: null,
    scanning: false,
  };

  sub: *;

  componentDidMount() {
    this.startScan();
  }

  startScan = () => {
    this.setState({ scanning: true });

    this.sub = Observable.create(TransportBLE.listen).subscribe({
      complete: () => {
        this.setState({ scanning: false });
      },
      next: e => {
        if (e.type === "add") {
          const device = e.descriptor;
          this.setState(({ items }) => ({
            // FIXME seems like we have dup. ideally we'll remove them on the listen side!
            items: items.some(i => i.id === device.id)
              ? items
              : items.concat(device),
          }));
        }
      },
      error: bleError => {
        this.setState({ bleError, scanning: false });
      },
    });
  };

  componentWillUnmount() {
    if (this.sub) this.sub.unsubscribe();
  }

  renderItem = ({ item }: { item: * }) => <DeviceItem device={item} />;

  keyExtractor = (item: *) => item.id;

  reload = async () => {
    if (this.sub) this.sub.unsubscribe();
    this.startScan();
  };

  render() {
    const { items, bleError } = this.state;
    return (
      <View style={{ flex: 1 }}>
        {bleError ? <LText>{bleError.message}</LText> : null}
        <Button
          type="primary"
          title="Re-scan"
          onPress={this.reload}
          style={{ margin: 20 }}
        />
        <FlatList
          style={{ flex: 1 }}
          data={items}
          renderItem={this.renderItem}
          keyExtractor={this.keyExtractor}
          contentContainerStyle={styles.root}
        />
      </View>
    );
  }
}
