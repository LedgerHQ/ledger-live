import { Provider } from "..";
import { ConfigInfo } from "../../LiveConfig";
import { parser } from "./parser";

// refer to https://github.com/firebase/firebase-js-sdk/blob/master/packages/remote-config/src/public_types.ts#L71 for the firebase config value interface
export type ValueSource = "static" | "default" | "remote";
export interface Value {
  asString(): string;
  asNumber(): number;
  asBoolean(): boolean;
  getSource(): ValueSource;
}

export class FirebaseRemoteConfigProvider implements Provider {
  public getValue: (key: string) => Value;

  constructor(config: { getValue: (key: string) => Value }) {
    this.getValue = config.getValue;
  }

  getValueByKey(key: string, info: ConfigInfo) {
    const value = this.getValue(key);
    const parsedValue = parser(value, info?.type);
    return parsedValue ?? info?.default;
  }
}
