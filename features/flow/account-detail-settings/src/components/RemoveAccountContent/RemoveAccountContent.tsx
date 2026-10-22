import React from "react";
import { RemoveAccountContentView } from "./RemoveAccountContentView";
import type { RemoveAccountContentProps } from "./types";
import { useRemoveAccountContentViewModel } from "./useRemoveAccountContentViewModel";

export function RemoveAccountContent(props: RemoveAccountContentProps) {
  return <RemoveAccountContentView {...props} {...useRemoveAccountContentViewModel()} />;
}
