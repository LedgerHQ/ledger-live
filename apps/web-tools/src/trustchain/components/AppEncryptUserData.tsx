import React, { useCallback, useState } from "react";
import { crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { TextInput } from "@ledgerhq/lumen-ui-react";
import { Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import { Actionable } from "./Actionable";
import { useTrustchainSDK } from "../context";

export function AppEncryptUserData({ trustchain }: { trustchain: Trustchain | null }) {
  const [input, setInput] = useState<string | null>(null);
  const [output, setOutput] = useState<Uint8Array | null>(null);
  const sdk = useTrustchainSDK();

  const action = useCallback(
    (trustchain: Trustchain, input: string) =>
      sdk.encryptUserData(trustchain, new TextEncoder().encode(input)),
    [sdk],
  );

  const valueDisplay = useCallback(
    (output: Uint8Array) => <code className="body-3">{crypto.to_hex(output)}</code>,
    [],
  );

  return (
    <Actionable
      buttonTitle="sdk.encryptUserData"
      inputs={trustchain && input ? [trustchain, input] : null}
      action={action}
      valueDisplay={valueDisplay}
      value={output}
      setValue={setOutput}
    >
      <TextInput
        placeholder="message to encrypt"
        value={input || ""}
        onChange={e => setInput(e.target.value)}
        className="flex-1"
      />
    </Actionable>
  );
}
