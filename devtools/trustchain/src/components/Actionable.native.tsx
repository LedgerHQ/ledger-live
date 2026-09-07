import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator } from "react-native";
import { Box, Button, Text, useTheme } from "@ledgerhq/lumen-ui-rnative";

const ROW_LX = {
  flexDirection: "row",
  alignItems: "center",
  gap: "s8",
  marginVertical: "s4",
} as const;

export function Actionable<I extends Array<unknown>, A>({
  inputs,
  action,
  valueDisplay,
  buttonTitle,
  setValue,
  value,
  children,
}: Readonly<{
  buttonTitle: string;
  inputs: I | null;
  action: (...inputs: I) => Promise<A> | A;
  valueDisplay?: (value: A) => string | number | null | undefined;
  value?: A | null;
  setValue?: (value: A | null) => void;
  children?: ReactNode;
}>) {
  const { theme } = useTheme();
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (value != null) setError(null);
  }, [value]);

  const onPress = useCallback(() => {
    if (!inputs) return;
    setLoading(true);
    Promise.resolve()
      .then(() => action(...inputs))
      .then(
        result => {
          setValue?.(result);
          setError(null);
        },
        err => {
          const msg: string = err?.message ?? String(err);
          setError(
            new Error(
              msg.includes("UNKNOWN_APDU (0x6d02)")
                ? "Make sure the Ledger Sync app is open on your device."
                : msg,
            ),
          );
        },
      )
      .finally(() => setLoading(false));
  }, [inputs, action, setValue]);

  const display = value != null && valueDisplay ? valueDisplay(value) : null;

  return (
    <Box lx={ROW_LX} style={{ flexWrap: "wrap" }}>
      <Button size="sm" appearance="transparent" disabled={!inputs || loading} onPress={onPress}>
        {buttonTitle}
      </Button>
      {loading ? <ActivityIndicator size="small" /> : null}
      {display ? (
        <Text typography="body2" numberOfLines={1} style={{ flex: 1 }}>
          {String(display)}
        </Text>
      ) : null}
      {error ? (
        <Text typography="body2" style={{ color: theme.colors.text.error }}>
          {error.message}
        </Text>
      ) : null}
      {children}
    </Box>
  );
}
