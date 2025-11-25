import React from "react";
import Button from "~/renderer/components/Button";
import { useTranslation } from "react-i18next";

type Props = Omit<React.ComponentProps<typeof Button>, "t">;

const AbortButton = (props: Props) => {
  const { t } = useTranslation();
  return <Button {...props}>{t("common.close")}</Button>;
};

export default AbortButton;
