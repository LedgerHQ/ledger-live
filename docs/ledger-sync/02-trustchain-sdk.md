# 2 · TrustchainSDK

> Layer 2 of the [Ledger Sync stack](./README.md). Code:
> [`libs/ledger-key-ring-protocol/src`](../../libs/ledger-key-ring-protocol/src) ·
> interface: [`src/types.ts`](../../libs/ledger-key-ring-protocol/src/types.ts) (formerly `trustchain`).

**TrustchainSDK** is the main entry point of the LKRP library. It provides everything needed
to **create, modify and destroy** the Trustchain for a given Ledger Wallet instance. That
instance becomes a **member** of the Trustchain, authenticating with a **MemberCredentials**
(a public/private key pair).

> [!NOTE]
> See also the protocol specs:
> [Trustchain specifications](https://ledgerhq.atlassian.net/wiki/spaces/TA/pages/4105207815) ·
> [backend doc](https://ledgerhq.atlassian.net/wiki/spaces/BE/pages/4207083651).

## The core objects (the "trustchain store")

Each instance keeps two objects locally:

```ts
// trustchain store (persisted per Ledger Wallet instance)
{
  trustchain: Trustchain | null,
  memberCredentials: MemberCredentials | null,
}

type MemberCredentials = {
  pubkey: string,      // this member's id
  privatekey: string,  // kept local only
}

type Trustchain = {
  rootId: string,                  // immutable id of the trustchain
  walletSyncEncryptionKey: string, // secret shared between members, encrypts Cloud Sync data
  applicationPath: string,         // m/0'/16'/0' — the branch we read the key from
}
```

- `walletSyncEncryptionKey` is derived at the `applicationPath` location of the
  [derivation tree](./01-hardware-lkrp.md#the-derivation-tree--the-application-path).
- `applicationPath` **rotates** (the last index increments) when the key must change — e.g.
  when a member is removed. See [key rotation](#key-rotation-on-member-removal).

## Public API

Exported from `getSdk()` ([`src/index.ts`](../../libs/ledger-key-ring-protocol/src/index.ts)),
implementing the `TrustchainSDK` interface ([`src/types.ts`](../../libs/ledger-key-ring-protocol/src/types.ts)).

| Method | Device? | What it does |
|---|---|---|
| `initMemberCredentials()` | — | Generate this instance's keypair (once, then persisted). |
| `withAuth(trustchain, creds, fn, policy?)` | — | Run `fn(jwt)` with a valid JWT; handles cache / refresh / re-auth. |
| `getOrCreateTrustchain(deviceId, creds, …)` | ✅ | Create the root + application branch, or join an existing one. Returns `{ type: "created" \| "updated" \| "restored", trustchain }`. |
| `restoreTrustchain(trustchain, creds)` | — | Re-derive the encryption key after a rotation. |
| `getMembers(trustchain, creds)` | — | List current members. Throws `TrustchainEjected` if we are no longer one. |
| `addMember(trustchain, creds, member)` | — | Add a member (no hardware — uses a `SoftwareDevice`). |
| `removeMember(deviceId, trustchain, creds, member, …)` | ✅ | Remove a member → **triggers key rotation**. Returns the new `Trustchain`. |
| `destroyTrustchain(trustchain, creds)` | — | Delete the whole trustchain (all applications). |
| `destroyApplication(trustchain, creds)` *(upcoming — [PR #18568](https://github.com/LedgerHQ/ledger-live/pull/18568))* | — | Close **only this application's** stream; destroy the whole trustchain only if it was the last open application. Returns `{ trustchainDestroyed }`. See [deactivation](#deactivating-ledger-sync-per-application-close). |
| `encryptUserData(trustchain, bytes)` / `decryptUserData(trustchain, bytes)` | — | Symmetric encrypt/decrypt with `walletSyncEncryptionKey`. Used by [CloudSyncSDK](./04-cloud-sync-sdk.md). |
| `invalidateJwt()` | — | Drop the cached JWT, forcing re-auth on the next call. |

## Authenticating with the device (JWT)

Every Trustchain API call is authorized by a **JWT** obtained by signing a server challenge
with the hardware wallet. `withAuth` wraps this and caches the token.

```mermaid
sequenceDiagram
    autonumber
    participant SDK as TrustchainSDK
    participant API as Trustchain API
    participant Dev as Ledger Sync app (device)

    SDK->>API: GET /v1/challenge
    API-->>SDK: { json, tlv }
    SDK->>SDK: parse challenge TLV, hash it
    SDK->>Dev: getSeedId(challenge)  — APDU INS_GET_PUBLIC_KEY
    Dev-->>SDK: { signature, pubkeyCredential, attestationResult }
    SDK->>API: POST /v1/authenticate { challenge, signature, credential, attestation }
    API-->>SDK: JWT { accessToken, permissions[rootId][path] }
    Note over SDK: cached. fn(jwt) runs the actual operation.
```

`withAuth(…, policy)` accepts a cache policy:

- `"cache"` — reuse the cached JWT while valid (default).
- `"refresh"` — `GET /v1/refresh` with the current token (used by the notifications stream).
- `"no-cache"` — always run the full challenge flow.

If the JWT lacks permission for `trustchain.applicationPath`, the SDK throws — see
[error recovery](#errors--automatic-recovery).

## Operations and their effect on the local store

Every SDK flow ultimately **updates or empties** the local trustchain store. This is the map
of integrations:

```mermaid
flowchart LR
    subgraph init["Trustchain initialisation"]
        i0(["START"]) --> i1[initMemberCredentials]
        i1 --> i2["getOrCreateTrustchain<br/><i>🔒 Hardware Wallet required</i>"]
        i2 --> i3{{"store updated<br/>(Trustchain + MemberCredentials)"}}
    end

    subgraph rm["Remove a member"]
        r0(["START"]) --> r1[getMembers]
        r1 --> r2["removeMember<br/><i>🔒 device required</i>"]
        r2 --> r3{{"store updated<br/>(Trustchain* — key rotation)"}}
    end

    subgraph qr["Add member by QR code"]
        q0(["START"]) --> q1["QR Code protocol"]
        q1 --> q2[addMember]
        q2 --> q3{{store updated}}
    end

    subgraph out["Opt out"]
        o0(["START"]) --> o1[destroyTrustchain]
        o1 --> o2{{"store emptied<br/>(REMOVE Trustchain)"}}
    end

    subgraph err["Automatic error recovery"]
        e1([TrustchainOutdated]) --> er1[restoreTrustchain] --> er2{{store updated}}
        e2([TrustchainEjected]) --> ee2{{"store emptied<br/>(REMOVE Trustchain)"}}
        e3([TrustchainNotAllowed]) --> ee3[/"show error to user<br/>(wrong device seed?)"/]
    end
```

`encryptUserData` / `decryptUserData` are not part of any single flow — they are called by the
[wallet-sync watch loop](./06-watch-loop.md) through the [CloudSyncSDK](./04-cloud-sync-sdk.md)
to protect the data at rest.

## Key rotation (on member removal)

Removing a member must invalidate the old encryption key so the removed member can no longer
read future data. `removeMember` therefore opens a **new branch** of the derivation tree and
re-adds everyone except the removed member:

```mermaid
sequenceDiagram
    autonumber
    participant SDK as TrustchainSDK
    participant Dev as device
    participant API as Trustchain API
    participant App as integration (lifecycle hook)

    SDK->>App: onTrustchainRotation(old)  → returns cleanup(new)
    Note right of App: save JWT / tear down resources tied to the old key
    SDK->>Dev: close current stream (sign CloseStream)
    SDK->>SDK: newPath = getApplicationRootPath(appId, +1)  // m/0'/16'/1'
    SDK->>Dev: addMember(self) on newPath (hardware signature)
    SDK->>SDK: addMember(remaining members) on newPath (SoftwareDevice)
    SDK->>SDK: extract new walletSyncEncryptionKey from newPath
    SDK->>API: POST the CloseStream block (only after the new branch is ready)
    SDK->>API: refresh JWT (new path permissions)
    SDK->>App: cleanup(newTrustchain)
    Note right of App: re-encrypt / migrate resources to the new key
```

`restoreTrustchain` performs the read-only half of this: given a (possibly rotated) trustchain
it re-fetches the tree and re-derives `walletSyncEncryptionKey` at the current path.

## Deactivating Ledger Sync (per-application close)

> [!IMPORTANT]
> **Upcoming — [PR #18568](https://github.com/LedgerHQ/ledger-live/pull/18568).** A single
> Trustchain root is shared by several applications, each on its own
> [`m/0'/{applicationId}'/…` branch](./01-hardware-lkrp.md#the-derivation-tree--the-application-path)
> (Ledger Sync = `16`, wallet-cli ring = `17`).

Today both Ledger Sync and the wallet-cli ring deactivate via `destroyTrustchain` →
`DELETE /trustchain/{rootId}`, which destroys the **whole root**. So "Delete Sync" would also
wipe the ring, and `ring destroy` would wipe Ledger Sync.

PR #18568 introduces a `destroyApplication(trustchain, creds) → { trustchainDestroyed }`
primitive that **closes only the current application's stream** — signed with the member's
*software* key (no hardware device, matching today's UX) — and destroys the whole trustchain
only when it was the **last open application**.

```mermaid
flowchart TB
    d(["deactivate Ledger Sync"]) --> q{another application<br/>still open?}
    q -->|yes| close["close this app's stream (CloseStream)<br/>→ trustchainDestroyed: false<br/><i>root + other apps survive</i>"]
    q -->|no| destroy["destroyTrustchain (DELETE /trustchain)<br/>→ trustchainDestroyed: true"]
```

The enabler is making a closed stream **observable client-side**: the resolver now exposes
`ResolvedCommandStream.isClosed()` (it previously ignored `CloseStream`), and
`StreamTree.getApplicationStreams()` / `hasAnotherOpenApplication()` enumerate the application
streams. Consequently `restoreTrustchain` and `getMembers` reject a closed stream with
`TrustchainEjected`, and `getOrCreateTrustchain` reopens on the next index after a close.

Because ejection is already handled by the [watch-loop recovery](#errors--automatic-recovery)
(`onTrustchainRefreshNeeded` → `resetTrustchainStore`), the **UI needs no change**; the
integrations' `useDestroyTrustchain` hooks simply call `destroyApplication` instead of
`destroyTrustchain`.

## Errors & automatic recovery

The SDK surfaces a small set of typed errors; the [watch loop](./06-watch-loop.md) reacts to
them automatically so the user rarely sees anything:

| Error | Meaning | Recovery |
|---|---|---|
| `TrustchainOutdated` | Our `applicationPath` is behind (a rotation happened). | `restoreTrustchain` → store updated, keep syncing. |
| `TrustchainEjected` | We are no longer a member (removed by someone else). | Empty the store (opt-out state). |
| `TrustchainNotAllowed` | JWT carries no permission for this trustchain. | Show error to the user — see [errors](./errors.md#trustchainnotallowed). |

## Trustchain API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/v1/challenge` | Get an authentication challenge. |
| `POST` | `/v1/authenticate` | Exchange the signed challenge for a JWT. |
| `GET` | `/v1/refresh` | Refresh an expiring JWT. |
| `GET` | `/v1/trustchains` | List the member's trustchains. |
| `GET` | `/v1/trustchain/{id}` | Fetch the stream tree. |
| `POST` | `/v1/seed` | Create the root trustchain. |
| `POST` | `/v1/trustchain/{id}/derivation` | Add a derivation branch. |
| `PUT` | `/v1/trustchain/{id}/commands` | Append commands to a branch. |
| `DELETE` | `/v1/trustchain/{id}` | Destroy the trustchain. |
| `GET` (WS) | `/v1/qr` | WebSocket channel for [QR-code sync](./03-qr-code-protocol.md). |
