import { cached, Config, getChainAPI, queued } from "../api";
import { makeLRUCache } from "../../../cache";
import { makeBridges } from "./bridge";
import { minutes } from "../api/cached";

const getAPI = makeLRUCache(
  (config: Config) => Promise.resolve(getChainAPI(config)),
  (config) => config.endpoint,
  minutes(1000)
);

const getQueuedAPI = makeLRUCache(
  (config: Config) => getAPI(config).then((api) => queued(api, 100)),
  (config) => config.endpoint,
  minutes(1000)
);

const getQueuedAndCachedAPI = makeLRUCache(
  (config: Config) => getQueuedAPI(config).then(cached),
  (config) => config.endpoint,
  minutes(1000)
);

export default makeBridges({
  getAPI,
  getQueuedAPI,
  getQueuedAndCachedAPI,
});
