import React from "react";
import { useFreezeCardViewModel } from "./useFreezeCardViewModel";
import { FreezeView } from "./FreezeView";

export function Freeze() {
  return <FreezeView {...useFreezeCardViewModel()} />;
}
