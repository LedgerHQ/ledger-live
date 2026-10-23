# @ledgerhq/coin-tester-ton

Boots a local TON chain in Docker and sends from a v4 wallet through the generic coin framework,
backed by coin-ton's API (`createApi`) and a software signer.

## Run

```sh
pnpm coin:tester:ton start
```

Set `DEBUG=1` to stream the docker compose output.

## What runs

`docker-compose.yml` starts:

- `genesis`: MyLocalTon, a single genesis validator with its lite-server.
- `ton-http-api`: toncenter's v2 API (ton-http-api-cpp) over that lite-server, on `127.0.0.1:18082`.
- toncenter's v3 API, which coin-ton reads, as MyLocalTon's `indexer-minimal` profile runs it:
  `index-worker` reads the node's database into `index-postgres` (after `index-migrate`), and
  `index-api` serves it on `127.0.0.1:18083`. It forwards `/message` and `/estimateFee` to the v2
  API.

The account is funded from MyLocalTon's masterchain faucet (a v3r2 wallet of id 42, created at
genesis), through the v2 API. The basechain faucet its README lists does not exist in v4.3.0. The
indexer trails the node by a few blocks, so the funding waits until the indexer lists the transfer.

Requests to any host other than localhost fail.

## Verified contract of the pinned images

Measured on 2026-10-22 and 2026-10-23. Re-measure on every image bump.

| Property | Value |
| --- | --- |
| MyLocalTon | `v4.3.0`, amd64 and arm64 |
| ton-http-api-cpp | `v2.1.17`. `v2.1.7`, the version MyLocalTon pins, fails every account and block read against this genesis ("Wrong constructor found") |
| ton-indexer worker and API | `v1.2.8`, the version MyLocalTon pins. The worker reads this genesis's database as is |
| arm64 builds | ton-http-api-cpp and both ton-indexer images die with SIGILL (exit 132) on Apple silicon, so they run as amd64 |
| Boot | the whole stack in about 11 s |
| Memory | about 530 MiB for the five long-running containers |
| Blocks | one masterchain block per second, a single basechain shard |
| Indexer lag | about 3 masterchain blocks; a funding was listed 0.04 to 1.1 s after the node's balance moved |
| External message inclusion | 3 to 24 s over 20 sends, clustered around 4, 10 and 22 s; a v4 transfer stays valid 60 s |
