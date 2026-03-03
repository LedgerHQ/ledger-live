import React from "react";
import { useTranslation } from "react-i18next";
import { Switch } from "@ledgerhq/lumen-ui-react";

type Props = Readonly<{
  isChecked: boolean;
  onChange: (value: boolean) => void;
}>;

export default function ShowHiddenSmallValueOperationsToggle({ isChecked, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-end gap-8">
      <span className="body-3 text-muted">
        {t("operationList.showHiddenSmallValueTransactions")}
      </span>
      <Switch
        name="show-hidden-small-value-operations"
        selected={isChecked}
        onChange={onChange}
      />
    </div>
  );
}
