import React from "react";
import Box from "~/renderer/components/Box";
import MemoField from "./MemoField";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { InternetComputerMemoFieldProps } from "./types";

const Root = (props: InternetComputerMemoFieldProps) => {
  const lldMemoTag = useFeature("lldMemoTag");

  if (!lldMemoTag?.enabled) return null;

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
