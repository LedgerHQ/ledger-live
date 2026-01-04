import React from "react";
import { Trans } from "react-i18next";
import type { SignedOperation } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import DeviceAction from "~/renderer/components/DeviceAction";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { useSignatureViewModel } from "./useSignatureViewModel";
import Spinner from "~/renderer/components/Spinner";

const Result = (
  props:
    | {
        signedOperation: SignedOperation | undefined | null;
        device: Device;
      }
    | {
        transactionSignError: Error;
      },
) => {
  if (!("signedOperation" in props)) {
    return (
      <>
        <div className="flex h-full w-full items-center justify-center">
          <Spinner size={56} />
        </div>
      </>
    );
  }
  return (
    <>
      <DeviceBlocker />
      <Trans i18nKey="send.steps.confirmation.pending.title" />
    </>
  );
};

export const SignatureScreen = () => {
  const { account, transaction, action, request, onDeviceActionResult, finishWithError } =
    useSignatureViewModel();

  if (!account || !transaction) return null;

  return (
    <DeviceAction
      action={action}
      // @ts-expect-error This request type is not compatible with the action expected shape.
      request={request}
      Result={Result}
      onResult={onDeviceActionResult}
      onError={finishWithError}
      analyticsPropertyFlow="send"
    />
  );
};
