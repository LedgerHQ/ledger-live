import { useSelector } from "react-redux";
import {
  selectDebugKeyRingMemberKey,
  selectDebugKeyRingTree,
} from "@features/platform-key-ring/devtools";
import type { DevToolsConfig } from "@devtools/registry";

type CloudSyncDevToolProps = Extract<DevToolsConfig[number], { id: "cloud-sync" }>["config"];

export function useCloudSyncDevToolProps(
  createSdk: CloudSyncDevToolProps["createSdk"],
  cloudSyncApiBaseUrl: string,
  trustchainApiBaseUrl: string,
  useProd?: boolean,
  setUseProd?: (v: boolean) => void,
): CloudSyncDevToolProps {
  const trustchain = useSelector(selectDebugKeyRingTree);
  const memberCredentials = useSelector(selectDebugKeyRingMemberKey);

  return {
    liveState: { trustchain, memberCredentials },
    createSdk,
    cloudSyncApiBaseUrl,
    trustchainApiBaseUrl,
    useProd,
    setUseProd,
  };
}
