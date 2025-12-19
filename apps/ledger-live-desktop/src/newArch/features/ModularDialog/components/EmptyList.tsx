import React from "react";
import { useTranslation } from "react-i18next";
import { Search } from "@ledgerhq/lumen-ui-react/symbols";

const EmptyList = () => {
  const { t } = useTranslation();
  const text = t("modularAssetDrawer.emptyAssetList");
  const Icon = <Search size={40} className="text-base" />;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-16">
      <div className="flex items-center justify-center rounded-full bg-muted-transparent p-16">
        {Icon}
      </div>
      <span className="text-base body-3-semi-bold">{text}</span>
    </div>
  );
};

export default EmptyList;
