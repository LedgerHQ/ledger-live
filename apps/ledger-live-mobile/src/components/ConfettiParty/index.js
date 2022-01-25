// @flow

import React, { PureComponent } from "react";
import { View, InteractionManager } from "react-native";
import Config from "react-native-config";
import Confetti1 from "../../icons/confetti/confetti1";
import Confetti2 from "../../icons/confetti/confetti2";
import Confetti3 from "../../icons/confetti/confetti3";
import Confetti4 from "../../icons/confetti/confetti4";
import Confetti from "./Confetti";

const shapes = [Confetti1, Confetti2, Confetti3, Confetti4];
let id = 0;

const confettiMap = () => (
  <Confetti
    key={id++}
    {...{
      shape: shapes[Math.floor(shapes.length * Math.random())],
      initialRotation: 360 * Math.random(),
      initialYPercent: -0.04 + -0.25 * Math.random(),
      initialXPercent: 0.2 + 0.6 * Math.random(),
      initialScale: 1,
      rotations: 8 * Math.random() - 4,
      delta: [(Math.random() - 0.5) * 1500, 500 + 500 * Math.random()],
      duration: 12000 + 8000 * Math.random(),
    }}
  />
);

class ConfettiParty extends PureComponent<*, { confetti: Array<Object> }> {
  state = { confetti: [] };
  handler: *;

  componentDidMount() {
    if (Config.MOCK) return;
    this.handler = InteractionManager.runAfterInteractions(() => {
      this.emitConfetti();
    });
  }

  componentWillUnmount() {
    if (this.handler) this.handler.cancel();
  }

  emitConfetti = () => {
    this.setState(prevState => ({
      confetti: [
        ...prevState.confetti,
        ...Array(100)
          .fill(null)
          .map(confettiMap),
      ],
    }));
  };

  render() {
    return (
      <View style={{ position: "relative", width: "100%", height: "100%" }}>
        {this.state.confetti}
      </View>
    );
  }
}

export default ConfettiParty;
