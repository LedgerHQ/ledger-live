import { Value } from "../firebaseRemoteConfig";
import { ConfigInfo } from "../../LiveConfig";

const objectParser = (value: Value): object | undefined => {
  const stringValue = value.asString();
  try {
    return stringValue ? JSON.parse(stringValue) : undefined;
  } catch (error) {
    console.error(`JSON.parse error: ${error}. Original string: ${stringValue}`);
    return undefined;
  }
};

export function parser(value: Value, type: ConfigInfo["type"]) {
  if (value.getSource() === "static") return undefined; // config value is not set in firebase remote config
  switch (type) {
    case "string": {
      return value.asString();
    }
    case "number": {
      return value.asNumber();
    }
    case "boolean": {
      return value.asBoolean();
    }
    case "object":
    case "array":
    default: {
      return objectParser(value);
    }
  }
}
