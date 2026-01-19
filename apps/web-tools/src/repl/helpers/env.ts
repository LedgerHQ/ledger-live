import { getAllEnvs, setEnvUnsafe, getEnvDefault, EnvName } from "@ledgerhq/live-env";
import each from "lodash/each";
import reduce from "lodash/reduce";
import pick from "lodash/pick";

const whitelist: EnvName[] = [
  "FORCE_PROVIDER",
  "BASE_SOCKET_URL",
  "DEVICE_PROXY_URL",
  "EXPERIMENTAL_USB",
  "MANAGER_DEV_MODE",
];

const getWhitelisted = (data: unknown) => pick(data, whitelist);

export const getEnv = () => {
  return getWhitelisted(getAllEnvs());
};

type Env = Record<string, unknown>;

export const getDefaultEnv = (): Env => {
  const envNames = whitelist;

  return reduce(
    envNames,
    (result: Env, name: EnvName) => {
      result[name] = getEnvDefault(name);
      return result;
    },
    {} as Env,
  );
};

export const setDefaultEnv = () => {
  return updateEnv(getDefaultEnv());
};

export const updateEnv = (data: any) => {
  each(data, (value: unknown, key: string) => {
    setEnvUnsafe(key, value);
  });
  return getWhitelisted(getAllEnvs());
};
