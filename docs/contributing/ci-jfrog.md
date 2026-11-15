---
name: ci-jfrog
description: Read when adding or editing a GitHub workflow job that installs npm packages or runs Gradle, or when adding a Maven repository to an Android build. Covers the jfrog-npm-auth and jfrog-maven-auth actions and which runners may be used.
---

# CI package consumption: JFrog

Every CI job that resolves packages (`pnpm i`, `npx`, `pnpm dlx`, Gradle) must pull them from our
JFrog Artifactory, not public npm or Maven. See epic [LIVE-35942](https://ledgerhq.atlassian.net/browse/LIVE-35942).

JFrog sits behind an IP allow list. Only our network-controlled runners can reach it, so
**the runner and the JFrog login are one change**: a job moved to a network-controlled runner without
the login (or the login on a GitHub-hosted runner) does not work.

## The action

[`jfrog-npm-auth`](../../tools/actions/composites/jfrog-npm-auth/action.yml) does an OIDC login to
JFrog and writes `~/.npmrc` pointing npm and pnpm at the Artifactory registry.

```yaml
permissions:
  id-token: write   # required for the OIDC login
  contents: read

steps:
  - uses: actions/checkout@...
  - uses: LedgerHQ/ledger-live/tools/actions/composites/setup-caches@develop
    with:
      use-mise: true
      # ...cache inputs
  - name: JFrog npm auth
    uses: LedgerHQ/ledger-live/tools/actions/composites/jfrog-npm-auth@develop
    with:
      registry: ${{ vars.ARTIFACTORY_URL }}
  - run: pnpm i --frozen-lockfile
```

Rules:
- Run it **after** `setup-caches` (which installs pnpm via mise) and **before** the first install or `npx`.
- The calling job (and any reusable workflow) needs `id-token: write`.
- Always pass `vars.ARTIFACTORY_URL`. If `registry` is empty the action skips both steps without
  failing, and the job installs from whatever the runner can reach.
- Do not add a public-npm fallback. A job that cannot reach JFrog should fail.

Reference: [`test-boundaries-reusable.yml`](../../.github/workflows/test-boundaries-reusable.yml).

## Gradle (Android)

[`jfrog-maven-auth`](../../tools/actions/composites/jfrog-maven-auth/action.yml) installs a Gradle
init script that rewrites each public Maven repository, in every Gradle build, to its
`ossproxy-maven-proxy-*` remote. Add it after `jfrog-npm-auth`, before Gradle runs:

```yaml
  - name: JFrog Maven auth
    uses: LedgerHQ/ledger-live/tools/actions/composites/jfrog-maven-auth@develop
    with:
      url: ${{ vars.ARTIFACTORY_MAVEN_URL }}
```

**Adding a Maven repository** (in `android/build.gradle`, or with a new React Native dependency
that declares one) needs JFrog set up first. Otherwise CI downloads from the public host, and the
build log shows `jfrog-maven: <url> is not mirrored`.

1. Check whether an existing remote already serves the artifacts. JitPack-style repositories often
   duplicate Maven Central.
2. Add an `ossproxy-maven-proxy-*` remote in tf-jfrog, in `jfrog-green/oss-proxy/repositories.yaml`.
   After it is applied, re-apply `jfrog-green/global-github-oidc` so the CI token can read it.
3. Map the host to the remote in `remoteByHost` in
   [`jfrog-maven.gradle`](../../tools/actions/composites/jfrog-maven-auth/jfrog-maven.gradle).

Map hosts to single remotes, not to the Maven virtuals. The virtuals contain repositories the CI token
cannot read, so a missing file returns 403 instead of 404, and Gradle stops instead of falling back
to the POM.

## Which runner

| Job | Runner | Why |
| --- | --- | --- |
| Resolves packages, internal PR/push/schedule/release | `ledger-wallet-{2,4,8}cpu-aws-public` | Network-controlled, allow-listed for JFrog. Pick the smallest size that fits. |
| Same, and needs a Docker daemon | `ledger-wallet-4cpu-aws-public-docker` | As above, with Docker (release and `wallet-cli` jobs). |
| Large builds and E2E | `ledger-live-*` self-hosted pools | Existing self-hosted pools with JFrog access. Keep until they are moved to the `ledger-wallet-*` runners. |
| macOS builds and tests | self-hosted macOS | Same reason; GitHub-hosted macOS is not allow-listed. |
| Resolves nothing (labeling, notifications, `github-script` only) | `ubuntu-*` GitHub-hosted | Moving it costs money and buys no compliance. |
| Fork PRs | `ubuntu-*` GitHub-hosted, public npm | See below. |

**Never put fork code on our runners.** Fork PRs run contributor-controlled code, and our runners
hold the JFrog OIDC token and AWS cache credentials. The fork pipeline (`*-external-reusable.yml`,
`build-and-test-external.yml`) stays on GitHub-hosted runners and public npm by decision
([LIVE-37569](https://ledgerhq.atlassian.net/browse/LIVE-37569)). It publishes and ships nothing.
Jobs shared by both paths pick the runner with `github.event.pull_request.head.repo.fork` and
gate the JFrog step on `!fork`; see `test-integration.yml`.

Do not copy an internal job's runner and JFrog step onto its `*-external` twin.

## Checklist for a new job

- [ ] Does it resolve packages? If not, leave it on `ubuntu-*`.
- [ ] Can it receive fork code? If so, keep it off our runners.
- [ ] Runner is a `ledger-wallet-*` label (or an approved self-hosted pool).
- [ ] `id-token: write` set; `jfrog-npm-auth` before the first install.
- [ ] Runs Gradle? `jfrog-maven-auth` before the first Gradle command.
