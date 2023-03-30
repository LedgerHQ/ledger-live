import React from "react";
import { withTranslation } from "react-i18next";
import { SendAmountProps } from "./types";
import Box from "~/renderer/components/Box";
import MemoField from "./MemoField";
const Root = (props: SendAmountProps) => {
  return (
    <Box flow={1}>
      <MemoField {...props} />
    </Box>
  );
};
export default {
  component: withTranslation()(Root),
  fields: ["memo"],
};
