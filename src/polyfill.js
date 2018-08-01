global.Buffer = require("buffer").Buffer;

process.browser = true; // for readable-stream/lib/_stream_writable.js

if (__DEV__) {
  setTimeout(() => {
    // it logs weird things without the timeout...
    try {
      // just for tests
      require("react-native").YellowBox.ignoreWarnings([
        "Warning: isMounted(...) is deprecated in plain JavaScript React classes. Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."
      ]);
    } catch (e) {
      console.warn(e);
    }
  }, 100);
}
