import { Divider } from "@ledgerhq/lumen-ui-react";

export function PnlCalculatorPanelsDivider() {
  return (
    <div className="flex items-center justify-center lg:w-32 lg:shrink-0">
      <Divider orientation="horizontal" className="w-full lg:hidden" />
      <Divider
        orientation="vertical"
        className="hidden lg:block h-auto min-h-256 w-px self-stretch"
      />
    </div>
  );
}
