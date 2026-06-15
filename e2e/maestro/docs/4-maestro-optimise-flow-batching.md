# Maestro - optimise flow batching

The WDIO page *optimise context switching* tackles the cost of switching native ↔ webview on every
action. **Maestro removes that problem entirely** — there is no context to switch; native and webview
are one hierarchy. But Maestro introduces a *different* per-action cost that a naive Page Object would
trigger repeatedly: **each flow run spawns a `maestro` CLI process** (JVM + driver init). This page shows
how the POC keeps that cost down.

## The hidden cost: one `maestro` process per flow

`ctx.runFlow()` serializes the buffered commands to a `.yaml` and **spawns the Maestro CLI**:

```typescript
// runtime/maestro.ts
private async runMaestroProcess(flowPath: string, env: Record<string, string>): Promise<number> {
  const driverArgs = this.flowCount > 0 ? ["--no-reinstall-driver"] : []; // reuse driver after 1st
  this.flowCount += 1;
  const child = spawn("maestro", [`--platform=${this.project.platform}`, "test", ...driverArgs, flowPath],
    { stdio: "inherit" });
  // ...
}
```

So **every `runFlow` = a process start**. A Page Object that ran a flow per action would pay that startup
over and over — the Maestro analogue of WDIO's "switch every time".

## Naive: a flow per action (expensive)

```typescript
// anti-pattern — each call serializes + spawns maestro
class PortfolioPage {
  async openAddAccount() { await this.run([{ tapOn: { id: "add-account-cta" } }]); }
  async search(t: string) { await this.run([{ tapOn: { id: "search" } }, { inputText: t }]); }
  async pick(t: string)   { await this.run([{ tapOn: { id: `asset-item-${t}` } }]); }
  private run(cmds) { return this.maestro.runFlow("step", cmds); } // ← spawns maestro every time
}

// spec: 3 calls = 3 maestro process spawns for one logical step
await portfolio.openAddAccount();
await portfolio.search("BTC");
await portfolio.pick("BTC");
```

Three JVM/driver startups for what is one screen interaction — slow and noisy in CI logs.

## Buffer, then drain once (the POC pattern)

Page Objects do **not** run anything. They **append** commands to a shared `FlowBuilder`; the spec drains
it **once** with a single `maestro` process:

```typescript
// runtime/flowBuilder.ts — just a buffer
export class FlowBuilder {
  private commands: MaestroCommand[] = [];
  add(...c: MaestroCommand[]) { this.commands.push(...c); }
  addStep(label: string, c: MaestroCommand[]) { this.commands.push({ runFlow: { label, commands: c } }); }
  drain() { const d = this.commands; this.commands = []; return d; }
}

// context.ts — drain → ONE maestro run
async runFlow(name: string): Promise<void> {
  const commands = this.flow.drain();
  if (commands.length === 0) return;
  await this.maestro.runFlow(name, commands, {}, { webViewHierarchy: true });
}
```

Page Objects become **synchronous builders** that queue commands (labelled as `runFlow` sub-steps for
readable Allure + reporting), and the spec decides when to flush:

```typescript
// pages/modularDrawer.ts — queues, does NOT spawn
selectAssetForAddAccount(ticker: string): void {
  this.app.addStep(`select-${ticker}-for-add-account`, [
    { tapOn: { id: this.assetItemId(ticker), retryTapIfNoChange: true } },
  ]);
}

// addAccount spec — many actions, ONE process
await ctx.app.openDeepLink("ledgerlive://portfolio"); // bridge (no maestro process)
await ctx.portfolio.openAddAccount();
ctx.modularDrawer.selectAssetForAddAccount("BTC");     // queued
ctx.modularDrawer.confirmAddAccount();                 // queued
ctx.portfolio.expectAsset("Bitcoin");                  // queued
await ctx.runFlow("add-account");                      // ← single maestro spawn for all of it
```

## When you *must* flush mid-spec

Sometimes a non-Maestro action has to happen **between** UI steps — eg the swap needs an injected-JS
bridge call (typing the amount) after the currencies are picked but before quotes. There the spec drains,
does the bridge work, then keeps building:

```typescript
// utils/swapUtils.ts
await selectCurrency(ctx, accountToDebit, "from");   // queues taps
await selectCurrency(ctx, accountToCredit, "to");    // queues taps
await ctx.runFlow("swap-select-currencies");         // flush #1 (native picks)
await ctx.swapLiveApp.inputAmount(amount);           // bridge JS injection (not maestro)
await ctx.swapLiveApp.tapGetQuotes();                // queues again
await ctx.swapLiveApp.waitForQuotes();               // queued
// ...later: ctx.runFlow("swap-eth-usdt")            // flush #2
```

So the rule is: **flush only at genuine boundaries** (a bridge/Speculos interaction, or the end of the
spec) — the direct parallel to WDIO's "only switch if needed". Each extra `runFlow` is a process spawn,
so minimise them.

## Secondary cost: webview hierarchy reads

`runFlow` passes `webViewHierarchy: true`, which on Android emits `androidWebViewHierarchy: devtools` so
Maestro can read the swap DOM via Chrome DevTools — a **heavier** snapshot than a native one
(`runtime/maestro.ts#serialize`). Only request it on flows that actually touch the webview; native-only
flows should not pay for the DevTools read.

## Verdict

Maestro **eliminates** the native↔webview context-switching tax that WDIO has to engineer around. In its
place is a simpler rule: **buffer commands and spawn `maestro` as rarely as possible** — once per spec
where you can, flushing only at bridge/Speculos boundaries — and request the (heavier) webview hierarchy
only on flows that need it. The POC's `FlowBuilder` + `drain()` pattern already implements this; keep
Page Objects as pure builders and resist adding `runFlow` calls inside them. 🎉
