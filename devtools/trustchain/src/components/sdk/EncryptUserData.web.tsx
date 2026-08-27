import { useCallback, useState } from "react";
import type { Trustchain, TrustchainSDK } from "../../types";
import { Actionable } from "../Actionable";

const toHex = (arr: Uint8Array): string =>
  Array.from(arr)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

export function EncryptUserData({
  sdk,
  trustchain,
}: Readonly<{
  sdk: TrustchainSDK;
  trustchain: Trustchain | null;
}>) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<Uint8Array | null>(null);

  const action = useCallback(
    (tc: Trustchain, msg: string) => sdk.encryptUserData(tc, new TextEncoder().encode(msg)),
    [sdk],
  );

  return (
    <Actionable
      buttonTitle="sdk.encryptUserData"
      inputs={trustchain && input ? [trustchain, input] : null}
      action={action}
      value={output}
      setValue={setOutput}
      valueDisplay={v => toHex(v)}
    >
      <input
        type="text"
        placeholder="message to encrypt"
        value={input}
        onChange={e => setInput(e.target.value)}
        className="flex-1 bg-base border border-base rounded px-8 py-4 body-3 text-base"
      />
    </Actionable>
  );
}
