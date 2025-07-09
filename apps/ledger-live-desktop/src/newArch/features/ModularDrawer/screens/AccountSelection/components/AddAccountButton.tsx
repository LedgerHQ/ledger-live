import type { ComponentProps } from "react";
import React from "react";
import { CardButton } from "@ledgerhq/react-ui/pre-ldls/index";
import { Icons } from "@ledgerhq/react-ui/index";
import { useTranslation } from "react-i18next";

type CardButtonProps = Omit<ComponentProps<typeof CardButton>, "onClick" | "title">;

type Props = {
  onAddAccountClick: () => void;
} & CardButtonProps;

export const AddAccountButton = ({ onAddAccountClick, ...rest }: Props) => {
  const { t } = useTranslation();

  return (
    <CardButton
      onClick={onAddAccountClick}
      title={t("drawers.selectAccount.addAccount")}
      iconRight={<Icons.Plus size="S" />}
      variant="dashed"
      {...rest}
    />
  );
};
