import React from "react";
import { FreezeScene } from "./FreezeScene";
import { MoreScene } from "./MoreScene";
import { OverviewScene } from "./OverviewScene";
import type { CardDetailsSceneProps } from "./types";

export function CardDetailsScene({ route, overview, freeze, more }: CardDetailsSceneProps) {
  switch (route.name) {
    case "freeze":
      return <FreezeScene {...freeze} />;
    case "more":
      return more ? <MoreScene {...more} /> : null;
    case "overview":
      return <OverviewScene {...overview} />;
  }
}
