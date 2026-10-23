import { Banner, Button, Tag } from "@ledgerhq/lumen-ui-react";
import { explainFailure, httpStatusOf } from "../../../utils/explain";
import type { AccountPortfolioView, Run } from "../../../types";
import { ACTION_LABEL } from "../../../utils/labels";
import { ResultView } from "../ResultView";
import { Section } from "../../../components/Section";

export function ResultCard({
  run,
  view,
  hiddenCount,
  unmatchedCount,
}: Readonly<{
  run: Run;
  view: AccountPortfolioView | undefined;
  hiddenCount: number;
  unmatchedCount: number;
}>) {
  const { action, result } = run;
  const status = httpStatusOf(result);
  const explanation = explainFailure(action, result);
  const raw = JSON.stringify(result.body, null, 2);

  return (
    <Section title={`Result · ${ACTION_LABEL[action]}`}>
      <div className="flex flex-wrap items-center gap-8">
        <Tag
          appearance={result.ok ? "success" : "error"}
          size="md"
          label={result.ok ? "OK" : "Failed"}
        />
        {status === undefined ? null : <Tag appearance="gray" size="md" label={`HTTP ${status}`} />}
        <Tag appearance="gray" size="md" label={`${result.durationMs} ms`} />
        <Button
          size="sm"
          appearance="no-background"
          onClick={() => navigator.clipboard?.writeText(raw)}
        >
          Copy JSON
        </Button>
      </div>

      <div className="body-3 font-mono break-all text-muted">
        {result.sent.method} {result.sent.url}
      </div>

      {explanation ? (
        <Banner appearance="error" title="What this means" description={explanation} />
      ) : null}

      {view ? <ResultView view={view} currency={result.currency} /> : null}
      {unmatchedCount > 0 ? (
        <div className="flex">
          <Tag appearance="gray" size="sm" label={`${unmatchedCount} hidden by the search`} />
        </div>
      ) : null}
      {hiddenCount > 0 ? (
        <div className="flex">
          <Tag appearance="gray" size="sm" label={`${hiddenCount} hidden: no ledger id`} />
        </div>
      ) : null}

      {result.sent.body === undefined ? null : (
        <details>
          <summary className="cursor-pointer body-3 text-muted">Sent body</summary>
          <pre className="mt-8 rounded-md bg-muted-transparent p-12 body-3 font-mono break-all whitespace-pre-wrap text-base">
            {JSON.stringify(result.sent.body, null, 2)}
          </pre>
        </details>
      )}

      <details open={!result.view}>
        <summary className="cursor-pointer body-3 text-muted">Raw response</summary>
        <pre className="mt-8 rounded-md bg-muted-transparent p-12 body-3 font-mono break-all whitespace-pre-wrap text-base">
          {raw}
        </pre>
      </details>
    </Section>
  );
}
