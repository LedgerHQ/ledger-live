/* @flow */
import React, { Component } from "react";
import { View, ActivityIndicator } from "react-native";
import { withCounterValuePolling } from "./CounterValuePolling";
import type { CounterValuePolling } from "./CounterValuePolling";

class Header extends Component<{
  counterValuePolling: CounterValuePolling
}> {
  render() {
    const { counterValuePolling } = this.props;
    return counterValuePolling.pending ? (
      <ActivityIndicator color="white" />
    ) : (
      <View
        style={{
          // TODO proper design
          backgroundColor: counterValuePolling.error ? "red" : "green",
          width: 8,
          height: 8,
          borderRadius: 8
        }}
      />
    );
  }
}

export default withCounterValuePolling(Header);
