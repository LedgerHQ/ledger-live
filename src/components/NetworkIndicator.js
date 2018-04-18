/* @flow */
import React, { Component } from "react";
import { View, TouchableOpacity } from "react-native";
import { withCounterValuePolling } from "../context/CounterValuePolling";
import type { CounterValuePolling } from "../context/CounterValuePolling";

class Header extends Component<{
  counterValuePolling: CounterValuePolling
}> {
  render() {
    const { counterValuePolling } = this.props;
    return (
      <TouchableOpacity onPress={counterValuePolling.poll}>
        <View
          style={{
            // TODO proper design
            backgroundColor: counterValuePolling.pending
              ? "#69f"
              : counterValuePolling.error ? "#f22" : "#6f6",
            width: 8,
            height: 8,
            borderRadius: 8
          }}
        />
      </TouchableOpacity>
    );
  }
}

export default withCounterValuePolling(Header);
