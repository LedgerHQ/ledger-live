import React, { useCallback, useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import BigNumber from "bignumber.js";
import { RootState, store } from "../store";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { loadAccountsForAccountId } from "../shared/accountDataActions";
import { isAlpacaForAccountId } from "../shared/syncStrategy";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { useTokenById } from "@ledgerhq/cryptoassets/hooks";

function getErrorMessage(e: unknown): string {
  return e instanceof globalThis.Error ? e.message : String(e);
}

const Section = styled.section`
  margin: 24px 0;
  padding: 16px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: #fafafa;
`;

const SectionTitle = styled.h3`
  margin: 0 0 12px;
  font-size: 1.1rem;
`;

const Button = styled.button`
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 4px;
  border: 1px solid #333;
  background: #333;
  color: #fff;
  cursor: pointer;
  margin-bottom: 16px;
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

const AccountCard = styled.div`
  position: relative;
  padding: 12px;
  margin: 0;
  border: 1px solid #ddd;
  border-top: none;
  background: #fff;
  &:first-of-type {
    border-top: 1px solid #ddd;
    border-radius: 6px 6px 0 0;
  }
  &:last-of-type {
    border-radius: 0 0 6px 6px;
  }
  &:only-of-type {
    border-radius: 6px;
  }
`;

const PathTag = styled.span<{ $alpaca: boolean }>`
  position: absolute;
  bottom: 6px;
  right: 8px;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 2px 5px;
  border-radius: 3px;
  background: ${p => (p.$alpaca ? "#e8d5a3" : "#e5e5e5")};
  color: ${p => (p.$alpaca ? "#7a6910" : "#555")};
`;

const PerfDurationCorner = styled.span`
  position: absolute;
  bottom: 6px;
  left: 8px;
  font-size: 11px;
  color: #0a0;
`;

const RadioRow = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  margin: 4px 0;
  font-size: 13px;
`;

const BalanceRow = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex: 1;
  min-width: 0;
`;

const SubRow = styled.div`
  margin-left: 24px;
  font-size: 12px;
`;

function TokenAccountRow({
  ta,
  selectedAccountId,
  onSelectedAccountIdChange,
}: {
  key?: string;
  ta: { id?: string; tokenId?: string; balance?: string };
  selectedAccountId: string | null;
  onSelectedAccountIdChange: (id: string | null) => void;
}) {
  const tokenId = ta.tokenId ?? "";
  const { token } = useTokenById(tokenId);
  const ticker = token?.ticker ?? tokenId;
  const unit = token?.units[0];
  return (
    <RadioRow>
      <input
        type="radio"
        name="selectedAccount"
        checked={selectedAccountId === ta.id}
        onChange={() => onSelectedAccountIdChange(ta.id ?? null)}
      />
      <BalanceRow>
        <span>
          └ {ticker}:{" "}
          {unit
            ? formatCurrencyUnit(unit, new BigNumber(ta.balance ?? "0"), { showCode: true })
            : ta.balance ?? "0"}
        </span>
      </BalanceRow>
    </RadioRow>
  );
}

export default function AccountDisplaySection({
  accountsBeingUsed,
  selectedAccountId,
  onSelectedAccountIdChange,
}: {
  accountsBeingUsed: string[];
  selectedAccountId: string | null;
  onSelectedAccountIdChange: (id: string | null) => void;
}) {
  const dispatch = useDispatch();
  const accounts = useSelector((s: RootState) => s.accounts);
  const [loading, setLoading] = useState(false);
  const [loadErrors, setLoadErrors] = useState<Record<string, string>>({});
  const [loadDurations, setLoadDurations] = useState<Record<string, number>>({});

  const idsToLoad = accountsBeingUsed.length > 0 ? accountsBeingUsed : accounts.allIds;

  const handleLoad = useCallback(async () => {
    if (idsToLoad.length === 0) return;
    setLoading(true);
    setLoadErrors(prev => {
      const next = { ...prev };
      idsToLoad.forEach(id => delete next[id]);
      return next;
    });
    for (const id of idsToLoad) {
      const start = Date.now();
      try {
        await loadAccountsForAccountId(id, dispatch);
        const durationSec = (Date.now() - start) / 1000;
        const state = store.getState();
        const acc = state.accounts.byId[id];
        const updates: Record<string, number> = { [id]: durationSec };
        for (const ta of acc?.subAccounts ?? []) {
          updates[ta.id] = durationSec;
        }
        setLoadDurations(prev => ({ ...prev, ...updates }));
      } catch (e) {
        setLoadErrors(prev => ({ ...prev, [id]: getErrorMessage(e) }));
      }
    }
    setLoading(false);
  }, [idsToLoad, dispatch]);

  return (
    <Section>
      <SectionTitle>Account display ( ⛁ accounts)</SectionTitle>
      <p style={{ fontSize: 12, color: "#666", margin: "0 0 8px" }}>
        Select an account for Operations & Balance history below.
      </p>
      <Button onClick={handleLoad} disabled={loading || idsToLoad.length === 0}>
        {loading ? "Loading…" : "LOAD / REFRESH"}
      </Button>
      {Array.from(new Set([...idsToLoad, ...accounts.allIds])).map(id => {
        const err = loadErrors[id];
        if (err) {
          return (
            <AccountCard key={id}>
              <Error>Load failed: {err}</Error>
              <span style={{ fontSize: 12, color: "#666" }}>Account id: {id}</span>
            </AccountCard>
          );
        }
        const acc = accounts.byId[id];
        if (!acc) return null;
        const isAlpaca = isAlpacaForAccountId(acc.id);
        const currency = getCryptoCurrencyById(acc.currencyId);
        return (
          <AccountCard key={acc.id}>
            {loadDurations[acc.id] != null && (
              <PerfDurationCorner>{loadDurations[acc.id].toFixed(1)}s</PerfDurationCorner>
            )}
            <PathTag $alpaca={isAlpaca}>{isAlpaca ? "Alpaca" : "Legacy"}</PathTag>
            <RadioRow>
              <input
                type="radio"
                name="selectedAccount"
                checked={selectedAccountId === acc.id}
                onChange={() => onSelectedAccountIdChange(acc.id)}
              />
              <BalanceRow>
                <span>
                  <strong>{currency.name}</strong>{" "}
                  {formatCurrencyUnit(currency.units[0], new BigNumber(acc.balance), {
                    showCode: true,
                  })}{" "}
                  — {acc.freshAddress}
                </span>
              </BalanceRow>
            </RadioRow>
            {(acc.subAccounts?.length ?? 0) > 0 && (
              <SubRow>
                {acc.subAccounts!.map(ta => (
                  <TokenAccountRow
                    key={ta.id}
                    ta={ta}
                    selectedAccountId={selectedAccountId}
                    onSelectedAccountIdChange={onSelectedAccountIdChange}
                  />
                ))}
              </SubRow>
            )}
          </AccountCard>
        );
      })}
    </Section>
  );
}
