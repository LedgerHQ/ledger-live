import React, { useCallback, useState } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { Check } from "@ledgerhq/lumen-ui-react/symbols";
import { COPY } from "../utils/copy";
import { DevLabeledInput } from "./DevLabeledInput";

type DevDeeplinkCopyFieldProps = {
  deeplink: string;
};

const COPY_FEEDBACK_MS = 1500;

export const DevDeeplinkCopyField = ({ deeplink }: DevDeeplinkCopyFieldProps) => {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(() => {
    void navigator.clipboard.writeText(deeplink).then(() => {
      setCopied(true);
      globalThis.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    });
  }, [deeplink]);

  return (
    <div className="flex flex-row flex-wrap items-end gap-4">
      <div className="min-w-0 flex-1">
        <DevLabeledInput
          label={COPY.campaignIdDeeplink}
          value={deeplink}
          readOnly
          onChange={() => { }}
        />
      </div>
      <Button
        size="sm"
        appearance={copied ? "accent" : "gray"}
        icon={copied ? Check : undefined}
        onClick={onCopy}
      >
        {copied ? COPY.copiedDeeplink : COPY.copyDeeplink}
      </Button>
    </div>
  );
};
