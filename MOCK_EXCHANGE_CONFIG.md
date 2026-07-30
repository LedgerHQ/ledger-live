# Mocking the Exchange coin config locally (test signature)

How to feed Ledger Live a **hand-crafted `descriptor_exchange_app` blob** for a currency and have
the Exchange app accept it. Used to give the Aleo tokens (USAD, USDCx) a non-empty sub coin config
so app-aleo can format token amounts, before CAL serves the real thing.

Everything here is **local playground only** — the signatures are forged with a publicly known test
key and only work on an Exchange app you built yourself. None of it is committable.

---

## TL;DR checklist

1. Build app-exchange with `TEST_PUBLIC_KEY=1`, keeping `APPNAME = "Exchange"`.
2. Install it, don't let Ledger Live replace it.
3. Launch Ledger Live with `MOCK_EXCHANGE_TEST_CONFIG=1` (or the Settings toggle + restart).
4. Patch `getCurrencyExchangeConfig` with your config blob + a test-key signature.
5. `pnpm build:llc`, then run the swap.

Miss step 3 and you get `0x9D1A` before the coin config is ever sent.

---

## Step 1 — Build a test-key Exchange app

The release Exchange app verifies the coin config signature against Ledger's `ExchangeConfigSigner`
key, whose private half you don't have. A build with `TEST_PUBLIC_KEY=1` instead trusts the test key
from `app-exchange/test/python/exchange_client/signing_authority.py`:

```
LEDGER_TEST_PRIVATE_KEY_HEX = "..."
```

That key derives exactly the `TEST_PUBLIC_KEY` bytes hardcoded in `app-exchange/src/init.c:9-18`, so
you can sign any config you like.

### Keep the app named "Exchange"

`app-exchange/Makefile:160-165` renames the app as soon as any test flag is set:

```make
ifeq ($(TEST_BUILD),1)
	APPNAME = "Exchange TEST"      # <- Ledger Live won't find this
	VARIANT_VALUES = "exchangetest"
	DEFINES += TEST_BUILD
endif
```

Ledger Live opens the app by name (`libs/ledger-live-common/src/hw/actions/startExchange.ts:129`),
so `Exchange TEST` looks like "Exchange is not installed" and it installs the store version over
your build. Either comment out the `APPNAME` line, or override it on the command line (a
command-line assignment beats an in-makefile one in GNU make):

```bash
make -j DEBUG=1 TEST_PUBLIC_KEY=1 APPNAME='"Exchange"'
```

Leave `VARIANT_VALUES` alone — it only affects the build output path. `TEST_BUILD` itself is
cosmetic: its only use in `src/` is a string in `src/ui/menu_nbgl.c:29-39`.

Do **not** patch Ledger Live to open `"Exchange TEST"` instead: that name doesn't exist in the CAL
app catalog, so you'd break version resolution and the dependency-install logic
(`libs/ledger-live-common/src/apps/support.ts:60`, `apps/polyfill.ts:147`).

### After installing

Your app reports the name `Exchange` with a non-genuine hash. Ledger Live opens it fine, but My
Ledger may offer an Exchange update — **don't accept it**, it replaces your build.

---

## Step 2 — Put Ledger Live in Exchange developer mode

This is the step that's easy to miss. Swap staging (`SWAP_API_BASE`) has **nothing** to do with
signature selection. The flag that does is `MOCK_EXCHANGE_TEST_CONFIG`; it switches every
Ledger-signed descriptor from `signatures.prod` to `signatures.test`:

| consumer | file |
|---|---|
| swap provider (partner) descriptor | `libs/ledger-live-common/src/exchange/providers/swap.ts:336` |
| sell/fund provider descriptor | `libs/ledger-live-common/src/exchange/providers/index.ts:36` |
| currency coin config | `libs/ledger-live-common/src/exchange/index.ts` |

Simplest, since it's a boolean env:

```bash
MOCK_EXCHANGE_TEST_CONFIG=1 pnpm dev:lld
```

Or via the UI:

1. Settings → Experimental features → enable **Developer mode** (reveals the Developer tab).
2. Settings → Developer → **Exchange developer mode** ON. Leave the provider-JSON input empty —
   `getTestProviderInfo()` stays undefined and provider data falls through to CAL with test
   signatures, which is what you want.
