import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import type { CardUserViewProps } from "./types";

export function CardUserView({
  title,
  idLabel,
  userId,
  verificationLabel,
  verificationValue,
  logoutLabel,
  isLoading,
  onLogoutPress,
}: CardUserViewProps) {
  return (
    <div className="flex flex-row items-center gap-16">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <span className="heading-5-semi-bold text-base">{title}</span>
        <span className="body-3 text-muted">
          {idLabel}: {userId}
        </span>
        <span className="body-3 text-muted">
          {verificationLabel}: {verificationValue}
        </span>
      </div>
      <Button
        appearance="gray"
        size="md"
        loading={isLoading}
        disabled={isLoading}
        onClick={onLogoutPress}
        aria-label={logoutLabel}
      >
        {logoutLabel}
      </Button>
    </div>
  );
}
