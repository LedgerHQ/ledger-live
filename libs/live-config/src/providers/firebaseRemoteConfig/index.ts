import { Provider } from "..";
import { ConfigInfo } from "../../LiveConfig";
import { parser } from "./parser";
import { Value } from "firebase/remote-config";

export class FirebaseRemoteConfigProvider extends Provider {
  getValue: (key: string) => Value;

  constructor(config: { getValue: (key: string) => Value }) {
    super({ name: "firebaseRemoteConfig" });
    this.getValue = config.getValue;
  }

  getValueBykey<K>(key: K, info: ConfigInfo) {
    const value = this.getValue(key as string);
    const parsedValue = parser(value, info.type);

    return parsedValue ?? info.default;
  }
}
