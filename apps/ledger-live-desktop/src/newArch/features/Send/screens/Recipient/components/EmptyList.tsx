import React from "react";
import { useTranslation } from "react-i18next";
import type { AddressValidationError as AddressValidationErrorType } from "../types";
import { StatusMessage } from "./StatusMessage";

type EmptyListProps =
  | Readonly<{
      translationKey: string;
    }>
  | Readonly<{
      error: AddressValidationErrorType;
    }>;

const EmptyList = (props: EmptyListProps) => {
  const { t } = useTranslation();

  let text: string;
  if ("translationKey" in props) {
    text = t(props.translationKey);
  } else {
    const { error } = props;
    if (!error || error === "sanctioned") return null;

    const errorMessages: Record<
      Exclude<AddressValidationErrorType, null | "sanctioned">,
      string
    > = {
      incorrect_format: t("newSendFlow.errors.incorrectFormat"),
      incompatible_asset: t("newSendFlow.errors.incompatibleAsset"),
      wallet_not_exist: t("newSendFlow.errors.walletNotExist"),
    };

    text = errorMessages[error];
  }

  return <StatusMessage text={text} />;
};

export default EmptyList;
