import React from "react";
import { Trans } from "react-i18next";
import { isAxiosError } from "axios";
import { LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/errors";
import Alert from "~/renderer/components/Alert";

type Props = {
  error: Error | null;
  context: "onboard" | "create";
};

export default function OnboardError({ error, context }: Props) {
  return (
    <Alert type="error">
      <Trans i18nKey={resolveMessageKey(error, context)} />
    </Alert>
  );
}

function resolveMessageKey(error: Error | null, context: "onboard" | "create"): string {
  if (error instanceof UserRefusedOnDevice || error instanceof LockedDeviceError) {
    return error.message;
  }

  if (context === "create" && isAxiosError(error) && error.status === 429) {
    return "families.concordium.addAccount.create.error429";
  }

  return context === "onboard"
    ? "families.concordium.addAccount.identity.error"
    : "families.concordium.addAccount.create.error";
}
