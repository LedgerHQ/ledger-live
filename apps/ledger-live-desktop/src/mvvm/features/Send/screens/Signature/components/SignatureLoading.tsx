import React from "react";
import { LoadingContent } from "LLD/components/DeviceIntentExecutor/components/DeviceGenericStates/LoadingContent";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";

type SignatureLoadingProps = Readonly<{ title: string }>;

/** Keeps the send dialog open while the device works or the transaction broadcasts. */
export function SignatureLoading({ title }: SignatureLoadingProps) {
  return (
    <>
      <DeviceBlocker />
      <LoadingContent title={title} testID="send-signature-loading" />
    </>
  );
}
