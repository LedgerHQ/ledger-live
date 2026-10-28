import React from "react";
import { ChangeNameContentView } from "./ChangeNameContentView";
import type { ChangeNameContentProps } from "./types";
import { useChangeNameContentViewModel } from "./useChangeNameContentViewModel";

export function ChangeNameContent(props: ChangeNameContentProps) {
  return <ChangeNameContentView {...useChangeNameContentViewModel(props)} />;
}
