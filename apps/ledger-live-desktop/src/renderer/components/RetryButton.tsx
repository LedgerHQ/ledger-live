import React from "react";
import Button from "~/renderer/components/Button";
import { useTranslation } from "react-i18next";

type Props = Omit<React.ComponentProps<typeof Button>, "onClick"> & {
  onClick: () => void;
};

const RetryButton = ({ onClick, ...props }: Props) => {
  const { t } = useTranslation();
  return (
    <Button {...props} onClick={() => onClick()}>
      {t("common.retry")}
    </Button>
  );
};

export default RetryButton;
