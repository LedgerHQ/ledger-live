import Config from "react-native-config";
import { init } from "./bridge/client";

if (Config.MOCK) {
  init();
}
