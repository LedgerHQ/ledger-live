import { useSelector } from "react-redux";
import {
  selectDebugKeyRingMemberKey,
  selectDebugKeyRingTree,
} from "@features/platform-key-ring/devtools";
import type { DevToolsConfig } from "@devtools/registry";

type TrustchainDevToolProps = Extract<DevToolsConfig[number], { id: "trustchain" }>["config"];

export function useTrustchainDevToolProps(
  createSdk: TrustchainDevToolProps["createSdk"],
  trustchainApiBaseUrl: string,
  onTrustchainChange?: TrustchainDevToolProps["onTrustchainChange"],
  onMemberCredentialsChange?: TrustchainDevToolProps["onMemberCredentialsChange"],
  useProd?: boolean,
  setUseProd?: (v: boolean) => void,
): TrustchainDevToolProps {
  const trustchain = useSelector(selectDebugKeyRingTree);
  const memberCredentials = useSelector(selectDebugKeyRingMemberKey);

  return {
    liveState: { trustchain, memberCredentials },
    createSdk,
    trustchainApiBaseUrl,
    useProd,
    setUseProd,
    onTrustchainChange,
    onMemberCredentialsChange,
  };
}
