import React from "react";
import { useTranslation } from "react-i18next";
import type { AddressValidationError as AddressValidationErrorType } from "../types";
import { StatusMessage } from "./StatusMessage";

type AddressValidationErrorProps = Readonly<{
  error: AddressValidationErrorType;
}>;

export function AddressValidationError({ error }: AddressValidationErrorProps) {
  const { t } = useTranslation();

  if (!error || error === "sanctioned") return null;

  const errorMessages: Record<Exclude<AddressValidationErrorType, null | "sanctioned">, string> = {
    incorrect_format: t("newSendFlow.errors.incorrectFormat"),
    incompatible_asset: t("newSendFlow.errors.incompatibleAsset"),
    wallet_not_exist: t("newSendFlow.addressNotFound"),
  };

  const text = errorMessages[error];

  return <StatusMessage text={text} />;
}
