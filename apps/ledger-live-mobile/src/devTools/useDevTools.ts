import { useNetworkActivityDevTools } from "@rozenite/network-activity-plugin";
import { useReactNavigationDevTools } from "@rozenite/react-navigation-plugin";
import { createMMKVStorageAdapter, useRozeniteStoragePlugin } from "@rozenite/storage-plugin";
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

const storages = [createMMKVStorageAdapter({ storages: { [CONFIG_PARAMS.ID]: mmkv } })];

const HookDevTools = () => {
  useNetworkActivityDevTools({
    inspectors: config.inspectors,
  });

  useReactNavigationDevTools({ ref: navigationRef });
  useRozeniteStoragePlugin({ storages });

  return null;
};

export default HookDevTools;
