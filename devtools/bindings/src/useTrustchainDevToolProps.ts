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
    trustchainApiBaseUrl,
    useProd,
    setUseProd,
    onTrustchainChange,
    onMemberCredentialsChange,
  };
}
