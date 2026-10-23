import { Button, Tag, TextInput } from "@ledgerhq/lumen-ui-react";
import type { AccountPortfolioViewModel } from "../../AccountPortfolio/types";

/**
 * The portfolio every Portfolio and Read call acts on, and the currency values come in. They change
 * rarely, so they show as a line to read, and the fields only open on demand.
 */
export function ContextBar({
  portfolioId,
  setPortfolioId,
  currency,
  setCurrency,
  contextOpen,
  setContextOpen,
}: Readonly<
  Pick<
    AccountPortfolioViewModel,
    "portfolioId" | "setPortfolioId" | "currency" | "setCurrency" | "contextOpen" | "setContextOpen"
  >
>) {
  return (
    <section className="flex flex-col gap-12 rounded-lg bg-surface p-12">
      <div className="flex items-center gap-8">
        <span className="body-3 text-muted">Portfolio</span>
        <span className="min-w-0 truncate body-2-semi-bold font-mono text-base" title={portfolioId}>
          {portfolioId.trim() || "none"}
        </span>
        <Tag appearance="gray" size="sm" label={currency.trim().toUpperCase() || "USD"} />
        <Button
          size="sm"
          appearance="no-background"
          className="ml-auto"
          onClick={() => setContextOpen(!contextOpen)}
        >
          {contextOpen ? "Done" : "Change"}
        </Button>
      </div>
      {contextOpen ? (
        <div className="grid grid-cols-[2fr_1fr] gap-12">
          <TextInput
            label="Portfolio id"
            value={portfolioId}
            onChange={e => setPortfolioId(e.target.value)}
          />
          <TextInput
            label="Currency"
            value={currency}
            onChange={e => setCurrency(e.target.value)}
          />
        </div>
      ) : null}
    </section>
  );
}