3. **Restart Ledger Live.** `fetchAndMergeProviderData` memoizes into a module-level
   `providerDataCache` (`providers/swap.ts:330`) that isn't keyed on signature env — if providers
   were already fetched with prod signatures this session, the toggle won't refetch them.

> Note: `getCurrencyExchangeConfig` used to pass only `{ env }` to `findCurrencyData`, leaving
> `signatureKind` at its `"prod"` default (`libs/ledger-services/cal/src/currencies.ts:58`). That
> meant staging CAL data + a production signature, which a test-key app rejects for every currency.
> The local patch below also passes `signatureKind`.

---

## Step 3 — Override the config in live-common

Single place: `getCurrencyExchangeConfig` in `libs/ledger-live-common/src/exchange/index.ts`. Both
callers (`exchange/swap/completeExchange.ts` and `exchange/platform/transfer/completeExchange.ts`)
go through it.

```ts
// ---- LOCAL PLAYGROUND ONLY — DO NOT COMMIT ----
const LOCAL_ALEO_OVERRIDES: Record<string, { config: string; signature: string }> = {
  "aleo/arc22/usad": {
    config: "045553414404416c656f06045553414406",
    signature: "3043021f59e1…",
  },
  "aleo/arc22/usdcx": {
    config: "05555344437804416c656f0705555344437806",
    signature: "30440220371534…",
  },
};
// ---- /LOCAL PLAYGROUND ----

export const getCurrencyExchangeConfig = async (
  currency: CryptoCurrency | TokenCurrency,
): Promise<ExchangeCurrencyNameAndSignature> => {
  const override = LOCAL_ALEO_OVERRIDES[currency.id];
  if (override) {
    return {
      config: Buffer.from(override.config, "hex"),
      signature: Buffer.from(override.signature, "hex"),
    };
  }

  const env = getEnv("MOCK_EXCHANGE_TEST_CONFIG") ? "test" : "prod";
  const lookupId = ARC_NATIVE_USDC_TOKEN_ID_BY_CURRENCY_ID[currency.id] ?? currency.id;
  const res = await calService.findCurrencyData(lookupId, { env, signatureKind: env });
  // …unchanged
```

Then `pnpm build:llc` (or `pnpm watch:common` while iterating).

Two gotchas:

- **Ids are exact.** These are mainnet (`aleo/arc22/usad`). Testnet is
  `aleo_testnet/arc22/test_usad` with a different ticker, so it needs its own blob. A missed key
  fails silently — you just get CAL's value back.
- `libs/ledger-live-common/src/exchange/index.test.ts:41,50` assert `{ env: "prod" }` and will fail
  on the extra `signatureKind` key. Expected; none of this is meant to land.

---

## Generating a config blob + signature

`descriptor_exchange_app.data` is the **legacy length-prefixed blob**, not protobuf. If CAL also
exposes an `exchange_config_protobuf` field, ignore it — `app-exchange/src/parse_coin_config.c` has
no protobuf path, and `src/proto/protocol.proto` contains no coin-config message.

```
| Lt | ticker | La | appName | Lc | subConfig |

subConfig (what the coin app receives) = | Lt | ticker | decimals |
```

Example — `USAD` / `Aleo` / 6 decimals:

```
04 55534144        "USAD"
04 416c656f        "Aleo"
06 04 55534144 06  subConfig = len 4 "USAD", 6 decimals
```

app-aleo parses that subConfig with `swap_parse_config` in
`src/swap/handle_get_printable_amount.c`; an empty subConfig (`Lc = 00`, what CAL serves today)
makes it fall back to native ALEO decimals and ticker.

Signature = `ECDSA-secp256k1(SHA256(config))`, DER-encoded
(`app-exchange/src/check_addresses_and_amounts.c:19-27`).

Dependency-free generator — save as `gen-config.mjs` and run with `node gen-config.mjs`:

