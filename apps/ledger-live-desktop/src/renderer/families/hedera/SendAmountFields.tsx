import React from "react";
import Box from "~/renderer/components/Box";
import MemoField from "./MemoField";
import { SendAmountProps } from "./types";

const Root = (props: SendAmountProps) => {
  return (
    <Box flow={1}>
      <MemoField {...props} />
    </Box>
  );
};
export default {
  component: Root,
  fields: ["memo"],
};
