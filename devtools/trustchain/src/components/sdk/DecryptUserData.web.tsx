import { TextInput } from "@ledgerhq/lumen-ui-react";
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
        label="Hex"
        placeholder="hex to decrypt"
        value={input}
        onChange={e => setInput(e.target.value)}
        className="flex-1"
        hideClearButton
      />
    </Actionable>
  );
}
