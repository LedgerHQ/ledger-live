import { useEffect, useState } from "react";
import { Banner, Box } from "@ledgerhq/lumen-ui-rnative";
import type { PayCardActionResult } from "../types";

const VISIBLE_MS = 5000;

const OVERLAY_STYLE = { position: "absolute", left: 12, right: 12, bottom: 12 } as const;

export function ResultToast({ result }: { readonly result: PayCardActionResult | null }) {
  const [shown, setShown] = useState<PayCardActionResult | null>(null);

  useEffect(() => {
    if (!result) return undefined;
    setShown(result);
    const timer = setTimeout(() => setShown(null), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [result]);

  if (!shown) return null;

  return (
    <Box style={OVERLAY_STYLE}>
      <Banner
        appearance={shown.failed ? "error" : "info"}
        title={shown.message}
        onClose={() => setShown(null)}
      />
    </Box>
  );
}
