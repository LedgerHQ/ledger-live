import React from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import type { Account } from "@ledgerhq/types-live";
import Box from "~/renderer/components/Box";
import IconPlus from "~/renderer/icons/Plus";
import Button from "~/renderer/components/Button";
import { openAddToken } from "./AddTokenDialog/addTokenDialog";

const ReceiveButton: React.FC<{ account: Account }> = () => {
  const dispatch = useDispatch();

  return (
    <Button small color="primary.c80" onClick={() => dispatch(openAddToken())}>
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
