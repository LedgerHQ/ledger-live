import {
  getAllEnvs,
  setEnvUnsafe,
  getEnvDefault,
} from "@ledgerhq/live-common/lib/env";
import { each, reduce, pick } from "lodash";

const whitelist = [
  "FORCE_PROVIDER",
  "BASE_SOCKET_URL",
  "DEVICE_PROXY_URL",
  "EXPERIMENTAL_USB",
  "MANAGER_DEV_MODE",
];

const getWhitelisted = (data) => pick(data, whitelist);

export const getEnv = () => {
  return getWhitelisted(getAllEnvs());
};

export const getDefaultEnv = () => {
  const envNames = whitelist;

  return reduce(
    envNames,
    (result, name) => {
      result[name] = getEnvDefault(name);
      return result;
    },
    {}
  );
};

export const setDefaultEnv = () => {
  return updateEnv(getDefaultEnv());
};

export const updateEnv = (data) => {
  each(data, (value, key) => {
    setEnvUnsafe(key, value);
  });
  return getWhitelisted(getAllEnvs());
};
