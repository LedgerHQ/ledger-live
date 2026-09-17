---
"@support/lint-rules": minor
---

feat(lint-rules): enforce no-platform-suffix across features and shared

Hardens `suffix-imports/no-platform-suffix` and wires it into every `features/**` and `shared/**`
package, so a platform suffix cannot come back into an import specifier. Platform variants are
carried by file names and resolved by configuration, so a suffix in the specifier is redundant,
hides cross-platform contamination from tsc, and rots on a rename.

The rule now anchors its match to the end of the specifier and rewrites only the trailing suffix,
where before it matched `.web` or `.native` anywhere and rewrote the first occurrence it found. It
also visits dynamic `import()`, `require()` and the `jest.mock` family, not just `import` and
`export`. Two new shapes are reported: a `/web` or `/native` subpath of a workspace package, and a
relative `web.ts` or `native.ts` module. The second carries no autofix, because dropping the segment
resolves to a different module and the fix is to rename the file. Third-party platform entry points
and `@support/*` test tooling are deliberately left alone.

The 30 packages that still carry suffixed specifiers are waived per package, and each waiver is
removed by the PR that cleans that package up.
