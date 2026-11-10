import { Button } from "@ledgerhq/lumen-ui-react";
import type { AccountDetailToolProps } from "../types";
import { copy, eligibilityOf, statusOf } from "./copy";

export function AccountDetail({ analyticsIntroduction }: AccountDetailToolProps) {
  const { hasDismissed, isEligible, onReset } = analyticsIntroduction;

  return (
    <div className="flex flex-col">
      <section className="flex flex-col gap-8 border-b border-muted-subtle px-16 py-12">
        <h3 className="body-2-semi-bold text-base">{copy.analyticsIntroductionTitle}</h3>
        <div className="flex items-center justify-between gap-12">
          <span className="body-3 text-muted">{statusOf(hasDismissed)}</span>
          <Button appearance="accent" size="sm" disabled={!hasDismissed} onClick={onReset}>
            {copy.reset}
          </Button>
        </div>
        <span className="body-3 text-muted">{eligibilityOf(isEligible)}</span>
      </section>
    </div>
  );
}
