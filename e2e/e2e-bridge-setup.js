// @flow
import Config from "react-native-config";

if (Config.MOCK) {
  import("./engine/bridge/client").then(({ init }) => init());
}
