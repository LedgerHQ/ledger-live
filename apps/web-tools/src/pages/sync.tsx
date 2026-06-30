import React, { useEffect, useState } from "react";
import { encodeAccountId, decodeAccountId } from "@ledgerhq/live-common/account/index";
import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { asDerivationMode } from "@ledgerhq/ledger-wallet-framework/derivation";
import type { Account } from "@ledgerhq/types-live";
import { Spinner, TextInput } from "@ledgerhq/lumen-ui-react";
import { ToolPage } from "../components/ToolPage";
import { syncAccount } from "../logic/syncAccount";

function App() {
  // synchronise account with an id that is input in a input text field
  const [accountId, setAccountId] = useState("");
  const [accountIdError, setAccountIdError] = useState("");

  const [account, setAccount] = useState<Account | undefined | null>(null);
  const [accountError, setAccountError] = useState("");

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
    // if we have an accountId, we try to synchronise it
    if (accountId) {
      try {
        decodeAccountId(accountId);
        setAccountError("");
        setAccount(undefined);
        syncAccount(accountId).then(setAccount, setAccountError);
      } catch (e) {
        setAccount(null);
        console.error(e);
      }
    }
  }, [accountId]);

  const isLoading = account === undefined && !accountError;

  return (
    <ToolPage
      title="Synchronisation"
      description="Synchronise an account from its id (or a currency:xpub/address shorthand)."
    >
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
