import React from "react";
import { Trans, useTranslation } from "react-i18next";
import Alert from "~/renderer/components/Alert";

type Props = {
  transaction: string;
};

const ConfirmAlert = (_props: Props) => {
  const { t } = useTranslation();

  return (
    <Alert type="primary" mb={26}>
      <Trans
        i18nKey={"TransactionConfirm.doubleCheck"}
        values={{
          recipientWording: t("TransactionConfirm.recipientWording.send"),
        }}
      />
    </Alert>
  );
};

export default ConfirmAlert;
