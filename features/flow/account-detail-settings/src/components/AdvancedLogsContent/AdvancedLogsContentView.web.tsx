import React from "react";
import { Banner, Button } from "@ledgerhq/lumen-ui-react";
import { Check } from "@ledgerhq/lumen-ui-react/symbols";
import type { AdvancedLogsContentViewProps } from "./types";

export function AdvancedLogsContentView({
  derivationTip,
  synchronised,
  json,
  copyLabel,
  isCopied,
  onCopy,
}: AdvancedLogsContentViewProps) {
  return (
    <div className="flex flex-col gap-24" data-testid="account-settings-advanced-logs-content">
      {derivationTip ? <Banner appearance="info" description={derivationTip} /> : null}
      <div className="flex flex-col gap-16 body-1">
        <p className="text-base">{synchronised}</p>
        <p
          className="break-all whitespace-pre-wrap text-muted"
          data-testid="account-settings-advanced-logs-json"
        >
          {json}
        </p>
      </div>
      <Button
        appearance="base"
        size="lg"
        isFull
        icon={isCopied ? Check : undefined}
        onClick={onCopy}
        data-testid="account-settings-copy-logs"
      >
        {copyLabel}
      </Button>
    </div>
  );
}
