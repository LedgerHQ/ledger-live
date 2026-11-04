import { TextInput } from "@ledgerhq/lumen-ui-react";
import type { Trustchain, TrustchainSDK } from "../../types";
import { Actionable } from "../Actionable";
import { useEncryptUserData } from "./useEncryptUserData";

export function EncryptUserData({
  sdk,
  trustchain,
}: Readonly<{
  sdk: TrustchainSDK;
  trustchain: Trustchain | null;
}>) {
  const { input, inputs, setInput, output, setOutput, action, valueDisplay } = useEncryptUserData(
    sdk,
    trustchain,
  );

  return (
    <Actionable
      buttonTitle="sdk.encryptUserData"
      inputs={inputs}
      action={action}
      value={output}
      setValue={setOutput}
      valueDisplay={valueDisplay}
    >
      <TextInput
        label="Message"
        placeholder="message to encrypt"
        value={input}
        onChange={e => setInput(e.target.value)}
        className="flex-1"
        hideClearButton
      />
    </Actionable>
  );
}
