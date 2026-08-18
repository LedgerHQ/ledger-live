import React from "react";
import { RecoverTriggerModalView } from "./RecoverTriggerModalView";
import { useRecoverTriggerModalViewModel } from "./useRecoverTriggerModalViewModel";

export default function RecoverTriggerModal() {
  return <RecoverTriggerModalView {...useRecoverTriggerModalViewModel()} />;
}
