import type { AddressValidationError as AddressValidationErrorType } from "@ledgerhq/live-common/flows/send/recipient/types";
import { Box, Text, Spot } from "@ledgerhq/lumen-ui-rnative";
import { Search } from "@ledgerhq/lumen-ui-rnative/symbols";
import React from "react";
import { useTranslation } from "~/context/Locale";

type AddressValidationErrorProps =
  | Readonly<{
      translationKey: string;
    }>
  | Readonly<{
      error: AddressValidationErrorType;
    }>;

export const AddressValidationError = (props: AddressValidationErrorProps) => {
  const { t } = useTranslation();

  if ("error" in props && props.error === "sanctioned") return null;

  const errorMessages: Record<Exclude<AddressValidationErrorType, null | "sanctioned">, string> = {
    incorrect_format: t("send.newSendFlow.errors.incorrectFormat"),
    incompatible_asset: t("send.newSendFlow.errors.incompatibleAsset"),
    wallet_not_exist: t("send.newSendFlow.addressNotFound"),
  };

  return (
    <Box lx={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Spot appearance="icon" icon={Search} size={72} />
      {"error" in props && props.error !== null && props.error !== "sanctioned" && (
        <Text
          typography={"error" in props ? "heading3SemiBold" : "body2"}
          lx={{ marginTop: "s24", color: "base" }}
        >
          {errorMessages[props.error]}
        </Text>
      )}
      {"translationKey" in props && (
        <Text typography="body2" lx={{ marginTop: "s24", color: "muted" }}>
          {t(props.translationKey)}
        </Text>
      )}
    </Box>
  );
};
