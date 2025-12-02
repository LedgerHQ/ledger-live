import React from "react";
import { useTranslation } from "react-i18next";
import { Spot } from "@ledgerhq/lumen-ui-react";
import { Search } from "@ledgerhq/lumen-ui-react/symbols";
import type { AddressValidationError as AddressValidationErrorType } from "../types";

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

  return (
    <div className="flex flex-col items-center justify-center gap-16 pt-12">
      <Spot appearance="icon" icon={Search} size={72} />
      <p className="body-2 text-muted text-center mt-6">{text}</p>
    </div>
  );
};

export default EmptyList;
