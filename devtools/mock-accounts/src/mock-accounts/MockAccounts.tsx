import { useEffect, useMemo, useState } from "react";
import { computeAccountUUID, serializeAccountDescriptor } from "@domain/entity-account-descriptor";
import { CRYPTO_CURRENCIES_IDS } from "@domain/entity-currency-crypto";
import { mockDescriptors } from "../generate";
import { mockSource } from "../mockSource";
import { setOperationCount } from "../operationCounts";
import type { MockAccountsToolProps } from "../types";

const MAX_COUNT = 100;
const MAX_OPERATIONS = 10_000;

/** The integer typed, clamped to [min, max]; `undefined` when the field is empty or not a number. */
function parseBounded(value: string, min: number, max: number): number | undefined {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : Math.min(max, Math.max(min, parsed));
}

/** The families with their own mock first, then every network. */
const FEATURED = new Set(["bitcoin", "ethereum"]);
const NETWORKS = [
  ...FEATURED,
  ...CRYPTO_CURRENCIES_IDS.filter(id => !FEATURED.has(id)).sort((a, b) => a.localeCompare(b)),
];

function MockAccounts({ accounts, onAdd, onRemove, addSource }: MockAccountsToolProps) {
  const [network, setNetwork] = useState("ethereum");
  const [count, setCount] = useState("1");
  const [operationCountInput, setOperationCountInput] = useState("");

  useEffect(() => {
    addSource(mockSource);
  }, [addSource]);

  const descriptors = useMemo(() => accounts.map(({ descriptor }) => descriptor), [accounts]);

  const generate = () => {
    const generated = mockDescriptors(network, parseBounded(count, 1, MAX_COUNT) ?? 1, descriptors);
    setOperationCount(
      generated.map(descriptor => computeAccountUUID(descriptor)),
      parseBounded(operationCountInput, 1, MAX_OPERATIONS),
    );
    onAdd(generated);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden select-text">
      <div className="px-16 py-8 border-b border-base flex items-center gap-12 flex-shrink-0 body-3">
        <select
          aria-label="Network"
          value={network}
          onChange={event => setNetwork(event.target.value)}
          className="font-mono"
        >
          {NETWORKS.map(id => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
        <input
          aria-label="Count"
          type="number"
          min={1}
          max={MAX_COUNT}
          value={count}
          onChange={event => setCount(event.target.value)}
          className="w-64 font-mono"
        />
        <input
          aria-label="Operations per account"
          type="number"
          min={1}
          max={MAX_OPERATIONS}
          placeholder="ops: random"
          value={operationCountInput}
          onChange={event => setOperationCountInput(event.target.value)}
          className="w-112 font-mono"
        />
        <button type="button" onClick={generate} className="body-3-semi-bold text-base">
          Generate
        </button>
        <span className="flex-1 text-muted">
          {accounts.length} mock {accounts.length === 1 ? "account" : "accounts"}
        </span>
        <button
          type="button"
          disabled={accounts.length === 0}
          onClick={() => onRemove(accounts.map(({ accountUUID }) => accountUUID))}
          className="body-3-semi-bold text-base"
        >
          Remove all
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {accounts.length === 0 ? (
          <div className="px-16 py-10 body-3 text-muted">No mock account.</div>
        ) : null}
        {accounts.map(({ accountUUID, descriptor }) => (
          <div
            key={accountUUID}
            className="px-16 py-8 border-b border-base flex items-center gap-12 body-3 font-mono"
          >
            <span className="w-1/3 break-all text-muted">{accountUUID}</span>
            <span className="flex-1 min-w-0 break-all text-base">
              {serializeAccountDescriptor(descriptor)}
            </span>
            <button
              type="button"
              onClick={() => onRemove([accountUUID])}
              className="body-3-semi-bold text-base"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MockAccounts;
