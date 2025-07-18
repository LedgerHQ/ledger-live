import Reactotron from "reactotron-react-native";
import { reactotronRedux } from "reactotron-redux";

Reactotron.clear();

const reactotron = Reactotron.configure({
  name: "LLM Debug",
  // Reduce startup impact
  host: "localhost",
  port: 9090,
})
  .useReactNative({
    asyncStorage: { ignore: ["secret"] },
    errors: true,
    log: false, // Disable logging to reduce overhead
    networking: false, // Disable network monitoring to reduce overhead
    editor: false, // Disable editor integration to reduce overhead
    storybook: false, // Disable storybook to reduce overhead
  })
  .use(reactotronRedux())
  .connect();

export default reactotron;
