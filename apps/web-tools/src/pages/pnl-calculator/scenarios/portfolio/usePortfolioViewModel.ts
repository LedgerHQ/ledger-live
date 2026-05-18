import { useCallback, useMemo, useState } from "react";
import { useCryptoFiat } from "../../shared/useCryptoFiat";
import { useGenerationGuard } from "../../shared/useGenerationGuard";
import { formatPortfolio, type FormattedPortfolio } from "./format/formatPortfolio";
import { computePortfolioBreakdown } from "./model/computeBreakdown";
import { decodeAccounts } from "./model/decodeAccounts";
import { loadPortfolioCountervalues } from "./model/loadCountervalues";
import { parseAppJson } from "./model/parseAppJson";
import type { PortfolioBreakdown, PortfolioError, SkippedAccount } from "./model/types";

const QUOTE_FIAT_TICKER = "USD" as const;

export type PortfolioStatus =
  | { kind: "idle" }
  | { kind: "parsing"; fileName: string }
  | { kind: "loading-cv"; fileName: string; accountsCount: number }
  | {
      kind: "ready";
      fileName: string;
      breakdown: PortfolioBreakdown;
      decodeFailures: SkippedAccount[];
    }
  | { kind: "error"; fileName?: string; error: PortfolioError };

export type {
  FormattedAssetRow,
  FormattedReconciliation,
  FormattedPortfolio,
} from "./format/formatPortfolio";

function makeError(kind: PortfolioError["kind"], message: string): PortfolioError {
  return { kind, message };
}

export function usePortfolioViewModel() {
  const fiat = useCryptoFiat(QUOTE_FIAT_TICKER);
  const [status, setStatus] = useState<PortfolioStatus>({ kind: "idle" });
  const guard = useGenerationGuard();

  const reset = useCallback(() => {
    guard.cancel();
    setStatus({ kind: "idle" });
  }, [guard]);

  const onFile = useCallback(
    async (file: File) => {
      const token = guard.next();
      const fileName = file.name;
      setStatus({ kind: "parsing", fileName });

      let text: string;
      try {
        text = await file.text();
      } catch {
        if (guard.isStale(token)) return;
        setStatus({
          kind: "error",
          fileName,
          error: makeError("invalid-json", "Could not read the dropped file."),
        });
        return;
      }
      if (guard.isStale(token)) return;

      const parsed = parseAppJson(text);
      if ("error" in parsed) {
        setStatus({ kind: "error", fileName, error: parsed.error });
        return;
      }

      const { accounts, namesById, failures } = await decodeAccounts(parsed.accountsRaw);
      if (guard.isStale(token)) return;

      if (accounts.length === 0) {
        setStatus({
          kind: "error",
          fileName,
          error: makeError(
            "decode-all-failed",
            "None of the accounts in this app.json could be decoded — likely all unsupported currencies in this build.",
          ),
        });
        return;
      }

      setStatus({ kind: "loading-cv", fileName, accountsCount: accounts.length });

      try {
        const cv = await loadPortfolioCountervalues(accounts, fiat);
        if (guard.isStale(token)) return;
        const breakdown = computePortfolioBreakdown(accounts, cv, fiat, namesById);
        setStatus({ kind: "ready", fileName, breakdown, decodeFailures: failures });
      } catch (e) {
        if (guard.isStale(token)) return;
        setStatus({
          kind: "error",
          fileName,
          error: makeError(
            "countervalues-failed",
            e instanceof Error ? e.message : "Failed to fetch counter-values for these accounts.",
          ),
        });
      }
    },
    [fiat, guard],
  );

  const onFiles = useCallback(
    (files: FileList | File[] | null | undefined) => {
      if (!files) return;
      const file = files instanceof FileList ? files.item(0) : files[0];
      if (!file) return;
      onFile(file).catch(() => {
        /* onFile reports failures via setStatus; rejections here would be unexpected */
      });
    },
    [onFile],
  );

  const formatted = useMemo<FormattedPortfolio | null>(() => {
    if (status.kind !== "ready") return null;
    return formatPortfolio(status.breakdown, fiat, status.decodeFailures);
  }, [status, fiat]);

  return {
    fiatTicker: fiat.ticker,
    status,
    formatted,
    onFiles,
    reset,
  };
}

export type PortfolioViewModel = ReturnType<typeof usePortfolioViewModel>;
