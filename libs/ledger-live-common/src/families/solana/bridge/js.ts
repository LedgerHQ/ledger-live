import { makeLRUCache } from "@ledgerhq/live-network/cache";
import { log } from "@ledgerhq/logs";
import { cached, Config, getChainAPI, queued } from "../api";
import { minutes } from "../api/cached";
import { traced } from "../api/traced";
import { makeBridges } from "./bridge";

const httpRequestLogger = (url: string, options: any) => {
  log("network", url, {
    method: options?.method,
    body: options?.body,
    params: options?.params,
  });
};

const getAPI = makeLRUCache(
  (config: Config) => Promise.resolve(traced(getChainAPI(config, httpRequestLogger))),
  config => config.endpoint,
  minutes(1000),
);

const getQueuedAPI = makeLRUCache(
  (config: Config) => getAPI(config).then(api => queued(api, 500)),
  config => config.endpoint,
  minutes(1000),
);

const getQueuedAndCachedAPI = makeLRUCache(
  (config: Config) => getQueuedAPI(config).then(cached),
  config => config.endpoint,
  minutes(1000),
);

export default makeBridges({
  getAPI,
  getQueuedAPI,
  getQueuedAndCachedAPI,
});
