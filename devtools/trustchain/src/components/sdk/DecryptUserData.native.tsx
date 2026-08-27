import { useCallback, useState } from "react";
import { TextInput } from "react-native";
import { useTheme } from "@ledgerhq/lumen-ui-rnative";
import type { Trustchain, TrustchainSDK } from "../../types";
import { Actionable } from "../Actionable";

const fromHex = (hex: string): Uint8Array => {
  const clean = hex.replace(/\s/g, "");
  if (clean.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(clean)) {
    throw new Error("Invalid hex string");
  }
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 2) bytes.push(Number.parseInt(clean.slice(i, i + 2), 16));
  return new Uint8Array(bytes);
};

export function DecryptUserData({
  sdk,
  trustchain,
}: Readonly<{
  sdk: TrustchainSDK;
  trustchain: Trustchain | null;
}>) {
  const { theme } = useTheme();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);

  const action = useCallback(
    (tc: Trustchain, hex: string) =>
      sdk.decryptUserData(tc, fromHex(hex)).then(arr => new TextDecoder().decode(arr)),
    [sdk],
  );

  return (
    <Actionable
      buttonTitle="sdk.decryptUserData"
      inputs={trustchain && input ? [trustchain, input] : null}
      action={action}
      value={output}
      setValue={setOutput}
      valueDisplay={v => v}
    >
      <TextInput
        placeholder="hex to decrypt"
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
