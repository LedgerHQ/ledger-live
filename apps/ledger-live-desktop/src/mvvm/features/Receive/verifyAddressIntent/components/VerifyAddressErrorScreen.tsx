import React from "react";
import { useTranslation } from "react-i18next";
import { InfoState } from "@shared/ui-info-state";

type Props = Readonly<{
  title: React.ReactNode;
  description: React.ReactNode;
  onClose: () => void;
}>;

export function VerifyAddressErrorScreen({ title, description, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <InfoState
      preset="error"
      size="hug"
      title={title}
      description={description}
      primaryCta={{ label: t("common.close"), onPress: onClose }}
      testID="receive-verify-address-error"
    />
  );
}
