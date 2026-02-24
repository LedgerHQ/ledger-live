import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import BigNumber from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import { RootState } from "../store";
import { loadOperationHistoryForAccountId } from "../data-layer/operationHistory/actions";
import { selectPendingOperationsByAccountId } from "../data-layer/transactional/selectors";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { useTokenById } from "@ledgerhq/cryptoassets/hooks";

const OPERATIONS_PAGE_SIZE = 20;

function getErrorMessage(e: unknown): string {
  return e instanceof globalThis.Error ? e.message : String(e);
}

const Section = styled.section`
  position: relative;
  margin: 24px 0;
  padding: 16px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: #fafafa;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 12px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
`;

const PerfDuration = styled.span`
  position: absolute;
  bottom: 8px;
  left: 8px;
  font-size: 11px;
  color: #0a0;
`;

const Button = styled.button`
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 4px;
  border: 1px solid #333;
  background: #fff;
  color: #333;
  cursor: pointer;
  margin-top: 8px;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Error = styled.span`
  color: #c00;
  font-size: 13px;
  display: block;
  margin-top: 8px;
`;

const OpList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 13px;
  max-height: 300px;
  overflow: auto;
`;

const OpItem = styled.li`
  padding: 6px 0;
  border-bottom: 1px solid #eee;
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 12px;
  font-size: 13px;
`;

const OpType = styled.span`
  flex-shrink: 0;
  min-width: 4.5em;
`;

const OpDate = styled.span`
  flex-shrink: 0;
`;

const OpAddress = styled.span`
  min-width: 0;
  flex: 1;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const OpAmount = styled.span`
  flex-shrink: 0;
  margin-left: auto;
