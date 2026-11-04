import { Button } from "@ledgerhq/lumen-ui-react";
import type { AccountAnalyticsIntroductionToolProps } from "../types";
import { copy, statusOf } from "./copy";

export function AccountAnalyticsIntroduction({
  hasDismissed,
  onReset,
}: AccountAnalyticsIntroductionToolProps) {
  return (
    <div className="flex items-center justify-between gap-12 px-16 py-12">
      <span className="body-3 text-muted">{statusOf(hasDismissed)}</span>
      <Button appearance="accent" size="sm" disabled={!hasDismissed} onClick={onReset}>
        {copy.reset}
      </Button>
    </div>
  );
}
