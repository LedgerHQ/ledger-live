import { useCallback, useState } from "react";
import type { Trustchain, TrustchainSDK } from "../../types";
import { toHex } from "./utils";

export function useEncryptUserData(sdk: TrustchainSDK, trustchain: Trustchain | null) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<Uint8Array | null>(null);

  const action = useCallback(
    (tc: Trustchain, msg: string) => sdk.encryptUserData(tc, new TextEncoder().encode(msg)),
    [sdk],
  );

  return {
    input,
    inputs: trustchain && input ? ([trustchain, input] as [Trustchain, string]) : null,
    setInput,
    output,
    setOutput,
    action,
    valueDisplay: toHex,
  };
}
