# @shared/amount-format

Renders a smallest-unit integer amount with its unit code — `"1500000000000000000"` + `ETH/18` →
`1.5 ETH`.

Dependency-free and deliberately not locale-aware: it exists for surfaces that must show *exactly*
what a layer holds, which is why it never goes through `Number` (an EVM amount exceeds
`Number.MAX_SAFE_INTEGER`) and why a non-zero amount too small to render shows as `<0.00000001 ETH`
rather than `0 ETH`.

Shared rather than copied into each devtool: `@devtools/*` tool packages may not import one another,
so a cross-cutting utility lives outside that scope (see `.agents/skills/devtools-import-boundary`).
