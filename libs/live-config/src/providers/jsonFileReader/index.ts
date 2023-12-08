import fs from "fs";
import { Provider } from "..";
import { ConfigInfo } from "../../LiveConfig";

export class JsonFileReader extends Provider {
  filePath: string;

  constructor(config: { filePath: string }) {
    super({ name: "jsonFileReader" });
    if (!config.filePath.endsWith(".json")) {
      throw new Error("Only .json files can be read by the provider");
    }

    this.filePath = config.filePath;
  }

  getValueBykey<K>(key: K, info: ConfigInfo) {
    if (!fs.existsSync(this.filePath)) {
      throw new Error("Invalid file path, could not read config");
    }

    try {
      const fileContent = fs.readFileSync(this.filePath);
      const parsedValue = JSON.parse(fileContent.toString());
      return parsedValue[key] ?? info.default;
    } catch (err) {
      console.error(
        `The config file doesn't have a key ${key}. Returning default value: ${info.default}`,
        err,
      );

      return info.default;
    }
  }
}
