import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";

/** Quick STG / PRD presets using defaults from `@ledgerhq/live-env` (see `libs/env/src/env.ts`). */
export function ApiUrlPresets({
  onStaging,
  onProd,
}: {
  onStaging: () => void;
  onProd: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-8">
      <Button type="button" size="sm" appearance="accent" onClick={onStaging}>
        STG
      </Button>
      <Button type="button" size="sm" appearance="base" onClick={onProd}>
        PRD
      </Button>
    </div>
  );
}
