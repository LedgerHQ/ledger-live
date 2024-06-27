import { readFileSync } from "fs";
import { Provider } from "..";

export class JSONProvider implements Provider {
  public configPath: string;
  public config: Record<string, any>;

  constructor({ path }: { path: string }) {
    this.configPath = path;
    const content = readFileSync(this.configPath, "utf-8");
    this.config = JSON.parse(content) as Record<string, any>;
  }

  getValueByKey(key: string) {
    const value = this.config[key];
    return value;
  }
}
