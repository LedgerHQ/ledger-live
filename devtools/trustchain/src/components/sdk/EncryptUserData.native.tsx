import { TextInput } from "@ledgerhq/lumen-ui-rnative";
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
        lx={{ flex: 1 }}
        label="Message"
        placeholder="message to encrypt"
        value={input}
        onChangeText={setInput}
        hideClearButton
      />
    </Actionable>
  );
}
