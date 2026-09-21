import React from "react";
import { MoreAction } from "./MoreAction";
import type { MoreViewProps } from "../types";

export function Tile({ moreLabel, onMorePress }: MoreViewProps) {
  return <MoreAction moreLabel={moreLabel} onMorePress={onMorePress} />;
}
