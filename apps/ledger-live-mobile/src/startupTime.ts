import { getTimeSinceStartup } from "react-native-startup-time";

export let appStartupTime: number;

getTimeSinceStartup().then(time => {
  appStartupTime = time;
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`Time since startup: ${time} ms`);
  }
});
