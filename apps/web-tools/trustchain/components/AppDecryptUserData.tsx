import React, { useCallback, useState } from "react";
import { crypto } from "@ledgerhq/hw-trustchain";
import { JWT, Trustchain } from "@ledgerhq/trustchain/types";
import { Actionable } from "./Actionable";
import { Input } from "./Input";
import { useTrustchainSDK } from "../context";

export function AppDecryptUserData({ trustchain }: { trustchain: Trustchain | null }) {
  const [input, setInput] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const sdk = useTrustchainSDK();

  const action = useCallback(
    (trustchain: Trustchain, input: string) =>
      sdk
        .decryptUserData(trustchain, crypto.from_hex(input))
        .then(array => new TextDecoder().decode(array)),
    [sdk],
  );

  const valueDisplay = useCallback((output: string) => <code>{output}</code>, []);

  return (
    <Actionable
      buttonTitle="sdk.decryptUserData"
      inputs={trustchain && input ? [trustchain, input] : null}
      action={action}
      valueDisplay={valueDisplay}
      value={output}
      setValue={setOutput}
      buttonProps={{
        "data-tooltip-id": "tooltip",
        "data-tooltip-content":
          "decrypts a message with the current private key secured by the trustchain",
      }}
    >
      <Input
        placeholder="hex message to decrypt"
        type="text"
        value={input || ""}
        onChange={e => setInput(e.target.value)}
      />
    </Actionable>
  );
}
