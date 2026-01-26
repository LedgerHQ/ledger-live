import React from "react";
import { useTranslation } from "~/context/Locale";
import { Banner } from "@ledgerhq/lumen-ui-rnative";

type ValidationBannerProps = Readonly<{
  type: "error" | "warning" | "sanctioned";
  error?: Error;
  warning?: Error;
  variant?: "recipient" | "sender";
  excludeRecipientRequired?: boolean;
}>;

export function ValidationBanner({
  type,
  error,
  warning,
  variant = "recipient",
  excludeRecipientRequired = false,
}: ValidationBannerProps) {
  const { t } = useTranslation();

  if (type === "sanctioned") {
    return (
      <Banner
        appearance="error"
        title={t("newSendFlow.errors.sanctionedAddress")}
        description={t("newSendFlow.errors.sanctionedAddressDescription")}
      />
    );
  }

  const message = error?.message ?? warning?.message ?? "";

  if (!message) {
    return null;
  }

  if (excludeRecipientRequired && message.toLowerCase().includes("recipient")) {
    return null;
  }

  const appearance = type === "error" ? "error" : "warning";
  const title =
    variant === "sender"
      ? t("newSendFlow.errors.senderError")
      : t("newSendFlow.errors.recipientError");

  return <Banner appearance={appearance} title={title} description={message} />;
}
