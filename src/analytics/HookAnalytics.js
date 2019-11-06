import { Component } from "react";
import { connect } from "react-redux";
import { hasCompletedOnboardingSelector } from "../reducers/settings";
import { start } from "./segment";

let isAnalyticsStarted = false;

class HookAnalytics extends Component<{
  store: *,
}> {
  componentDidMount() {
    this.sync();
  }

  componentDidUpdate() {
    this.sync();
  }

  sync = () => {
    if (isAnalyticsStarted) return;
    const { store } = this.props;
    const state = store.getState();
    const hasCompletedOnboarding = hasCompletedOnboardingSelector(state);
    if (hasCompletedOnboarding) {
      isAnalyticsStarted = true;
      start(store);
    }
  };

  render() {
    return null;
  }
}

export default connect()(HookAnalytics);
