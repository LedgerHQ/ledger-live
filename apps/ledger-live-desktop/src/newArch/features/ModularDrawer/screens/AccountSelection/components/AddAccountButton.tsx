import React from "react";
import { CardButton } from "@ledgerhq/react-ui/pre-ldls/index";
import { Icons } from "@ledgerhq/react-ui/index";
import { useTranslation } from "react-i18next";

type Props = {
  onAddAccountClick: () => void;
};

export const AddAccountButton = ({ onAddAccountClick }: Props) => {
  const { t } = useTranslation();

  return (
    <CardButton
      onClick={onAddAccountClick}
      title={t("drawers.selectAccount.addAccount")}
      iconRight={<Icons.Plus size="S" />}
      variant="dashed"
    />
  );
};
