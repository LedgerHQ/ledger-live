import React from "react";
import { useTranslation } from "react-i18next";
import { Spot } from "@ledgerhq/ldls-ui-react";
import { Search } from "@ledgerhq/ldls-ui-react/symbols";

type EmptyListProps = {
  translationKey?: string;
};

const EmptyList = ({ translationKey }: EmptyListProps) => {
  const { t } = useTranslation();
  const text = translationKey ? t(translationKey) : t("modularAssetDrawer.emptyAssetList");

  return (
    <div className="flex flex-col items-center justify-center gap-16 pt-12">
      <Spot appearance="icon" icon={Search} size={72} />
      <p className="body-2 text-muted text-center mt-6">{text}</p>
    </div>
  );
};

export default EmptyList;
