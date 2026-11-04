import { TextInput } from "@ledgerhq/lumen-ui-rnative";
import type { Trustchain, TrustchainSDK } from "../../types";
import { Actionable } from "../Actionable";
import { useDecryptUserData } from "./useDecryptUserData";

export function DecryptUserData({
  sdk,
  trustchain,
}: Readonly<{
  sdk: TrustchainSDK;
  trustchain: Trustchain | null;
}>) {
  const { input, inputs, setInput, output, setOutput, action, valueDisplay } = useDecryptUserData(
    sdk,
    trustchain,
  );

  return (
    <Actionable
      buttonTitle="sdk.decryptUserData"
      inputs={inputs}
      action={action}
      value={output}
      setValue={setOutput}
      valueDisplay={valueDisplay}
    >
      <TextInput
        lx={{ flex: 1 }}
        label="Hex"
        placeholder="hex to decrypt"
        value={input}
        onChangeText={setInput}
        hideClearButton
      />
    </Actionable>
  );
}
