import React from "react";
import { Trans } from "react-i18next";
import { isAxiosError } from "axios";
import Alert from "~/renderer/components/Alert";

type Props = Readonly<{
  error: Error | null;
  context: "onboard" | "create";
}>;

export default function OnboardError({ error, context }: Props) {
  return (
    <Alert type="error">
      <Trans i18nKey={resolveMessageKey(error, context)} />
    </Alert>
  );
}

function resolveMessageKey(error: Error | null, context: "onboard" | "create"): string {
  const eName = (error as { name?: string })?.name;
  if (eName === "UserRefusedOnDevice" || eName === "LockedDeviceError") {
    return error?.message ?? "";
  }

  if (context === "create" && isAxiosError(error) && error.status === 429) {
    return "families.concordium.addAccount.create.error429";
  }

  return context === "onboard"
    ? "families.concordium.addAccount.identity.error"
    : "families.concordium.addAccount.create.error";
}