```js
import crypto from "node:crypto";

// app-exchange test/python/exchange_client/signing_authority.py :: LEDGER_TEST_PRIVATE_KEY_HEX
const PRIV = "b1ed47ef58f782e2bc4d5abe70ef66d9009c2957967017054470e0f3e10f5833";

const key = crypto.createPrivateKey({
  key: Buffer.concat([
    Buffer.from("302e0201010420", "hex"), // SEC1 EC private key header
    Buffer.from(PRIV, "hex"),
    Buffer.from("a00706052b8104000a", "hex"), // secp256k1 OID
  ]),
  format: "der",
  type: "sec1",
});

const tlv = b => Buffer.concat([Buffer.from([b.length]), b]);
const buildConfig = (ticker, appName, decimals) => {
  const sub = Buffer.concat([tlv(Buffer.from(ticker, "ascii")), Buffer.from([decimals])]);
  return Buffer.concat([
    tlv(Buffer.from(ticker, "ascii")),
    tlv(Buffer.from(appName, "ascii")),
    tlv(sub),
  ]);
};

// edit this list
const CURRENCIES = [
  ["USAD", "Aleo", 6],
  ["USDCx", "Aleo", 6],
];

for (const [ticker, appName, decimals] of CURRENCIES) {
  const config = buildConfig(ticker, appName, decimals);
  const signature = crypto.createSign("sha256").update(config).sign(key);
  console.log(`${ticker}\n  config   : ${config.toString("hex")}\n  signature: ${signature.toString("hex")}`);
}
```

ECDSA is randomized, so the signature differs on every run — any of them verifies.

---

## Troubleshooting: `0x9D1A` (SIGN_VERIFICATION_FAIL)

`0x9D1A` is `SIGN_VERIFICATION_FAIL` (`app-exchange/src/swap_errors.h:38`) and **three different
checks raise it**. Read the APDU log to see which one, and note that the trace stops at the failing
step — an error at `e005` means your coin config was never even sent.

| APDU | check | what's wrong |
|---|---|---|
| `e005` CHECK_PARTNER | partner descriptor signed by Ledger (`check_partner.c`) | `MOCK_EXCHANGE_TEST_CONFIG` is off → prod signature sent to a test-key app. Step 2. |
| `e006`/`e007` CHECK_ASSET_IN / CHECK_PAYOUT_ADDRESS | coin config signed by Ledger (`check_addresses_and_amounts.c`) | Config and signature don't match, or signature made with the wrong key. Step 3. |
| PROCESS_TRANSACTION | `binaryPayload` signed by the **partner** (`check_tx_signature.c`) | Staging partner may sign with its test key → also set `MOCK_EXCHANGE_TEST_PARTNER=1` (`shared/env/src/definitions/team-ptx/index.ts:28`, no UI toggle). Independent of the Ledger key. |

Quick way to tell prod from test: fetch the descriptor from CAL and diff the signature you sent
against `descriptor.signatures.prod` / `.test`.

- Currency configs: `GET {CAL}/v1/currencies?output=id,descriptor_exchange_app&id=<currency-id>`
- Partner descriptors: `GET {CAL}/v1/partners?output=name,public_key,public_key_curve,descriptor,partner_id&service_name=swap&env=prod`

Other useful codes from `swap_errors.h`: `0x6A80` `INCORRECT_COMMAND_DATA` (malformed config —
check your length prefixes), `0x6A8C` `APPLICATION_NOT_INSTALLED`, `0x6A83` `INVALID_ADDRESS`.

---

## Reference: which key signs what

| key | where | private half |
|---|---|---|
| `ExchangeConfigSigner` (prod) | `app-exchange/src/init.c:33-42` | Ledger-only. Matches CAL `signatures.prod`. |
| `TEST_PUBLIC_KEY` | `app-exchange/src/init.c:9-18` | Public: `b1ed47ef…5833`. Matches CAL `signatures.test`. |
| partner key | per-partner, from CAL `/v1/partners` | the partner's. Selected by `MOCK_EXCHANGE_TEST_PARTNER`. |

Verified: CAL's `signatures.test` for both the Aleo currencies and the nearintents partner
descriptor validate against `TEST_PUBLIC_KEY`, and `signatures.prod` against the release key.

---

## Reverting

Everything on the Ledger Live side is in one file — `git checkout
libs/ledger-live-common/src/exchange/index.ts` — plus turning the Settings toggle back off and
reinstalling the store Exchange app.
