import { Button, Tag } from "@ledgerhq/lumen-ui-react";
import { httpStatusOf } from "../../utils/explain";
import { ACTION_LABEL } from "../../utils/labels";
import { Section } from "../../components/Section";
import type { AccountPortfolioViewModel } from "../../AccountPortfolio/types";

export function HistoryTab({
  history,
  selected,
  openRun,
  clearHistory,
}: Readonly<Pick<AccountPortfolioViewModel, "history" | "selected" | "openRun" | "clearHistory">>) {
  return (
    <Section
      title="History"
      description="Every call of this session, latest first. Open one to see its result again."
    >
      {history.length === 0 ? (
        <div className="body-3 text-muted">Nothing yet: the calls you run are listed here.</div>
      ) : (
        <>
          <div className="flex">
            <Button size="sm" appearance="no-background" onClick={clearHistory}>
              Clear history
            </Button>
          </div>
          <div className="flex max-h-560 flex-col gap-4 overflow-y-auto pr-8">
            {history.map(entry => {
              const status = httpStatusOf(entry.result);
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => openRun(entry.id)}
                  className={`flex flex-col gap-4 rounded-md p-12 text-left ${
                    entry.id === selected?.id ? "bg-muted-transparent" : "bg-base"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-8">
                    <Tag
                      appearance={entry.result.ok ? "success" : "error"}
                      size="sm"
                      label={entry.result.ok ? "OK" : "Failed"}
                    />
                    {status === undefined ? null : (
                      <Tag appearance="gray" size="sm" label={`HTTP ${status}`} />
                    )}
                    <span className="body-2-semi-bold text-base">{ACTION_LABEL[entry.action]}</span>
                    <span className="body-3 text-muted">
                      {new Date(entry.at).toLocaleTimeString()} · {entry.result.durationMs} ms
                    </span>
                  </div>
                  <div className="body-3 font-mono break-all text-muted">
                    {entry.result.sent.method} {entry.result.sent.url}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </Section>
  );
}
