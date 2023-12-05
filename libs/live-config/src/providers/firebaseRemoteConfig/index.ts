import { Provider } from "..";
import { getValueByKey } from "./helpers";
import { parser } from "./parser";

class FirebaseRemoteConfigProviderFactory extends Provider {
  constructor() {
    super("firebaseRemoteConfig", parser, getValueByKey);
  }
}

export const FirebaseRemoteConfigProvider = new FirebaseRemoteConfigProviderFactory();
