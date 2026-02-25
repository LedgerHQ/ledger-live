import React from "react";
import { useTranslation } from "react-i18next";
import { Spot } from "@ledgerhq/lumen-ui-react";

type InfoContentProps = Readonly<{
  titleKey: string;
  descriptionKey: string;
}>;

export const InfoContent = ({ titleKey, descriptionKey }: InfoContentProps) => {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-col items-center gap-24 pt-16"
      data-testid="send-confirmation-info-content"
    >
      <Spot appearance="info" size={72} />
      <div className="flex flex-col items-center gap-12 text-center">
        <h3 className="heading-3-semi-bold text-base" data-testid="send-confirmation-info-title">
          {t(titleKey)}
        </h3>
        <p className="body-2 text-muted">{t(descriptionKey)}</p>
      </div>
    </div>
  );
};
