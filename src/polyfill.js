/* eslint-disable no-console */
global.Buffer = require("buffer").Buffer;

if (!console.assert) {
  console.assert = () => {};
}

process.browser = true; // for readable-stream/lib/_stream_writable.js
// FIXME shim want to set it to false tho...

if (__DEV__ && process.env.NODE_ENV !== "test") {
  setTimeout(() => {
    // it logs weird things without the timeout...
    try {
      // just for tests
      require("react-native").LogBox.ignoreLogs([
        "Warning: isMounted(...) is deprecated in plain JavaScript React classes. Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks.",
        "Setting a timer for a long period of time, i.e. multiple minutes, is a performance and correctness issue on Android as it keeps the timer module awake, and timers can only be called when the app is in the foreground. See https://github.com/facebook/react-native/issues/12981 for more info.",
        "Warning: componentWillReceiveProps has been renamed",
        "Warning: componentWillUpdate has been renamed",
        "Warning: componentWillMount has been renamed",
      ]);
    } catch (e) {
      console.warn(e);
    }
  }, 100);

  // FIXME: we can safely remove that when the problem is fixed
  //        on libcore side: actually if a callback based function
  //        fails on libcore, the error callback is called twice
  //
  //        wrapping the calls in timeout doesnt help avoiding the
  //        redbox, so we just want to ignore this like that for now :)
  //
  setupDirtyHackToHandleLibcoreDoubleCallback();
}

function setupDirtyHackToHandleLibcoreDoubleCallback() {
  const { ErrorUtils } = global;
  ErrorUtils.setGlobalHandler((e, isFatal) => {
    try {
      if (
        e.message.match(
          /only one callback may be registered to a function in a native module/,
        )
      ) {
        return;
      }
      const ExceptionsManager = require("../node_modules/react-native/Libraries/Core/ExceptionsManager.js");
      ExceptionsManager.handleException(e, isFatal);
    } catch (ee) {
      console.log("Failed to print error: ", ee.message);
    }
  });
}
