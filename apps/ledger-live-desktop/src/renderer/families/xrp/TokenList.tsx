import React from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import { Account } from "@ledgerhq/types-live";
import Box from "~/renderer/components/Box";
import IconPlus from "~/renderer/icons/Plus";
import Button from "~/renderer/components/Button";
import addAssetAction from "./addAssetAction";

const ReceiveButton = ({ account }: { account: Account }) => {
  const dispatch = useDispatch();

  return (
    <Button small color="primary.c80" onClick={() => addAssetAction({ account, dispatch })}>
      <Box horizontal flow={1} alignItems="center">
        <IconPlus size={12} />
        <Box>
          <Trans i18nKey="tokensList.xrp.cta" />
        </Box>
      </Box>
    </Button>
  );
};

export default {
  ReceiveButton,
  hasSpecificTokenWording: true,
};
