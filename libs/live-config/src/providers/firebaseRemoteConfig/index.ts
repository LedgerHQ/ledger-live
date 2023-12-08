import { Provider } from "..";
import { ConfigInfo } from "../../LiveConfig";
import { parser } from "./parser";
import { type Value } from "firebase/remote-config";

// refer to https://github.com/firebase/firebase-js-sdk/blob/master/packages/remote-config/src/public_types.ts#L71 for the firebase config value interface
// export interface Value {
//   asString(): string;
//   asNumber(): number;
//   asBoolean(): boolean;
// }

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
