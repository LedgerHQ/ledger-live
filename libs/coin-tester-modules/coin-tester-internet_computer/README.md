# @ledgerhq/coin-tester-internet_computer

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Boots a local Internet Computer network with the NNS in Docker. It sends ICP, creates a neuron and
tops it up through coin-internet_computer's legacy bridge, which production runs. A software signer
plays the device.

## Run

```sh
pnpm coin:tester:internet_computer start
```

Set `DEBUG=1` to stream the docker compose output.

## What runs

`docker-compose.yml` starts `icp-cli-network-launcher --nns`: PocketIC behind an HTTP gateway on
`127.0.0.1:4943`, with the ICP ledger, its index and NNS governance at their mainnet canister ids.
The bridge takes the node URL from its config (`node.url`).

`src/scenarii.test.ts` runs the legacy bridge through the coin-tester runner: a send, a
`create_neuron`, a signed `list_neurons`, an `increase_stake`, and a second `list_neurons`.

The scenario funds its account with a ledger `transfer` from the anonymous principal, which holds
the initial supply. The index canister trails the ledger by a few seconds, so the funding waits for
the index, and the scenario waits for the index to read the ledger tip before each sync.

The account sync never reads neurons. The expectations read them from governance with a
`list_neurons` query signed by the account's own key.

The software signer signs as the Ledger ICP app does: secp256k1 over
sha256(`"\x0Aic-request"` ‖ request id), returned as the 64-byte r ‖ s.

An msw server (`forbidRemoteRequests` from `@ledgerhq/coin-tester/localOnly`) fails any request to
a host other than localhost.

## Verified contract of the pinned image

Measured on 2026-11-02. Re-measure on every image bump.

| Property | Value |
| --- | --- |
| Image | `ghcr.io/dfinity/icp-cli-network-launcher`, version label `16.1.0-2026-10-16-03-29`, amd64 and arm64 |
| Command | `--nns` only. The entrypoint already passes `--gateway-port 4943`; passing it again makes the container exit |
| Healthcheck | the image has no HTTP client. The entrypoint passes `--status-dir=/app/status`, and the launcher writes `status.json` there about 12 s after start, once the gateway listens. `compose up --wait` waits for it |
| NNS | ledger `ryjl3-tyaaa-aaaaa-aaaba-cai`, index `qhbym-qaaaa-aaaaa-aaafq-cai`, governance `rrkah-fqaaa-aaaaa-aaaaq-cai` |
| Initial supply | the anonymous principal's default account holds 1e17 e8s |
| Blocks | the ledger adds a block only for a transaction; it does not advance on its own |
| Index lag | a few seconds behind the ledger |
