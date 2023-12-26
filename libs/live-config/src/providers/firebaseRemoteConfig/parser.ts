import { Value } from "../firebaseRemoteConfig";
import { ConfigInfo } from "../../LiveConfig";

const objectParser = (value: unknown): object | undefined => {
  const stringValue = (value as Value).asString();
  try {
    return stringValue ? JSON.parse(stringValue) : undefined;
  } catch (error) {
    console.error(`JSON.parse error: ${error}. Original string: ${stringValue}`);
    return undefined;
  }
};

export function parser(value: unknown, type: ConfigInfo["type"]) {
  if ((value as Value).getSource() === "static") return undefined; // config value is not set in firebase remote config
  switch (type) {
    case "string": {
      return (value as Value).asString();
    }
    case "number": {
      return (value as Value).asNumber();
    }
    case "boolean": {
      return (value as Value).asBoolean();
    }
    case "object":
    case "array":
    default: {
      return objectParser(value);
    }
  }
}
