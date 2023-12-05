import { Provider } from "..";
import { getValueByKey } from "./helpers";
import { parser } from "./parser";

export const FirebaseProvder: Provider = {
  name: "firebaseRemoteConfig",
  parser,
  getValueByKey: getValueByKey,
};
