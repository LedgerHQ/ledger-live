import React from "react";
import { ChangeNameContentView } from "./ChangeNameContentView.web";
import type { ChangeNameContentProps } from "./types.web";
import { useChangeNameContentViewModel } from "./useChangeNameContentViewModel.web";

export function ChangeNameContent(props: ChangeNameContentProps) {
  return <ChangeNameContentView {...useChangeNameContentViewModel(props)} />;
}
