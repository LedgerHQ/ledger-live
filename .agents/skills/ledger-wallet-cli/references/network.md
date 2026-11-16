# Network hosts

wallet-cli calls the hosts below over HTTPS. In a sandbox that allows only listed hosts, allow the required hosts of the commands you run. A command run outside the sandbox (SKILL.md, Host sandbox) is not limited by its allowlist.

| Host | Commands | Required |
|---|---|---|
| `explorers.api.live.ledger.com` | `account discover`, `balances`, `operations`, `receive`, `send`, `swap execute`, `earn` on Ethereum and Bitcoin accounts | yes |
| `solana.coin.ledger.com` | the same commands on Solana accounts | yes |
| `global.api.prd.ledger.com` | token lists (`/cal`): `balances`, `operations`, `send`, `assets`, `swap`, `earn positions`, `agent-intent send` and `swap`. Agent Intent (`/agent-intent`, `/keycloak`): every `agent-intent` command that has Network = yes in SKILL.md, except `sync` | yes |
| `swap.ledger.com` | `swap`, `agent-intent swap` | yes |
| `earn.api.live.ledger.com` | `earn` | yes for `earn`; optional for `balances` and `operations` on Solana accounts |
| `trustchain.api.live.ledger.com` (HTTPS and WebSocket) | `ring init`, `encrypt`, `decrypt`, `destroy`; `agent-intent` enroll, recover and the authenticated commands | yes; optional for `swap quote` and `execute` (API auth key) |
| `cloud-sync.api.live.ledger.com` | `agent-intent sync` | yes |
| `manager.api.live.ledger.com`, `scriptrunner.api.live.ledger.com` (WebSocket) | `genuine-check`; other device commands when the device must open or install an app | yes |
| `api.segment.io` | every command (analytics) | no: a block costs at most 2.5 s |

`session`, `skill`, `ring keys` and `agent-intent list`, `show` and `wait` call no host but `api.segment.io`. The Agent Intent review links open on `app.agents.ledger.com` in the human's browser; wallet-cli itself never calls it.

Staging and test networks call other hosts: `agent-intent --environment staging` uses `global.api.stg.ledger-test.com`, `trustchain-backend.api.aws.stg.ldg-tech.com` and `cloud-sync-backend.api.aws.stg.ldg-tech.com`; Solana devnet and testnet use `api.devnet.solana.com` and `api.testnet.solana.com`. `SWAP_API_BASE` and `EARN_API_BASE_URL` replace `swap.ledger.com` and `earn.api.live.ledger.com`.

## A blocked host

A request that does not get through names its host:

- human output, on stderr: `Could not reach <host>. If wallet-cli runs in a sandbox, allow <host> in its network allowlist.`
- `--output json`: `error.host` and `error.hint`, next to the usual `message`.

Two failures name no host yet: `agent-intent` errors name the Agent Intent service, not its host, and `swap quote` says `No quotes available: noQuotes` when `swap.ledger.com` is blocked. In a sandbox, check the hosts of that command in the table above.

Tell the human which host to allow and in which sandbox setting, and re-run once they have; a blocked host fails the same way every time. The exception is a failure after the human approved on the device: follow [errors.md](errors.md) before any re-run. A blocked `global.api.prd.ledger.com` can keep `balances` busy for about 30 s before it fails, as each token lookup is retried.

A 403 can come from the host itself, too: when the human says the host is already allowed, handle it as the command's own error. `Request to <host> failed with HTTP <status>.` means the host answered: the sandbox let it through. Handle it as the command's own error ([errors.md](errors.md)).
