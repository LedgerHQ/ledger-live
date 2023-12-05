import { Provider } from "./providers";
import { FirebaseProvder } from "./providers/firebaseRemoteConfig";

type ConfigType =
  | {
      type: "boolean";
      default: true | false;
    }
  | {
      type: "number";
      default: number;
    }
  | {
      type: "string";
      default: string;
    }
  | {
      type: "object";
      default: object;
    };

export type ConfigInfo = ConfigType & {
  provider: Provider;
};

const defaultEnabledValue = { enabled: false };

export const configSchema = {
  cosmos_gas_amplifer1: {
    type: "boolean",
    provider: FirebaseProvder,
    default: true,
  },
  cosmos_gas_amplifer: {
    type: "number",
    provider: FirebaseProvder,
    default: 1,
  },
  feature_app_author_name: {
    type: "object",
    provider: FirebaseProvder,
    default: defaultEnabledValue,
  },
  feature_test1: {
    type: "string",
    provider: FirebaseProvder,
    default: "default value",
  },
  test_string_key: {
    type: "string",
    provider: FirebaseProvder,
    default: "test_key",
  },
  test_number_key: {
    type: "number",
    provider: FirebaseProvder,
    default: 17,
  },
  test_boolean_key: {
    type: "boolean",
    provider: FirebaseProvder,
    default: true,
  },
  test_object_key: {
    type: "object",
    provider: FirebaseProvder,
    default: { key: "value" },
  },
} satisfies { [key: string]: ConfigInfo };

export type ConfigKeys = keyof typeof configSchema;

export type Config = { [key in ConfigKeys]: ConfigInfo };

/**  Get value for a given key from the config provider */
export function getValueByKey<K extends ConfigKeys>(key: K) {
  const configElement = configSchema[key];
  return configElement.provider.getValueByKey(key, configElement);
}
