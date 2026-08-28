import { TextInput } from "react-native";
import { useTheme } from "@ledgerhq/lumen-ui-rnative";
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
  const { theme } = useTheme();
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
        placeholder="message to encrypt"
        value={input}
        onChangeText={setInput}
        style={{
          flex: 1,
          borderWidth: 1,
          borderColor: theme.colors.border.mutedSubtle,
          borderRadius: 4,
          paddingHorizontal: 8,
          paddingVertical: 4,
          fontSize: 13,
        }}
      />
    </Actionable>
  );
}
