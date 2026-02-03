import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";

export const AddAccount = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const onAction = () => {
    dispatch(openModal("MODAL_ADD_ACCOUNTS", undefined));
  };

  return (
    <div className="flex flex-col items-center">
      <Button
        appearance="gray"
        size="md"
        isFull
        onClick={onAction}
        data-testid={`portfolio-add-account-button`}
      >
        {t("portfolio.addAccountCta")}
      </Button>
    </div>
  );
};
