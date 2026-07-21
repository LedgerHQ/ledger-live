import React, { useCallback, useEffect, useState } from "react";
import { encodeAccountId, decodeAccountId } from "@ledgerhq/live-common/account/index";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { asDerivationMode } from "@ledgerhq/ledger-wallet-framework/derivation";
import type { Account } from "@ledgerhq/types-live";
import { Button, Spinner, TextInput } from "@ledgerhq/lumen-ui-react";
import { setEnv, getEnv, getEnvDefault } from "@ledgerhq/live-env";
import type { EnvName } from "@ledgerhq/live-env";
import { ToolPage } from "../components/ToolPage";
import { syncAccount } from "../logic/syncAccount";

// Coin endpoint env vars that can be switched between PRD (ledger.com) and STG (ledger-test.com).
// Note: Cosmos-family chains (cosmos, osmosis, axelar, coreum, dydx, injective, …) use
// live-config with hardcoded LCD URLs — they are NOT covered by this switcher.
const COIN_ENDPOINT_VARS = [
  "EXPLORER",
  "LEDGER_REST_API_BASE",
  "API_ALGORAND_BLOCKCHAIN_EXPLORER_API_ENDPOINT",
  "API_CELO_INDEXER",
  "API_CELO_NODE",
  "API_FILECOIN_ENDPOINT",
  "API_HEDERA_HGRAPH",
  "API_HEDERA_MIRROR",
  "API_KASPA_ENDPOINT",
  "API_POLKADOT_INDEXER",
  "API_POLKADOT_NODE",
  "API_POLKADOT_SIDECAR",
  "API_SOLANA_PROXY",
  "API_STACKS_ENDPOINT",
  "API_STELLAR_HORIZON",
  "API_SUI_GRAPHQL_PROXY",
  "API_SUI_NODE_PROXY",
  "API_TEZOS_BAKER",
  "API_TEZOS_BLOCKCHAIN_EXPLORER_API_ENDPOINT",
  "API_TEZOS_NODE",
  "API_TEZOS_TZKT_API",
  "API_TRONGRID_PROXY",
  "API_VECHAIN_THOREST",
  "APTOS_API_ENDPOINT",
  "APTOS_INDEXER_ENDPOINT",
  "CARDANO_API_ENDPOINT",
  "CARDANO_EPOCH_PARAMS_ENDPOINT",
  "CRYPTO_ORG_INDEXER",
  "CRYPTO_ORG_RPC_URL",
  "MULTIVERSX_API_ENDPOINT",
  "MULTIVERSX_DELEGATION_API_ENDPOINT",
] as const satisfies EnvName[];

type CoinEnv = "prd" | "stg";

// setEnv typed narrowly: all entries in COIN_ENDPOINT_VARS are string-valued env vars,
// so the string→string transform is safe. The cast is necessary because TypeScript cannot
// distribute EnvValue<K> over a union K when iterating.
function setCoinEnvVar(name: (typeof COIN_ENDPOINT_VARS)[number], value: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setEnv(name, value as any);
}

function detectCoinEnv(): CoinEnv {
  return (getEnv("EXPLORER") as string).includes("ledger-test.com") ? "stg" : "prd";
}

function SyncEnvSwitcher({ onEnvChange }: { onEnvChange: () => void }) {
  const [coinEnv, setCoinEnv] = useState<CoinEnv>(detectCoinEnv);

  const applyPrd = useCallback(() => {
    for (const name of COIN_ENDPOINT_VARS) {
      setCoinEnvVar(name, getEnvDefault(name) as string);
    }
    setCoinEnv("prd");
    onEnvChange();
  }, [onEnvChange]);

  const applyStg = useCallback(() => {
    for (const name of COIN_ENDPOINT_VARS) {
      setCoinEnvVar(
        name,
        (getEnvDefault(name) as string).replace(/ledger\.com/g, "ledger-test.com"),
      );
    }
    setCoinEnv("stg");
    onEnvChange();
  }, [onEnvChange]);

  return (
    <div className="flex items-center gap-8 text-sm text-muted">
      <span className="body-3">Coin endpoints:</span>
      <Button
        type="button"
        size="sm"
        appearance={coinEnv === "prd" ? "base" : "transparent"}
        onClick={applyPrd}
      >
        PRD
      </Button>
      <Button
        type="button"
        size="sm"
        appearance={coinEnv === "stg" ? "accent" : "transparent"}
        onClick={applyStg}
      >
        STG
      </Button>
      {coinEnv === "stg" && (
        <span className="body-3 text-warning">
          ⚠ Cosmos-family chains (cosmos, osmosis, axelar…) use hardcoded URLs — not switched.
        </span>
      )}
    </div>
  );
}

