import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";

/** Quick STG / PRD presets using defaults from `@ledgerhq/live-env` (see `libs/env/src/env.ts`). */
export function ApiUrlPresets({
  active,
  onStaging,
  onProd,
}: {
  /** Preset the current URL matches, highlighted as the selected one. */
  active?: "staging" | "prod" | null;
  onStaging: () => void;
  onProd: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-8">
      <Button
        type="button"
        size="sm"
        appearance={active === "staging" ? "accent" : "gray"}
        onClick={onStaging}
      >
        STG
      </Button>
      <Button
        type="button"
        size="sm"
        appearance={active === "prod" ? "accent" : "gray"}
        onClick={onProd}
      >
        PRD
      </Button>
    </div>
  );
}
