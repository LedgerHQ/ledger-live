import { ConfigKey, config } from "./types";

export const getConfig = (key: ConfigKey) => {
  return config[key];
};