`;

function getTokenIdFromOp(op: { tokenId?: string; extra?: unknown }): string {
  if (typeof op.tokenId === "string" && op.tokenId) return op.tokenId;
  const extra = op.extra;
  if (!extra || typeof extra !== "object" || !("tokenId" in extra)) return "";
  const v = (extra as Record<string, unknown>).tokenId;
  return typeof v === "string" ? v : "";
}

function OpRow({
  op,
  selectedUnit,
  selectedTokenId,
}: {
  key?: string;
  op: {
    id?: string;
    type?: string;
    value?: string;
    hash?: string;
    date?: Date | string | number;
    tokenId?: string;
    senders?: string[];
    recipients?: string[];
    extra?: unknown;
  };
  selectedUnit: Unit | null;
  selectedTokenId: string;
}) {
  const opTokenId = getTokenIdFromOp(op);
  const effectiveTokenId = opTokenId || selectedTokenId;
  const { token } = useTokenById(effectiveTokenId);
  const unit = effectiveTokenId ? token?.units[0] ?? null : selectedUnit;
  const address =
    op.type === "IN"
      ? op.senders?.[0] ?? op.recipients?.[0] ?? op.hash ?? ""
      : op.recipients?.[0] ?? op.senders?.[0] ?? op.hash ?? "";
  const dateStr =
    typeof op.date === "number"
      ? new Date(op.date).toISOString().slice(0, 10)
      : op.date instanceof Date
        ? op.date.toISOString().slice(0, 10)
        : String(op.date ?? "");
  const amountStr = unit
    ? formatCurrencyUnit(unit, new BigNumber(op.value ?? "0"), { showCode: true })
    : op.value ?? "0";
  return (
    <OpItem>
      <OpType>{op.type ?? ""}</OpType>
      <OpDate>{dateStr}</OpDate>
      <OpAddress>{address}</OpAddress>
      <OpAmount>{amountStr}</OpAmount>
    </OpItem>
  );
}

export default function OperationsSection({
  selectedAccountId,
}: {
  accountsBeingUsed: string[];
  selectedAccountId: string | null;
}) {
  const dispatch = useDispatch();
  const accounts = useSelector((s: RootState) => s.accounts);
  const operationHistory = useSelector((s: RootState) => s.operationHistory);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadDurationSec, setLoadDurationSec] = useState<number | null>(null);
  /** Client-side: how many ops to show when API didn't return nextPagingToken (bridge or Alpaca without pagination). */
  const [visibleCount, setVisibleCount] = useState(OPERATIONS_PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(OPERATIONS_PAGE_SIZE);
  }, [selectedAccountId]);

  const handleLoad = useCallback(async () => {
    if (!selectedAccountId) return;
    setLoading(true);
    setError(null);
    setVisibleCount(OPERATIONS_PAGE_SIZE);
    const start = Date.now();
    try {
      await loadOperationHistoryForAccountId(selectedAccountId, dispatch, {
        limit: OPERATIONS_PAGE_SIZE,
      });
      setLoadDurationSec((Date.now() - start) / 1000);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId, dispatch]);

  const handleLoadMore = useCallback(async () => {
    if (!selectedAccountId) return;
    const entry = operationHistory.byAccountId[selectedAccountId];
    if (entry?.nextPagingToken) {
      setLoadingMore(true);
      setError(null);
      try {
        await loadOperationHistoryForAccountId(selectedAccountId, dispatch, {
          limit: OPERATIONS_PAGE_SIZE,
          pagingToken: entry.nextPagingToken,
        });
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setLoadingMore(false);
      }
    } else {
      setVisibleCount(prev => prev + OPERATIONS_PAGE_SIZE);
    }
  }, [selectedAccountId, dispatch, operationHistory.byAccountId]);

  const selectedOps = selectedAccountId ? operationHistory.byAccountId[selectedAccountId] : null;
  const pendingOps = useSelector((s: RootState) =>
    selectedAccountId ? selectPendingOperationsByAccountId(s, selectedAccountId) : [],
  );
  /** Dedupe by id: pending (transactional) + confirmed (operationHistory). */
  const allOpsDeduped = useMemo(() => {
    const combined = selectedOps ? [...pendingOps, ...selectedOps.operations] : [];
    const seen = new Set<string>();
    return combined.filter(op => {
      if (seen.has(op.id)) return false;
      seen.add(op.id);
      return true;
    });
  }, [pendingOps, selectedOps?.operations]);
  /** Server-side pagination: show all ops we have (append already added them). Client-side: slice by visibleCount. */
  const displayedOps =
    selectedOps?.nextPagingToken != null ? allOpsDeduped : allOpsDeduped.slice(0, visibleCount);
  const hasMoreClientSide = !selectedOps?.nextPagingToken && allOpsDeduped.length > visibleCount;
  const hasMoreServerSide = Boolean(selectedOps?.nextPagingToken);
  const canLoadMore = hasMoreClientSide || hasMoreServerSide;

  /** TokenId of the selected account when it's a token account; else "". */
  const selectedTokenId = useMemo((): string => {
    if (!selectedAccountId) return "";
    if (accounts.byId[selectedAccountId]) return "";
    for (const acc of Object.values(accounts.byId)) {
      const sub = acc.subAccounts?.find(s => s.id === selectedAccountId);
      if (sub) return sub.tokenId;
    }
    return "";
  }, [selectedAccountId, accounts.byId]);
  const { token: selectedToken } = useTokenById(selectedTokenId);

  /** Default unit: main account = currency unit, token account = that token's unit. */
  const selectedUnit = useMemo((): Unit | null => {
    if (!selectedAccountId) return null;
    const main = accounts.byId[selectedAccountId];
    if (main) return getCryptoCurrencyById(main.currencyId).units[0];
    return selectedToken?.units[0] ?? null;
  }, [selectedAccountId, accounts.byId, selectedToken]);

  return (
    <Section>
      <TitleRow>
        <SectionTitle>Operations ( ⛁ operationHistory)</SectionTitle>
      </TitleRow>
      <p style={{ fontSize: 12, color: "#666", margin: "0 0 8px" }}>
        Loads operations for the selected account only.
      </p>
      <Button onClick={handleLoad} disabled={loading || !selectedAccountId}>
        {loading ? "Loading…" : "LOAD / REFRESH"}
      </Button>
      {error && <Error>{error}</Error>}
      {loadDurationSec != null && !loading && (
        <PerfDuration>{loadDurationSec.toFixed(1)}s</PerfDuration>
      )}
      {selectedOps && (
        <>
          <OpList>
            {allOpsDeduped.length === 0 && <li style={{ color: "#666" }}>No operations</li>}
            {displayedOps.map(op => (
              <OpRow
                key={op.id}
                op={op}
                selectedUnit={selectedUnit}
                selectedTokenId={selectedTokenId}
              />
            ))}
          </OpList>
          {canLoadMore && (
            <Button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              style={{ marginTop: 8 }}
            >
              {loadingMore ? "Loading…" : `Load more (${OPERATIONS_PAGE_SIZE})`}
            </Button>
          )}
        </>
      )}
    </Section>
  );
}
