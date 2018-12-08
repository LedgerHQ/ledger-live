// @flow

import React, { PureComponent } from "react";
import { View } from "react-native";
import Confetti1 from "../../icons/confetti/confetti1";
import Confetti2 from "../../icons/confetti/confetti2";
import Confetti3 from "../../icons/confetti/confetti3";
import Confetti4 from "../../icons/confetti/confetti4";
import Confetti from "./Confetti";

const shapes = [Confetti1, Confetti2, Confetti3, Confetti4];

let id = 1;

const nextConfetti = (mode: ?string) =>
  mode === "emit"
    ? {
        id: id++,
        shape: shapes[Math.floor(shapes.length * Math.random())],
        initialRotation: 360 * Math.random(),
        initialYPercent: -0.05,
        initialXPercent:
          0.5 +
          0.5 *
            Math.cos(Date.now() / 1000) *
            (0.5 + 0.5 * Math.sin(Date.now() / 6000)),
        initialScale: 1,
        rotations: 4 * Math.random() - 2,
        delta: [(Math.random() - 0.5) * 200, 600 + 200 * Math.random()],
        duration: 10000,
      }
    : {
        id: id++,
        shape: shapes[Math.floor(shapes.length * Math.random())],
        initialRotation: 360 * Math.random(),
        initialYPercent: -0.04 + -0.25 * Math.random(),
        initialXPercent: 0.2 + 0.6 * Math.random(),
        initialScale: 1,
        rotations: 8 * Math.random() - 4,
        delta: [(Math.random() - 0.5) * 1500, 500 + 500 * Math.random()],
        duration: 12000 + 8000 * Math.random(),
      };

class ConfettiParty extends PureComponent<
  { emit: boolean },
  { confettis: Array<Object> },
> {
  state = {
    // $FlowFixMe
    confettis: Array(100)
      .fill(null)
      .map(nextConfetti),
  };

  componentDidMount() {
    this.setEmit(this.props.emit);
    this.initialTimeout = setTimeout(() => {
      clearInterval(this.initialInterval);
    }, 5000);
    this.initialInterval = setInterval(() => {
      this.setState(({ confettis }) => ({
        confettis: confettis
          .slice(confettis.length > 200 ? 1 : 0)
          .concat(nextConfetti()),
      }));
    }, 100);
  }

  componentDidUpdate(prevProps: *) {
    if (this.props.emit !== prevProps.emit) {
      this.setEmit(this.props.emit);
    }
  }

  componentWillUnmount() {
    this.setEmit(false);
    clearInterval(this.initialInterval);
    clearTimeout(this.initialTimeout);
  }

  setEmit(on: boolean) {
    if (on) {
      this.interval = setInterval(() => {
        this.setState(({ confettis }) => ({
          confettis: confettis
            .slice(confettis.length > 200 ? 1 : 0)
            .concat(nextConfetti("emit")),
        }));
      }, 40);
    } else {
      clearInterval(this.interval);
    }
  }
  interval: *;
  initialInterval: *;
  initialTimeout: *;

  render() {
    const { confettis } = this.state;
    return (
      <View style={{ position: "relative", width: "100%", height: "100%" }}>
        {confettis.map(c => (
          <Confetti key={c.id} {...c} />
        ))}
      </View>
    );
  }
}

export default ConfettiParty;
