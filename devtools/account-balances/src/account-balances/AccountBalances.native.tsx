/**
 * Native placeholder — never rendered.
 *
 * The tool declares `platform: "web"`, so the shell filters it out of the native tool list. This file
 * exists for the *bundler*, not the runtime: `@devtools/registry` holds a statically analysable
 * `import("@devtools/account-balances")` for every registered tool, so without a native entry the
 * mobile bundle resolves the web view and drags `@ledgerhq/lumen-ui-react` — and its whole radix and
 * tanstack peer graph — into a React Native build, where none of it resolves.
 *
 * Deliberately dependency-free rather than a port: a real one would be written against
 * lumen-ui-rnative, and nothing on mobile reads the balance table yet.
 */
export function AccountBalances() {
  return null;
}

export default AccountBalances;
