# Network hosts

wallet-cli calls the hosts below over HTTPS. In a sandbox that allows only listed hosts, allow the required hosts of the commands you run. A command run outside the sandbox (SKILL.md, Host sandbox) is not limited by its allowlist.

| Host | Commands | Required |
|---|---|---|
| `explorers.api.live.ledger.com` | `account discover`, `balances`, `operations`, `receive`, `send` and `swap execute` on Ethereum and Bitcoin accounts; `earn` on Ethereum accounts | yes |
| `solana.coin.ledger.com` | the same commands on Solana accounts | yes |
| `global.api.prd.ledger.com` | token lists (`/cal`): `account discover`, `balances`, `operations`, `send`, `assets`, `swap`, `earn positions`, `agent-intent send` and `swap`. Agent Intent (`/agent-intent`, `/keycloak`): every `agent-intent` command that has Network = yes in SKILL.md, except `sync` | yes |
| `swap.ledger.com` | `swap`, `agent-intent swap` | yes |
| `earn.api.live.ledger.com` | `earn` | yes for `earn`; optional for `balances` and `operations` on Solana accounts |
| `trustchain.api.live.ledger.com` (HTTPS and WebSocket) | `ring init`, `encrypt`, `decrypt`, `destroy`; `agent-intent` enroll, recover, `sync` and the authenticated commands | yes; optional for `swap quote` and `execute` (API auth key) |
| `cloud-sync.api.live.ledger.com` | `agent-intent sync` | yes |
| `manager.api.live.ledger.com`, `scriptrunner.api.live.ledger.com` (WebSocket) | `genuine-check`; other device commands when the device must open or install an app | yes |
| `api.segment.io` | every command (analytics) | no: a block costs at most 2.5 s |

`session`, `skill`, `ring keys` and `agent-intent list`, `show` and `wait` call no host but `api.segment.io`. The Agent Intent review links open on `app.agents.ledger.com` in the human's browser; wallet-cli itself never calls it. Resolving an ENS name (SKILL.md) calls the human's Ethereum RPC (`ETH_RPC_URL`), not a wallet-cli host.

Staging and test networks call other hosts: `agent-intent --environment staging` uses `global.api.stg.ledger-test.com`, `trustchain-backend.api.aws.stg.ldg-tech.com` and `cloud-sync-backend.api.aws.stg.ldg-tech.com`; Solana devnet and testnet use `api.devnet.solana.com` and `api.testnet.solana.com`. `SWAP_API_BASE` and `EARN_API_BASE_URL` replace `swap.ledger.com` and `earn.api.live.ledger.com`; the Solana validator lists of `earn` stay on `earn.api.live.ledger.com` unless `SOLANA_VALIDATORS_URL` and `SOLANA_VALIDATOR_APY_URL` replace them.

## A blocked host

A request that does not get through names its host: a sentence on stderr, or `error.host` and `error.hint` with `--output json`. Read the hint and do what it says: when it asks to allow a host, tell the human which one and re-run once they have, except after an approval on the device, where [errors.md](errors.md) comes first. When the human says the host is already allowed, handle the error as usual ([errors.md](errors.md)). For HTTP 407, the proxy asks for credentials: tell the human to put them in the proxy URL (`HTTPS_PROXY=http://user:password@proxy:port`) or to let the host through without them, and do not retry until they have. When the hint says the TLS certificate of a host is not trusted, something on the way, such as a proxy that inspects TLS, presented a certificate wallet-cli does not trust: no allowlist change fixes that, so tell the human and do not ask to allow the host.
