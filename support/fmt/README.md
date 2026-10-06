# @support/fmt

> [!CAUTION]
> **Status: UNSTABLE** — New package; in active development.

The repository's only oxfmt config. The workspace-root `oxfmt.config.mts` re-exports it, and every
oxfmt run finds it by walking up from where it starts: the git hook, package scripts and the editor
extension. Packages carry no format config and pass no `-c`.

oxfmt anchors `ignorePatterns` to the directory of the config it found, the workspace root, so an
ignore that concerns one package names that package's path. Order matters: a `!` pattern re-includes
what an earlier one excluded, which is how the trees that format JSON keep doing so.
