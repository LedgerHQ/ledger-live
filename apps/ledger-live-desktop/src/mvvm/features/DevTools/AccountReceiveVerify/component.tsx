import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import type { VerifyAddressIntentJobState } from "@features/platform-intent-verify-address";

type Props = Readonly<{
  jobState: VerifyAddressIntentJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

/** The job state, as is: a dev tool shows what the intent does, not a product screen. */
export function ReceiveVerifyIntentComponent({ jobState, onClose }: Props): React.ReactElement {
  return (
    <div className="flex flex-col gap-12 p-16">
      <pre className="body-2 text-base font-mono whitespace-pre-wrap break-all">
        {jobState ? JSON.stringify(jobState, null, 2) : "starting…"}
      </pre>
      {jobState?.type === "cancelled" ? (
        <Button appearance="accent" size="md" isFull onClick={jobState.retry}>
          Retry
        </Button>
      ) : null}
      <Button appearance="base" size="md" isFull onClick={onClose}>
        Close
      </Button>
    </div>
  );
}
