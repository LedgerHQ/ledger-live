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
  const trustchain = useSelector((s: any) => s.trustchain?.trustchain ?? null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memberCredentials = useSelector((s: any) => s.trustchain?.memberCredentials ?? null);

  return {
    liveState: { trustchain, memberCredentials },
    createSdk,
    cloudSyncApiBaseUrl,
    trustchainApiBaseUrl,
    useProd,
    setUseProd,
  };
}
