import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-rnative";

export function CardSkeleton() {
  return <Skeleton lx={{ width: "full", aspectRatio: 1.586, borderRadius: "lg" }} />;
}