function App() {
  // synchronise account with an id that is input in a input text field
  const [accountId, setAccountId] = useState("");
  const [accountIdError, setAccountIdError] = useState("");

  const [account, setAccount] = useState<Account | undefined | null>(null);
  const [accountError, setAccountError] = useState("");

  // bumped each time the env switcher changes, to re-trigger sync
  const [syncRevision, setSyncRevision] = useState(0);

  useEffect(() => {
    // if we have an accountId, we try to infer it
    if (accountId) {
      try {
        setAccountId(inferAccountId(accountId));
        setAccountIdError("");
      } catch (e: unknown) {
        setAccountIdError(String((e as { message?: unknown })?.message));
      }
    }
  }, [accountId]);

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;
    try {
      decodeAccountId(accountId);
      setAccountError("");
      setAccount(undefined);
      syncAccount(accountId).then(
        acc => {
          if (!cancelled) setAccount(acc);
        },
        err => {
          if (!cancelled) setAccountError(err);
        },
      );
    } catch (e) {
      setAccount(null);
      console.error(e);
    }
    return () => {
      cancelled = true;
    };
  }, [accountId, syncRevision]);

  const isLoading = account === undefined && !accountError;

  return (
    <ToolPage
      title="Synchronisation"
      description="Synchronise an account from its id (or a currency:xpub/address shorthand)."
    >
      <SyncEnvSwitcher onEnvChange={() => setSyncRevision(r => r + 1)} />

      <TextInput
        label="Account id"
        placeholder="ethereum:0x… or js:2:ethereum:0x…:"
        value={accountId}
        onChange={e => setAccountId(e.target.value)}
        status={accountIdError ? "error" : undefined}
        helperText={accountIdError || undefined}
      />

      <div className="flex flex-col gap-8">
        {accountError ? (
          <p className="body-2 text-error">{String(accountError)}</p>
        ) : isLoading ? (
          <span className="inline-flex items-center gap-8 body-2 text-muted">
            <Spinner size={16} /> Synchronising…
          </span>
        ) : null}
        {account ? (
          <pre className="max-h-[60vh] overflow-auto rounded-lg border border-base bg-muted p-16 body-3 text-base">
            <code>{JSON.stringify(account, null, 2)}</code>
          </pre>
        ) : !accountError && !isLoading ? (
          <p className="body-2 text-muted">Enter an account id to synchronise.</p>
        ) : null}
      </div>
    </ToolPage>
  );
}

function inferAccountId(id: string) {
  try {
    // preserve if decodeAccountId don't fail
    decodeAccountId(id);
    return id;
  } catch (_error) {
    const splitted = id.split(":");

    const findAndEat = (predicate: (str: string) => unknown) => {
      const res = splitted.find(predicate);

      if (typeof res === "string") {
        splitted.splice(splitted.indexOf(res), 1);
        return res;
      }
    };

    const currencyId = findAndEat(s => findCryptoCurrencyById(s));
    if (!currencyId) {
      throw new Error("invalid id='" + id + "': missing currency part");
    }
    const type = "js";
    const version = findAndEat(s => s.match(/^\d+$/)) || "1";
    const derivationMode = asDerivationMode(
      findAndEat(s => {
        try {
          return asDerivationMode(s);
        } catch (_error) {
          // this is therefore not a derivation mode
        }
      }) ?? "",
    );

    if (splitted.length === 0) {
      throw new Error("invalid id='" + id + "': missing xpub or address part");
    }

    if (splitted.length > 1) {
      throw new Error(
        "invalid id='" +
          id +
          "': couldn't understand which of these are the xpub or address part: " +
          splitted.join(" | "),
      );
    }

    const xpubOrAddress = splitted[0];
    return encodeAccountId({
      type,
      version,
      currencyId,
      xpubOrAddress,
      derivationMode,
    });
  }
}

export default App;
