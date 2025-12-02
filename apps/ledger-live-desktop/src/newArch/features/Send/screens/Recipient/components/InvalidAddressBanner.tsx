import React from "react";
import { Banner } from "@ledgerhq/ldls-ui-react";
import { useTranslation } from "react-i18next";
import type { AddressValidationError } from "../../../types";

type InvalidAddressBannerProps = Readonly<{
  error: AddressValidationError;
}>;

export function InvalidAddressBanner({ error }: InvalidAddressBannerProps) {
  const { t } = useTranslation();

  if (!error) return null;

  const errorMessages: Record<Exclude<AddressValidationError, null>, string> = {
    incorrect_format: t("newSendFlow.errors.incorrectFormat"),
    incompatible_asset: t("newSendFlow.errors.incompatibleAsset"),
    wallet_not_exist: t("newSendFlow.errors.walletNotExist"),
    sanctioned: t("newSendFlow.sanctioned.title"),
  };

  return <Banner appearance="error" title={errorMessages[error]} />;
}
