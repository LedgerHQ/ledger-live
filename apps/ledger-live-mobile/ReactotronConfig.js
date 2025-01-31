import Reactotron, { asyncStorage } from "reactotron-react-native";

Reactotron.configure() // controls connection & communication settings
  .useReactNative() // add all built-in react native plugins
  .use(asyncStorage())
  .connect(); // let's connect!
