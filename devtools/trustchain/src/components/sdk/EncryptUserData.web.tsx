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
