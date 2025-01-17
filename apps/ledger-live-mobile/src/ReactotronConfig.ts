import Reactotron from "reactotron-react-native";
import { reactotronRedux } from "reactotron-redux";

const reactotron = Reactotron.configure({ name: "LLM Debug" })
  .useReactNative({
    asyncStorage: { ignore: ["secret"] },
    errors: true,
    log: true,
    networking: true,
    editor: true,
    storybook: true,
  })
  .use(reactotronRedux())
  .connect();
export default reactotron;
