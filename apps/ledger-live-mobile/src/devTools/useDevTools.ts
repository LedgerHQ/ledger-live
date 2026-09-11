import { useNetworkActivityDevTools } from "@rozenite/network-activity-plugin";
import { useReactNavigationDevTools } from "@rozenite/react-navigation-plugin";
import { useMMKVDevTools } from "@rozenite/mmkv-plugin";
import { mmkv } from "LLM/storage/mmkvStorageWrapper";
import { CONFIG_PARAMS } from "LLM/storage/mmkvStorageWrapper/constants";
import { navigationRef } from "~/rootnavigation";

const config = {
  inspectors: {
    http: true,
    websocket: false,
    sse: false,
  },
};

const HookDevTools = () => {
  useNetworkActivityDevTools({
    inspectors: config.inspectors,
  });

  useReactNavigationDevTools({ ref: navigationRef });
  useMMKVDevTools({
    storages: { [CONFIG_PARAMS.ID]: mmkv },
  });

  return null;
};

export default HookDevTools;
