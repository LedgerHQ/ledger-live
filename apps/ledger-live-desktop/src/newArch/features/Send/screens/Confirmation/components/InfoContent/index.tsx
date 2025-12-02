import React from "react";
import { useTranslation } from "react-i18next";
import { Spot } from "@ledgerhq/lumen-ui-react";

type InfoContentProps = Readonly<{
  titleKey: string;
  descriptionKey: string;
}>;

export function InfoContent({ titleKey, descriptionKey }: InfoContentProps) {
  const { t } = useTranslation();

  return (
    <>
      <Spot appearance="info" size={72} />
      <div className="flex flex-col items-center gap-12 text-center">
        <h3 className="text-base heading-3-semi-bold">{t(titleKey)}</h3>
        <p className="text-muted body-2">{t(descriptionKey)}</p>
      </div>
    </>
  );
}
