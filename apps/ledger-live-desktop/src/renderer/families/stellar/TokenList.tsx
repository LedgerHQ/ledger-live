import React from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import { Account } from "@ledgerhq/types-live";
import { openModal } from "~/renderer/reducers/modals";
import Box from "~/renderer/components/Box";
import IconPlus from "~/renderer/icons/Plus";
import Button from "~/renderer/components/Button";

const ReceiveButton = ({ account }: { account: Account }) => {
  const dispatch = useDispatch();
  const onReceiveClick = () => {
    dispatch(openModal("MODAL_STELLAR_ADD_ASSET", { account }));
  };
  return (
    <Button small color="primary.c80" onClick={onReceiveClick}>
      <Box horizontal flow={1} alignItems="center">
        <IconPlus size={12} />
        <Box>
          <Trans i18nKey="tokensList.stellar.cta" />
        </Box>
      </Box>
    </Button>
  );
};
export default {
  ReceiveButton,
  hasSpecificTokenWording: true,
};
