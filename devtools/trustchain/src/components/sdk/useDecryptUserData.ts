import { useCallback, useState } from "react";
import type { Trustchain, TrustchainSDK } from "../../types";
import { fromHex } from "./utils";

const identityDisplay = (v: string): string => v;

export function useDecryptUserData(sdk: TrustchainSDK, trustchain: Trustchain | null) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);

  const action = useCallback(
    (tc: Trustchain, hex: string) =>
      Promise.resolve(hex)
        .then(h => fromHex(h))
        .then(bytes => sdk.decryptUserData(tc, bytes))
        .then(arr => new TextDecoder().decode(arr)),
    [sdk],
  );

  return {
    input,
    inputs: trustchain && input ? ([trustchain, input] as [Trustchain, string]) : null,
    setInput,
    output,
    setOutput,
    action,
    valueDisplay: identityDisplay,
  };
}
