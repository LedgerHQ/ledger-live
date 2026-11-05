import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import type { AccountAnalyticsLabels } from "../../AccountAnalytics.types";

type AnalyticsStatusContentProps = Readonly<{
  isError: boolean;
  labels: Pick<AccountAnalyticsLabels, "error" | "unavailable" | "retry">;
  onRetry: () => void;
}>;

export function AnalyticsStatusContent({ isError, labels, onRetry }: AnalyticsStatusContentProps) {
  return (
    <div className="flex flex-col items-start gap-12 py-24">
      {isError ? (
        <p role="alert" className="body-2 text-muted">
          {labels.error}
        </p>
      ) : (
        <output className="body-2 text-muted">{labels.unavailable}</output>
      )}
      {isError && (
        <Button appearance="gray" size="sm" onClick={onRetry}>
          {labels.retry}
        </Button>
      )}
    </div>
  );
}
