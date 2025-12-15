import React from "react";
import { CardButton } from "@ledgerhq/ldls-ui-react";
import { Plus } from "@ledgerhq/ldls-ui-react/symbols";
import { useTranslation } from "react-i18next";

type Props = {
  onAddAccountClick: () => void;
};

export const AddAccountButton = ({ onAddAccountClick }: Props) => {
  const { t } = useTranslation();

  return (
    <CardButton
      title={t("drawers.selectAccount.addAccount")}
      icon={Plus}
      hideChevron
      appearance="outline"
      onClick={onAddAccountClick}
    />
  );
};
