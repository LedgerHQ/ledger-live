import React from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import type { Account } from "@ledgerhq/types-live";
import { openModal } from "~/renderer/actions/modals";
import Box from "~/renderer/components/Box";
import IconPlus from "~/renderer/icons/Plus";
import Button from "~/renderer/components/Button";

const ReceiveButton = ({ account }: { account: Account }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onReceiveClick = () => {
    dispatch(
      openModal("MODAL_HEDERA_RECEIVE_WITH_ASSOCIATION", { account, receiveTokenMode: true }),
    );
  };

  return (
    <Button small primary onClick={onReceiveClick}>
      <Box horizontal flow={1} alignItems="center">
        <IconPlus size={12} />
        <Box>{t("tokensList.cta")}</Box>
      </Box>
    </Button>
  );
};

export default {
  ReceiveButton,
};
