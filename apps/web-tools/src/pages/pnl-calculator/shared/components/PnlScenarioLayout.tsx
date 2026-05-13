import type { ReactNode } from "react";
import { PnlCalculatorPanelsDivider } from "./PnlCalculatorPanelsDivider";

type PnlScenarioLayoutProps = Readonly<{
  inputs: ReactNode;
  outcome: ReactNode;
  /** Pass `null` to drop the divider (e.g. stacked variants). */
  divider?: ReactNode | null;
}>;

export function PnlScenarioLayout({
  inputs,
  outcome,
  divider = <PnlCalculatorPanelsDivider />,
}: PnlScenarioLayoutProps) {
  return (
    <div className="flex flex-col gap-24 lg:flex-row lg:items-stretch lg:justify-center">
      {inputs}
      {divider}
      {outcome}
    </div>
  );
}
