import React from "react";
import type { AcknowledgementProps } from "./Acknowledgement.types";
import { AcknowledgementView } from "./AcknowledgementView";
import { useAcknowledgementViewModel } from "./useAcknowledgementViewModel";

export function Acknowledgement(props: AcknowledgementProps) {
  return <AcknowledgementView {...useAcknowledgementViewModel(props)} />;
}
