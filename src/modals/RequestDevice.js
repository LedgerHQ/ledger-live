// @flow
import React, { Component } from "react";
import { StyleSheet, Text, View, Modal, ActivityIndicator } from "react-native";
import type Transport from "@ledgerhq/hw-transport";
import findFirstTransport from "../hw/findFirstTransport";

export default class RequestDevice extends Component<
  {
    onTransport: (Transport<*>) => Promise<any>,
    onTransportError: (?Error) => void,
    loadTimeout: number
  },
  *
> {
  sub: *;
  timeout: *;
  state = {
    error: null,
    visible: false
  };
  static defaultProps = {
    loadTimeout: 1000
  };

  componentWillMount() {
    this.timeout = setTimeout(
      () => this.setState({ visible: true }),
      this.props.loadTimeout
    );
    this.sub = findFirstTransport().subscribe(
      this.onTransport,
      this.onTransportError
    );
  }

  componentWillUnmount() {
    this.stop();
  }

  onTransport = async (t: Transport<*>) => {
    this.setState({ visible: false });
    this.stop();
    await this.props.onTransport(t);
    t.close();
  };

  onTransportError = async (error: ?Error) => {
    this.props.onTransportError(error);
    this.setState({ error });
  };

  stop = () => {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    if (this.sub) {
      this.sub.unsubscribe();
      this.sub = null;
    }
  };

  onRequestClose = () => {
    this.stop();
  };

  render() {
    const { error, visible } = this.state;
    return (
      <Modal
        visible={visible}
        animationType="fade"
        onRequestClose={this.onRequestClose}
      >
        <View style={styles.root}>
          <Text>Please Connect a Device</Text>
          <View style={styles.body}>
            {!error ? <ActivityIndicator /> : null}
            <Text>{error ? error.toString() : null}</Text>
          </View>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  body: {
    padding: 20
  }
});
