import { useCallback, useState } from "react";
import type { Trustchain, TrustchainSDK } from "../../types";
import { Actionable } from "../Actionable";

const fromHex = (hex: string): Uint8Array => {
  const clean = hex.replace(/\s/g, "");
  if (clean.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(clean)) {
    throw new Error("Invalid hex string");
  }
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 2) bytes.push(Number.parseInt(clean.slice(i, i + 2), 16));
  return new Uint8Array(bytes);
};

export function DecryptUserData({
  sdk,
  trustchain,
}: Readonly<{
  sdk: TrustchainSDK;
  trustchain: Trustchain | null;
}>) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);

  const action = useCallback(
    (tc: Trustchain, hex: string) =>
      sdk.decryptUserData(tc, fromHex(hex)).then(arr => new TextDecoder().decode(arr)),
    [sdk],
  );

  return (
    <Actionable
      buttonTitle="sdk.decryptUserData"
      inputs={trustchain && input ? [trustchain, input] : null}
      action={action}
      value={output}
      setValue={setOutput}
      valueDisplay={v => v}
    >
      <input
        type="text"
        placeholder="hex to decrypt"
        value={input}
        onChange={e => setInput(e.target.value)}
        className="flex-1 bg-base border border-base rounded px-8 py-4 body-3 text-base"
      />
    </Actionable>
  );
}
