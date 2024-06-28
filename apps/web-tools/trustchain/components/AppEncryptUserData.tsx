import React, { useCallback, useState } from "react";
import { crypto } from "@ledgerhq/hw-trustchain";
import { Trustchain } from "@ledgerhq/trustchain/types";
import { Actionable } from "./Actionable";
import { Input } from "./Input";
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
    (output: Uint8Array) => <code>{crypto.to_hex(output)}</code>,
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
      buttonProps={{
        "data-tooltip-id": "tooltip",
        "data-tooltip-content":
          "encrypts a message with the current private key secured by the trustchain",
      }}
    >
      <Input
        placeholder="message to encrypt"
        type="text"
        value={input || ""}
        onChange={e => setInput(e.target.value)}
      />
    </Actionable>
  );
}
