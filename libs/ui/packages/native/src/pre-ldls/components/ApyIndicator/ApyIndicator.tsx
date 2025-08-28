import React from "react";
import { Tag } from "../Tag/Tag";

export const ApyIndicator = ({ value, type }: { value: number; type: "NRR" | "APY" | "APR" }) => {
  return <Tag spacing="md">{`~ ${value}% ${type}`}</Tag>;
};
