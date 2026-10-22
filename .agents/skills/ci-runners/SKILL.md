---
name: ci-runners
description: Pick a self-hosted runner for a GitHub Actions job. Read before adding or changing any `runs-on` (or a runner label passed as an input or matrix value) in `.github/workflows/**`.
---

# CI Runners

## 🚫 Deprecated runners

Do not add new usages of these labels. When touching a job that already uses one, offer to migrate it.

- `ledger-live-medium`
- `ledger-live-4xlarge`
- `ledger-live-linux-8CPU-32RAM`
- `ledger-live-linux-16CPU-64RAM`
- `ledger-live-linux-e2e-8CPU-32RAM`
- `ledger-live-linux-e2e-speculos-32CPU-128RAM`

**Exception: Android emulator jobs.** The emulator needs `/dev/kvm`, which the runners below don't have (see Gotchas). Android E2E jobs in `test-mobile-e2e-reusable.yml` run on `ledger-wallet-8cpu-github-public-cached`, a GitHub larger runner on the `ledger-wallet-android-e2e` custom image (built in LedgerHQ/ledger-wallet-runners), which holds the toolchain and the E2E AVD. Use it only for jobs that run the emulator.

## ✅ Allowed runners

| Size   | Cached (default)                         | Uncached (release)                   |
| ------ | ---------------------------------------- | ------------------------------------ |
| 1 CPU  | `ledger-wallet-1cpu-aws-public-cached`   | `ledger-wallet-1cpu-aws-public`      |
| 2 CPU  | `ledger-wallet-2cpu-aws-public-cached`   | `ledger-wallet-2cpu-aws-public`      |
| 4 CPU  | `ledger-wallet-4cpu-aws-public-cached`   | `ledger-wallet-4cpu-aws-public`      |
| 8 CPU  | `ledger-wallet-8cpu-aws-public-cached`   | `ledger-wallet-8cpu-aws-public`      |
| 16 CPU | `ledger-wallet-16cpu-aws-public-cached`  | `ledger-wallet-16cpu-aws-public`     |

`ledger-wallet-4cpu-aws-public-docker` is the 4 CPU runner for jobs that need a Docker daemon.

Memory is 4 GiB per CPU (e.g. 4cpu = 16 GiB, 8cpu = 32 GiB).

## Cached vs uncached

- **Default to the `-cached` variant.**
- **Use the uncached variant for the release process**: `release-*.yml` workflows and jobs that run on `main`, `release` or `hotfix`. Release builds must start from a clean state.

## Picking a runner

Never pick silently. Ask the user to choose from the allowed list, with a recommendation:

1. Cached or uncached, from the rule above.
2. Size from the job's needs. When replacing a deprecated runner, start from the same CPU count (e.g. `ledger-live-linux-8CPU-32RAM` → 8 CPU). There is no 32 CPU option: propose 16 CPU and flag the job for benchmarking.
3. `-docker` only if the job runs containers.

## Gotchas

- Pods report the host CPU count (`nproc` = 32), not their quota. Never size workers as a percentage of cores (e.g. `JEST_MAX_WORKERS: "95%"`); set explicit counts per runner size.
- These runners have no `/dev/kvm`, so the Android emulator cannot run on them.
- Forks cannot use self-hosted runners. Keep the existing fork fallback pattern:
  `runs-on: ${{ github.event.pull_request.head.repo.fork && 'ubuntu-22.04' || 'ledger-wallet-4cpu-aws-public-cached' }}`
- Reusable workflows are called at `@develop`, so a PR cannot prove a runner change. Validate with `workflow_dispatch` from the branch.
