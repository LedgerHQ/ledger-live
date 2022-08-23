// @flow
import Config from "react-native-config";

if (Config.MOCK) {
  import("./bridge/client").then(({ init }) => init());
}
