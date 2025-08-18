import { Tag } from "@ledgerhq/react-ui/pre-ldls/index";
import React from "react";

const ApyIndicator = ({ value, type }: { value: number; type: "NRR" | "APY" | "APR" }) => {
  return <Tag spacing="md">{`~ ${value}% ${type}`}</Tag>;
};
export default ApyIndicator;
