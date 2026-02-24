import React, { useCallback, useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../store";
import { loadBalanceHistoryForAccountId } from "../data-layer/balanceHistory/actions";

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

const GraphWrapper = styled.div`
  height: 140px;
  background: #e8e8e8;
  border-radius: 4px;
  padding: 10px;
  margin-top: 8px;
`;

function BalanceCurveSvg({ balances }: { balances: number[] }) {
  if (balances.length === 0) {
    return (
      <GraphWrapper
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#666",
          fontSize: 13,
        }}
      >
        No data
      </GraphWrapper>
    );
  }
  const width = 400;
  const height = 120;
  const min = Math.min(...balances);
  const max = Math.max(...balances);
  const range = max - min || 1;
  const padding = 2;
  const n = balances.length;
  const points = balances.map((v, i) => {
    const x = (i / (n - 1 || 1)) * (width - 2 * padding) + padding;
    const y = height - padding - ((v - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  });
  const pathD = `M ${points.join(" L ")}`;
  const areaD = `${pathD} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;
  return (
    <GraphWrapper>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: 120, display: "block" }}
      >
        <path d={areaD} fill="rgba(0,0,0,0.12)" />
        <path
          d={pathD}
          fill="none"
          stroke="#555"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </GraphWrapper>
  );
}

export default function BalanceHistorySection({
  selectedAccountId,
}: {
  selectedAccountId: string | null;
}) {
  const dispatch = useDispatch();
  const accounts = useSelector((s: RootState) => s.accounts);
  const balanceHistory = useSelector((s: RootState) => s.balanceHistory);
  const [loading, setLoading] = useState(false);
  const [loadDurationSec, setLoadDurationSec] = useState<number | null>(null);

  const accountIdList = React.useMemo(() => {
    const ids: string[] = [];
    for (const accountId of accounts.allIds) {
      const acc = accounts.byId[accountId];
      if (!acc) continue;
      ids.push(accountId);
      for (const sub of acc.subAccounts || []) ids.push(sub.id);
    }
    return ids;
  }, [accounts.allIds, accounts.byId]);

  const handleLoad = useCallback(async () => {
    const id = selectedAccountId ?? accountIdList[0];
    if (!id) return;
    setLoading(true);
    const start = Date.now();
    try {
      await loadBalanceHistoryForAccountId(id, dispatch);
      setLoadDurationSec((Date.now() - start) / 1000);
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId, accountIdList, dispatch]);

  const selectedBalanceHistory = selectedAccountId
    ? balanceHistory.byAccountId[selectedAccountId]
    : null;

  return (
    <Section>
      <TitleRow>
        <SectionTitle>Balance history ( ⛁ balanceHistory)</SectionTitle>
      </TitleRow>
      <Button onClick={handleLoad} disabled={!selectedAccountId || loading}>
        {loading ? "Loading…" : "LOAD / REFRESH"}
      </Button>
      {selectedBalanceHistory && (
        <>
          <p style={{ fontSize: 12, color: "#666", margin: "8px 0 0" }}>
            DAY: {selectedBalanceHistory.DAY?.balances?.length ?? 0} points
            {selectedBalanceHistory.DAY?.latestDate != null &&
              ` (latest: ${new Date(selectedBalanceHistory.DAY.latestDate).toISOString().slice(0, 10)})`}
          </p>
          <BalanceCurveSvg balances={selectedBalanceHistory.DAY?.balances ?? []} />
        </>
      )}
      {loadDurationSec != null && <PerfDuration>{loadDurationSec.toFixed(1)}s</PerfDuration>}
    </Section>
  );
}
