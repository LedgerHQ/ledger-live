// @flow
import React from "react";
import { AppState, NetInfo } from "react-native";
import { connect } from "react-redux";
import hoistNonReactStatic from "hoist-non-react-statics";
import throttle from "lodash/throttle";
import { pollRates } from "../actions/counterValues";

// $FlowFixMe
export const PollingContext = React.createContext(() => {});

export type CounterValuePolling = {
  poll: () => Promise<boolean>,
  flush: () => void,
  pending: boolean,
  error: ?Error
};

class CounterValuePollingProvider_ extends React.Component<
  {
    children: *,
    pollRates: () => *,
    pollThrottle: number,
    pollInitDelay: number,
    connectionRecoveredDelay: number,
    activeAppDelay: number,
    autopollInterval: number
  },
  CounterValuePolling
> {
  static defaultProps = {
    // the minimum time between two polls. to prevent spamming the API.
    pollThrottle: 10 * 1000,
    // the time to wait before the first poll when app starts (allow things to render to not do all at boot time)
    pollInitDelay: 1 * 1000,
    // the time to wait before polling after network is back
    connectionRecoveredDelay: 3 * 1000,
    // the time to wait before polling after appState is back to active
    activeAppDelay: 2 * 1000,
    // the minimum time to wait before two automatic polls (then one that happen whatever network/appstate events)
    autopollInterval: 120 * 1000
  };

  schedulePoll = (ms: number) => {
    clearTimeout(this.pollTimeout);
    this.pollTimeout = setTimeout(this.poll, ms);
  };
  cancelPoll = () => {
    clearTimeout(this.pollTimeout);
  };

  poll = throttle(() => {
    // we are always scheduling the next poll() (for automatic poll mecanism)
    // this is not in a setInterval because we don't want poll() to happen too often & always will push the next automatic call as far as possible
    this.schedulePoll(this.props.autopollInterval);

    return new Promise(success => {
      this.setState(prevState => {
        if (prevState.pending) return null; // prevent concurrency calls.

        this.props
          .pollRates()
          // TODO pollRates() should have a timeout, because we don't want this promise to hang forever
          .then(() => {
            if (this.unmounted) return;
            this.setState({ pending: false, error: null }, () => {
              success(true);
            });
          })
          .catch(error => {
            if (this.unmounted) return;
            this.setState({ pending: false, error }, () => {
              // we don't reject the promise because we handle the error.
              success(false);
              // we want to disable next throttle because network problem
              // this gives opportunity for user to pull straight away.
              this.poll.cancel();
            });
          });
        return { pending: true, error: null };
      });
    });
  }, this.props.pollThrottle);

  state = {
    pending: false,
    poll: this.poll,
    flush: this.poll.flush,
    error: null
  };

  pollTimeout: *;
  unmounted = false;

  appIsActive = true;
  // assuming we are connected because we want to start polling when we go connected again
  networkIsConnected = true;

  componentDidMount() {
    AppState.addEventListener("change", this.handleAppStateChange);
    NetInfo.isConnected.addEventListener(
      "connectionChange",
      this.handleConnectivityChange
    );
    this.schedulePoll(this.props.pollInitDelay);
  }

  componentWillUnmount() {
    AppState.removeEventListener("change", this.handleAppStateChange);
    NetInfo.isConnected.removeEventListener(
      "connectionChange",
      this.handleConnectivityChange
    );
    clearTimeout(this.pollTimeout);
    this.unmounted = true;
  }

  handleAppStateChange = (nextAppState: string) => {
    clearTimeout(this.pollTimeout);
    if (nextAppState === "active") {
      this.appIsActive = true;
      // poll when coming back
      this.schedulePoll(this.props.activeAppDelay);
    } else {
      this.appIsActive = false;
      this.cancelPoll();
    }
  };

  handleConnectivityChange = (isConnected: boolean) => {
    if (isConnected && !this.networkIsConnected && this.appIsActive) {
      // poll when recovering a connection
      this.schedulePoll(this.props.connectionRecoveredDelay);
    }
    this.networkIsConnected = isConnected;
  };

  render() {
    return (
      <PollingContext.Provider value={this.state}>
        {this.props.children}
      </PollingContext.Provider>
    );
  }
}

export const CounterValuePollingProvider = connect(null, { pollRates })(
  CounterValuePollingProvider_
);

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
