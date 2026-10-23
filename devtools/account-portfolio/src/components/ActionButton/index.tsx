import { Button } from "@ledgerhq/lumen-ui-react";
import type { AccountPortfolioAction } from "../../types";
import { needsPortfolio } from "../../utils/actionScope";
import { ACTION_LABEL } from "../../utils/labels";
import type { AccountPortfolioViewModel } from "../../AccountPortfolio/types";

/** What any button that runs a call needs from the view model. */
export type RunProps = Pick<
  AccountPortfolioViewModel,
  "running" | "blocked" | "portfolioMissing" | "run"
>;

export function ActionButton({
  kind,
  running,
  blocked,
  portfolioMissing,
  run,
  appearance = "gray",
  disabled = false,
  label = ACTION_LABEL[kind],
}: Readonly<
  RunProps & {
    kind: AccountPortfolioAction;
    appearance?: "base" | "gray" | "red";
    disabled?: boolean;
    label?: string;
  }
>) {
  return (
    <Button
      size="sm"
      appearance={appearance}
      loading={running === kind}
      disabled={blocked || (needsPortfolio(kind) && portfolioMissing) || disabled}
      onClick={() => run(kind)}
    >
      {label}
    </Button>
  );
}
