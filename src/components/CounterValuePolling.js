// @flow
import React from "react";
import { AppState } from "react-native";
import hoistNonReactStatic from "hoist-non-react-statics";
import throttle from "lodash/throttle";
import { pollRates } from "../actions/counterValues";

// $FlowFixMe
export const PollingContext = React.createContext(() => {});

export type CounterValuePolling = {
  poll: () => Promise<*>,
  polling: boolean
};

export class CounterValuePollingProvider extends React.Component<
  {
    children: *,
    store: *,
    pollInitDelay: number,
    pollThrottle: number,
    autopollInterval: number
  },
  CounterValuePolling
> {
  static defaultProps = {
    pollInitDelay: 1 * 1000,
    pollThrottle: 10 * 1000,
    autopollInterval: 120 * 1000
  };

  poll = throttle(() => {
    const { store } = this.props;
    return new Promise((success, failure) => {
      this.setState(prevState => {
        if (prevState.polling) return null;
        store
          .dispatch(pollRates())
          .then(() => {
            if (this.unmounted) return;
            this.setState({ polling: false }, () => {
              success();
            });
          })
          .catch(e => {
            this.setState({ polling: false }, () => {
              failure(e);
            });
          });
        return { polling: true };
      });
    });
  }, this.props.pollThrottle);

  state = {
    polling: false,
    poll: this.poll
  };

  interval: *;
  initTimeout: *;
  unmounted = false;

  componentDidMount() {
    AppState.addEventListener("change", this.handleAppStateChange);
    this.initTimeout = setTimeout(this.initPolling, this.props.pollInitDelay);
  }

  componentWillUnmount() {
    AppState.removeEventListener("change", this.handleAppStateChange);
    clearInterval(this.interval);
    clearTimeout(this.initTimeout);
    this.unmounted = true;
  }

  handleAppStateChange = (nextAppState: string) => {
    if (nextAppState === "active") {
      this.initPolling();
    } else {
      clearInterval(this.interval);
    }
  };

  initPolling = () => {
    clearInterval(this.interval);
    this.interval = setInterval(this.poll, this.props.autopollInterval);
    this.poll();
  };

  render() {
    return (
      <PollingContext.Provider value={this.state}>
        {this.props.children}
      </PollingContext.Provider>
    );
  }
}

// TODO improve flow types
export const withCounterValuePolling = (Cmp: *) => {
  class WithCounterValuePolling extends React.Component<*> {
    render() {
      return (
        <PollingContext.Consumer>
          {counterValuePolling => (
            <Cmp counterValuePolling={counterValuePolling} {...this.props} />
          )}
        </PollingContext.Consumer>
      );
    }
  }
  hoistNonReactStatic(WithCounterValuePolling, Cmp);
  return WithCounterValuePolling;
};
