import React, { useCallback, useState } from "react";
import { crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { TextInput } from "@ledgerhq/lumen-ui-react";
import { Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import { Actionable } from "./Actionable";
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

  const valueDisplay = useCallback(
    (output: string) => <code className="body-3">{output}</code>,
    [],
  );

  return (
    <Actionable
      buttonTitle="sdk.decryptUserData"
      inputs={trustchain && input ? [trustchain, input] : null}
      action={action}
      valueDisplay={valueDisplay}
      value={output}
      setValue={setOutput}
    >
      <TextInput
        placeholder="hex message to decrypt"
        value={input || ""}
        onChange={e => setInput(e.target.value)}
        className="flex-1"
      />
    </Actionable>
  );
}
