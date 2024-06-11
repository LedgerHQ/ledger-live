import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { TrustchainSDKContext } from "@ledgerhq/trustchain/types";
import { TrustchainStore, getInitialStore } from "@ledgerhq/trustchain/store";

const IdentityDoc = styled.div`
  margin: 10px;
  color: #666;
  font-style: italic;
`;

const IdentityLabel = styled.label`
  display: block;
  margin: 5px;
`;

export function memberNameForPubKey(pubkey: string): string {
  return "debug-" + pubkey.slice(0, 6);
}

type Identities = { [_: string]: TrustchainStore };

const initialObject: Identities = {};

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
  // any new state.liveCredentials?.pubkey will be considered a new identity to save
  // this is the way we identify what is the current member in this list
  // we save/update it by this key on the localStorage
  const [identities, setIdentities] = useState(initialObject);
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    const jsonIdentities = localStorage.getItem("identities");
    const identities = jsonIdentities ? JSON.parse(jsonIdentities) : {};
    setIdentities(identities);
    // check from the url if we find an id
    const url = new URL(window.location.href);
    const id = url.searchParams.get("id");
    if (id && identities[id]) {
      setState(identities[id]);
    }
  }, [setState]);

  // listen to "storage" event that could notify us another tab has changed the localStorage, merge the identities together
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

  const currentIdentityKey = state.liveCredentials?.pubkey;

  // sync the current key to the uri query param with id=
  useEffect(() => {
    const url = new URL(window.location.href);
    if (currentIdentityKey) {
      url.searchParams.set("id", currentIdentityKey);
    } else {
      url.searchParams.delete("id");
    }
    window.history.replaceState(null, "", url.toString());
  }, [currentIdentityKey]);

  // save state to localStorage when it changes, except on initial load
  useEffect(() => {
    if (identities !== initialObject) {
      localStorage.setItem("identities", JSON.stringify(identities));
    }
  }, [identities]);

  // update identifies when the state change
  useEffect(() => {
    if (currentIdentityKey) {
      setIdentities(ids => ({ ...ids, [currentIdentityKey]: state }));
    }
  }, [currentIdentityKey, state]);

  // always make the context reflects the selected identity
  useEffect(() => {
    if (currentIdentityKey) {
      setContext({
        applicationId: defaultContext.applicationId,
        name: memberNameForPubKey(currentIdentityKey),
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
    <div>
      <IdentityDoc>
        This simulates different Live instance. localStorage is used to save to state on your
        browser to be able to easily restore and switch member identities.
      </IdentityDoc>

      <div>
        {Object.entries(identities).map(([pubkey, state]) => (
          <IdentityLabel key={pubkey}>
            <input
              type="radio"
              name="identity"
              checked={pubkey === currentIdentityKey}
              onChange={() => onSelectIdentity(pubkey)}
            />{" "}
            <strong>{memberNameForPubKey(pubkey)}</strong>{" "}
            <button onClick={() => onRemoveIdentity(pubkey)}>Remove</button>
          </IdentityLabel>
        ))}
        <IdentityLabel>
          <input
            type="radio"
            name="identity"
            checked={!currentIdentityKey}
            onChange={() => onSelectIdentity()}
          />{" "}
          New Identity
        </IdentityLabel>
      </div>
    </div>
  );
}
