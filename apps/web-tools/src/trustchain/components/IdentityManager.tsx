import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { TrustchainSDKContext } from "@ledgerhq/ledger-key-ring-protocol/types";
import { TrustchainStore, getInitialStore } from "@ledgerhq/ledger-key-ring-protocol/store";

export function memberNameForPubKey(pubkey: string): string {
  return "debug-" + pubkey.slice(2, 8);
}

type Identities = { [_: string]: TrustchainStore };

const initialObject: Identities = {};

function IdentityColor({ pubkey }: { pubkey: string }) {
  const hash = pubkey.slice(2, 8);
  const r = parseInt(hash.slice(0, 2), 16);
  const g = parseInt(hash.slice(2, 4), 16);
  const b = parseInt(hash.slice(4, 6), 16);
  return (
    <span
      className="inline-block size-10 rounded-full border border-base"
      style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
    />
  );
}

export function DisplayName({
  pubkey,
  overridesName,
}: {
  pubkey?: string;
  overridesName?: string;
}) {
  if (!pubkey) return null;
  return (
    <span className="inline-flex items-center gap-4">
      <code className="body-3">{overridesName || memberNameForPubKey(pubkey)}</code>{" "}
      <IdentityColor pubkey={pubkey} />
    </span>
  );
}

export function IdentityManager({
  state,
  setState,
  defaultContext,
  setContext,
}: {
  state: TrustchainStore;
  setState: (s: TrustchainStore) => void;
  defaultContext: TrustchainSDKContext;
  setContext: (context: TrustchainSDKContext) => void;
}) {
  const [identities, setIdentities] = useState(initialObject);
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    const jsonIdentities = localStorage.getItem("identities");
    const identities = jsonIdentities ? JSON.parse(jsonIdentities) : {};
    setIdentities(identities);
    const url = new URL(window.location.href);
    const id = url.searchParams.get("id");
    if (id && identities[id]) {
      setState(identities[id]);
    }
  }, [setState]);

  useEffect(() => {
    const listener = (e: StorageEvent) => {
      if (e.key === "identities" && e.storageArea === localStorage) {
        setIdentities(JSON.parse(e.newValue || "{}"));
      }
    };
    window.addEventListener("storage", listener);
    return () => {
      window.removeEventListener("storage", listener);
    };
  }, []);

  const currentIdentityKey = state.memberCredentials?.pubkey;

  useEffect(() => {
    const url = new URL(window.location.href);
    if (currentIdentityKey) {
      url.searchParams.set("id", currentIdentityKey);
    } else {
      url.searchParams.delete("id");
    }
    window.history.replaceState(null, "", url.toString());
  }, [currentIdentityKey]);

  useEffect(() => {
    if (identities !== initialObject) {
      localStorage.setItem("identities", JSON.stringify(identities));
    }
  }, [identities]);

  useEffect(() => {
    if (currentIdentityKey) {
      setIdentities(ids => ({ ...ids, [currentIdentityKey]: state }));
    }
  }, [currentIdentityKey, state]);

  useEffect(() => {
    if (currentIdentityKey) {
      setContext({
        applicationId: defaultContext.applicationId,
        name: memberNameForPubKey(currentIdentityKey),
        apiBaseUrl: defaultContext.apiBaseUrl,
      });
    } else {
      setContext(defaultContext);
    }
  }, [currentIdentityKey, setContext, defaultContext]);

  const onSelectIdentity = useCallback(
    (pubkey?: string) => {
      setState((pubkey && identities[pubkey]) || getInitialStore());
    },
    [identities, setState],
  );

  const onRemoveIdentity = useCallback(
    (pubkey: string) => {
      setIdentities(ids => {
        const newIds = { ...ids };
        delete newIds[pubkey];
        if (pubkey === currentIdentityKey) {
          onSelectIdentity();
        }
        return newIds;
      });
    },
    [setIdentities, onSelectIdentity, currentIdentityKey],
  );

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(identities).map(([pubkey]) => (
        <label
          key={pubkey}
          className="flex items-center gap-8 px-8 py-6 rounded-md cursor-pointer hover:bg-muted-transparent-hover"
        >
          <input
            type="radio"
            name="identity"
            className="accent-interactive"
            checked={pubkey === currentIdentityKey}
            onChange={() => onSelectIdentity(pubkey)}
          />
          <span className="flex-1">
            <DisplayName pubkey={pubkey} />
          </span>
          <Button
            size="sm"
            appearance="transparent"
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              onRemoveIdentity(pubkey);
            }}
          >
            Remove
          </Button>
        </label>
      ))}
    </div>
  );
}
