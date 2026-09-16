import { useSelector } from "react-redux";
import type { DevToolsConfig } from "@devtools/registry";

type CloudSyncDevToolProps = Extract<DevToolsConfig[number], { id: "cloud-sync" }>["config"];

export function useCloudSyncDevToolProps(
  createSdk: CloudSyncDevToolProps["createSdk"],
  cloudSyncApiBaseUrl: string,
  trustchainApiBaseUrl: string,
  useProd?: boolean,
  setUseProd?: (v: boolean) => void,
): CloudSyncDevToolProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trustchainStore = useSelector((state: any) => {
    const trustchainState = state.trustchain;
    return trustchainState?.[trustchainState.environment ?? "PROD"] ?? null;
  });

  return {
    liveState: {
      trustchain: trustchainStore?.trustchain ?? null,
      memberCredentials: trustchainStore?.memberCredentials ?? null,
    },
    createSdk,
    cloudSyncApiBaseUrl,
    trustchainApiBaseUrl,
    useProd,
    setUseProd,
  };
}
