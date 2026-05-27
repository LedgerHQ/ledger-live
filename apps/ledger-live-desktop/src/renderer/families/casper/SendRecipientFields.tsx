import React from "react";
import Box from "~/renderer/components/Box";
import MemoField from "./MemoField";
import { TransferIdProps } from "./types";
import { useFeature } from "@features/platform-feature-flags";

const Root = (props: TransferIdProps) => {
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
