// FIXME shim want to set it to false tho...
if (__DEV__ && process.env.NODE_ENV !== "test") {
  setTimeout(() => {
    // it logs weird things without the timeout...
    try {
      // just for tests
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("react-native").LogBox.ignoreLogs([
        "Warning: isMounted(...) is deprecated in plain JavaScript React classes. Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks.",
        "Setting a timer for a long period of time, i.e. multiple minutes, is a performance and correctness issue on Android as it keeps the timer module awake, and timers can only be called when the app is in the foreground. See https://github.com/facebook/react-native/issues/12981 for more info.",
        "Warning: componentWillReceiveProps has been renamed",
        "Warning: componentWillUpdate has been renamed",
        "Warning: componentWillMount has been renamed",
        "exported from 'deprecated-react-native-prop-types'.", // https://github.com/facebook/react-native/issues/33557#issuecomment-1093083115
      ]);
    } catch (e) {
      console.warn(e);
    }
  }, 100);
}
