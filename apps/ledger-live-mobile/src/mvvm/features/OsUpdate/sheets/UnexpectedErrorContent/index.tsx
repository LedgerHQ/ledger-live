import React from "react";
import { UnexpectedErrorContentView } from "./UnexpectedErrorContentView";
import { useUnexpectedErrorContentViewModel } from "./useUnexpectedErrorContentViewModel";

type UnexpectedErrorContentProps = Readonly<{ onCancel: () => void }>;

export function UnexpectedErrorContent({ onCancel }: UnexpectedErrorContentProps) {
  return (
    <UnexpectedErrorContentView onCancel={onCancel} {...useUnexpectedErrorContentViewModel()} />
  );
}
