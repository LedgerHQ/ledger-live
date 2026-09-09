import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, Text, TextInput } from "@ledgerhq/lumen-ui-rnative";
import type { PayCardOpenSecureBrowser } from "../types";
import { Section } from "../components/Section/Section";

const ROW = { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" } as const;

const HINT = "The browser session the hosted login opens. The app's own deep link closes it.";

export function SecureBrowserSection({ open }: { readonly open: PayCardOpenSecureBrowser }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const target = url.trim();

  const openUrl = useCallback(() => {
    setBusy(true);
    setOutcome(null);
    open(target)
      .then(
        result => result,
        error => `failed: ${error instanceof Error ? error.message : String(error)}`,
      )
      .then(result => {
        if (!mounted.current) return;
        setOutcome(result);
        setBusy(false);
      });
  }, [open, target]);

  return (
    <Section title="Secure browser">
      <TextInput
        testID="pay-card-secure-browser-url"
        label="URL"
        value={url}
        onChangeText={setUrl}
        keyboardType="url"
      />
      <Box style={ROW}>
        <Button
          appearance="accent"
          size="sm"
          disabled={busy || target.length === 0}
          onPress={openUrl}
        >
          Open in secure browser
        </Button>
      </Box>
      <Text typography="body4" lx={{ color: outcome === null ? "muted" : "base" }}>
        {outcome ?? HINT}
      </Text>
    </Section>
  );
}
