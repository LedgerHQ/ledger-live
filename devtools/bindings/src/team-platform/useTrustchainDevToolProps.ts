import { useSelector } from "react-redux";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trustchain = useSelector((s: any) => s.trustchain?.trustchain ?? null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memberCredentials = useSelector((s: any) => s.trustchain?.memberCredentials ?? null);

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
