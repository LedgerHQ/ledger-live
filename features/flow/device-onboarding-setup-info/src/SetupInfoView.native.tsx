import React from "react";
import { InfoCard } from "./components/InfoCard";
import { InfoSheet } from "./components/InfoSheet";
import type { SetupInfoViewProps } from "./useSetupInfoViewModel";

export function SetupInfoView({ infoCard, infoSheet }: SetupInfoViewProps) {
  return (
    <>
      {infoCard ? <InfoCard {...infoCard} /> : null}
      {infoSheet ? <InfoSheet {...infoSheet} /> : null}
    </>
  );
}
