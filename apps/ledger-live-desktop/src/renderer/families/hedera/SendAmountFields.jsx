// @flow

import React from "react";
import { withTranslation } from "react-i18next";

import type { SendAmountProps } from "./types";

import Box from "~/renderer/components/Box";
import MemoField from "./MemoField";

const Root = ({ status, account, transaction, onChange }: SendAmountProps) => {
  return (
    <Box flow={1}>
      <MemoField status={status} account={account} transaction={transaction} onChange={onChange} />
    </Box>
  );
};

export default {
  component: withTranslation()(Root),
  fields: ["memo"],
};
