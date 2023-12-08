import { Value } from "firebase/remote-config";
import { ConfigInfo } from "../../LiveConfig";

const stringParser = (value: unknown): string | undefined => {
  return (value as Value).asString() || undefined;
};

const numberParser = (value: unknown): number | undefined => {
  const numberValue = (value as Value).asNumber();
  return numberValue !== 0 ? numberValue : undefined;
};

const booleanParser = (value: unknown): boolean | undefined => {
  const valueExist = (value as Value).asString();
  return valueExist ? (value as Value).asBoolean() : undefined;
};

const objectParser = (value: unknown): object | undefined => {
  const stringValue = (value as Value).asString();
  return stringValue ? JSON.parse(stringValue) : undefined;
};

export function parser(value: unknown, type: ConfigInfo["type"]) {
  switch (type) {
    case "string": {
      return stringParser(value);
    }
    case "number": {
      return numberParser(value);
    }
    case "boolean": {
      return booleanParser(value);
    }
    case "object":
    case "array":
    case "enabled": {
      return objectParser(value);
    }
    default:
      throw new Error("Unexpected type");
  }
}
