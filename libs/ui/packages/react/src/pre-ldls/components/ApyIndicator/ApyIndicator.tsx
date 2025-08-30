import { Tag } from "../Tag/Tag";
import React from "react";

export const ApyIndicator = ({ value, type }: { value: number; type: "NRR" | "APY" | "APR" }) => {
  return <Tag spacing="md">{`~ ${value}% ${type}`}</Tag>;
};
