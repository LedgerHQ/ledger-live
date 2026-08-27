import { useCallback, useState } from "react";
import { TextInput } from "react-native";
import { useTheme } from "@ledgerhq/lumen-ui-rnative";
import type { Trustchain, TrustchainSDK } from "../../types";
import { Actionable } from "../Actionable";

const toHex = (arr: Uint8Array): string =>
  Array.from(arr)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

export function EncryptUserData({
  sdk,
  trustchain,
}: Readonly<{
  sdk: TrustchainSDK;
  trustchain: Trustchain | null;
}>) {
  const { theme } = useTheme();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<Uint8Array | null>(null);

  const action = useCallback(
    (tc: Trustchain, msg: string) => sdk.encryptUserData(tc, new TextEncoder().encode(msg)),
    [sdk],
  );

  return (
    <Actionable
      buttonTitle="sdk.encryptUserData"
      inputs={trustchain && input ? [trustchain, input] : null}
      action={action}
      value={output}
      setValue={setOutput}
      valueDisplay={v => toHex(v)}
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
