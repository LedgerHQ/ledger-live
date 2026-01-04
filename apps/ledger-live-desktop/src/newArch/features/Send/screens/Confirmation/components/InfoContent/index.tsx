import React from "react";
import { useTranslation } from "react-i18next";
import { Spot } from "@ledgerhq/lumen-ui-react";

type InfoContentProps = Readonly<{
  titleKey: string;
  descriptionKey: string;
}>;

<<<<<<< HEAD
export function InfoContent({ titleKey, descriptionKey }: InfoContentProps) {
=======
export const InfoContent = ({ titleKey, descriptionKey }: InfoContentProps) => {
>>>>>>> 6570c37c6c (feat(LWD): Signature screen (redesign send flow) (with placeholders screens))
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
<<<<<<< HEAD
}
=======
};
>>>>>>> 6570c37c6c (feat(LWD): Signature screen (redesign send flow) (with placeholders screens))
