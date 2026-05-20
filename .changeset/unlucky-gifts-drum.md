---
"@ledgerhq/live-dmk-shared": minor
---

fix(live-dmk-shared): handle Node.js 22 ESM/CJS interop for hw-transport default import

When loaded via require() in Node.js 22, @ledgerhq/hw-transport resolves to its
CJS build where the class is exposed as `module.exports.default`. Unwrap the
default export with a fallback so DmkCompatTransport can correctly extend Transport
in both ESM and CJS environments.