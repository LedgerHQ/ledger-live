import { z } from "zod";
import { Provider } from "..";
import { Value } from "../../LiveConfig";

export interface FirebaseRemoteConfigProvider extends Provider {
  name: "firebaseRemoteConfig";
}

const defaultEnabledSchema = z.object({ enabled: z.boolean().default(false) });

export const stringParser = (value: unknown) => {
  return (value as Value).asString() || undefined;
};

export const booleanParser = (value: unknown) => {
  const valueExist = (value as Value).asString();
  return valueExist ? (value as Value).asBoolean() : undefined;
};

export const numberParser = (value: unknown) => {
  const numberValue = (value as Value).asNumber();
  return numberValue !== 0 ? numberValue : undefined;
};

export const objectParser = (value: unknown) => {
  const stringValue = (value as Value).asString();
  return stringValue ? JSON.parse(stringValue) : undefined;
};

export const configSchema = z.object({
  cosmos_gas_amplifer1: z.preprocess(booleanParser, z.boolean().default(true)),
  cosmos_gas_amplifer: z.preprocess(numberParser, z.number().default(1)),
  feature_test1: z.preprocess(stringParser, z.string().default("default value")),
  feature_app_author_name: z.preprocess(objectParser, defaultEnabledSchema),
  test_string_key: z.preprocess(stringParser, z.string().default("test_key")),
  test_number_key: z.preprocess(numberParser, z.number().default(17)),
  test_boolean_key: z.preprocess(booleanParser, z.boolean().default(true)),
  test_object_key: z.preprocess(
    objectParser,
    z.object({ key: z.string() }).default({ key: "value" }),
  ),
});

export type Config = z.infer<typeof configSchema>;

export type ConfigKeys = keyof Config;
