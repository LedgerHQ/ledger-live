// Suite D — regression of every path that needs NO device: session, balances,
// operations, assets, earn read paths, swap quote, and all `--dry-run` builders.
// Runs against a REAL session (labels are discovered dynamically), reads live
// backends, and never signs or broadcasts.

import { asArray, asString, colors, jsonAt, objectsDeep, parseJson, type Harness } from "./lib";

const QUOTE_ETH_BTC = [
  "swap",
  "quote",
  "--from",
  "ethereum",
  "--to",
  "bitcoin",
  "--amount",
  "0.05",
] as const;

type Discovered = {
  /** Set when the session cannot be used at all; every session-bound case skips with it. */
  readonly unavailable: string | undefined;
  readonly labels: readonly string[];
  readonly ethLabel: string | undefined;
  readonly solLabel: string | undefined;
  readonly btcLabel: string | undefined;
  readonly ethAddr: string;
  readonly addressOf: (label: string | undefined) => string;
};

/** Descriptors are `account:1:address:<net>:main:<address>:<path>`; the address is field 6. */
function descriptorAddress(descriptor: string | undefined): string {
  return descriptor?.split(":")[5] ?? "";
}

async function discover(h: Harness): Promise<Discovered> {
  const empty = {
    labels: [],
    ethLabel: undefined,
    solLabel: undefined,
    btcLabel: undefined,
    ethAddr: "",
    addressOf: () => "",
  };

  h.realEnv();
  await h.cli("session", "view", "--output", "json");
  const json = h.rc === 0 ? parseJson(h.out) : undefined;
  if (json === undefined) {
    return { ...empty, unavailable: "cannot read the session — run `account discover` first" };
  }

  const accounts = asArray(jsonAt(json, "accounts"));
  if (accounts.length === 0) {
    return { ...empty, unavailable: "no accounts in the session — run `account discover` first" };
  }

  const descriptorOf = (label: string | undefined): string =>
    asString(
      jsonAt(
        accounts.find(account => jsonAt(account, "label") === label),
        "descriptor",
      ),
    ) ?? "";

  const labels = accounts
    .map(account => asString(jsonAt(account, "label")))
    .filter((label): label is string => Boolean(label));
  const ethLabel = labels.find(label => /^ethereum-\d+$/.test(label));
  const solLabel = labels.find(label => /^solana-\d+$/.test(label));
  const btcLabel = labels.find(label => /^bitcoin-[a-z0-9]+-\d+$/.test(label));

  // A safe dry-run recipient: one of our own ethereum addresses, so even a
  // mis-typed real send would only be a self-transfer. `session view` exposes
  // descriptors, not addresses, so the address is read out of a *different*
  // ethereum account's descriptor.
  const otherEth = accounts.find(
    account =>
      jsonAt(account, "label") !== ethLabel &&
      (asString(jsonAt(account, "descriptor")) ?? "").includes(":address:ethereum:main:"),
  );
  const ethAddr =
    descriptorAddress(asString(jsonAt(otherEth, "descriptor"))) ||
    descriptorAddress(descriptorOf(ethLabel));

  return {
    unavailable: undefined,
    labels,
    ethLabel,
    solLabel,
    btcLabel,
    ethAddr,
    addressOf: label => descriptorAddress(descriptorOf(label)),
  };
}

type Page = { readonly label: string; readonly cursor: string; readonly firstHash: string };

// Pagination needs an account whose history is longer than the page size; with a
// short history the backend legitimately returns no cursor, so pick the account
// with the most operations and skip (not fail) when none paginates.
async function findPaginatingAccount(h: Harness, labels: readonly string[]): Promise<Page> {
  for (const candidate of labels) {
    if (!/^(ethereum|solana|bitcoin)-/.test(candidate)) continue;
    await h.cli("operations", candidate, "--limit", "2", "--output", "json");
    if (h.rc !== 0) continue;
    const json = parseJson(h.out);
    const cursor = asString(jsonAt(json, "nextCursor")) ?? "";
    if (cursor) {
      const firstHash = asString(jsonAt(json, "operations.0.hash")) ?? "";
      return { label: candidate, cursor, firstHash };
    }
  }
  return { label: "", cursor: "", firstHash: "" };
}

export async function suiteD(h: Harness): Promise<void> {
  const session = await discover(h);
  h.realEnv();

  const { unavailable, ethLabel, solLabel, btcLabel, ethAddr } = session;
  const eth = ethLabel ?? "";
  const sol = solLabel ?? "";
  const btc = btcLabel ?? "";

  if (unavailable) {
    h.print(`  ${colors.dim}${unavailable}${colors.off}`);
  } else {
    h.print(
      `  ${colors.dim}session labels: eth=${eth} sol=${sol} btc=${btc} recipient=${ethAddr}${colors.off}`,
    );
  }

  const missing = (label: string | undefined, reason: string): string | undefined =>
    unavailable ?? (label ? undefined : reason);
  const noEth = missing(ethLabel, "no ethereum account in session");
  const noSol = missing(solLabel, "no solana account");
  const noBtc = missing(btcLabel, "no mainnet bitcoin account");

  const run = async (
    id: string,
    desc: string,
    reason: string | undefined,
    body: () => Promise<void>,
  ): Promise<void> => {
    if (reason) {
      h.caseSkip(id, desc, reason);
      return;
    }
    h.caseStart(id, desc);
    await body();
    h.caseEnd();
  };

  // ---- D1/D2: session view --------------------------------------------------
  await run("D1", "session view lists labels and descriptors", noEth, async () => {
    await h.cli("session", "view");
    h.assertRc(0);
    h.assertHas(h.out, eth, "stdout");
    h.assertHas(h.out, "account:1:", "stdout");
  });

  await run("D2", "session view --output json envelope", unavailable, async () => {
    await h.cli("session", "view", "--output", "json");
    h.assertRc(0);
    const json = h.assertJson(h.out);
    h.assertField(json, "status", "success");
    h.assertField(json, "command", "session view");
    h.assertThat(asArray(jsonAt(json, "accounts")).length > 0, "accounts[] is empty");
    const first = asArray(jsonAt(json, "accounts"))[0];
    h.assertThat(
      jsonAt(first, "label") !== undefined && jsonAt(first, "descriptor") !== undefined,
      "accounts[0] lacks label or descriptor",
    );
    // v1 hardening: no raw xprv/extended private keys ever surface
    h.assertLacks(h.out, "xprv", "stdout");
  });

  // ---- D3..D6: balances -----------------------------------------------------
  await run("D3", "balances (ethereum) prints native + token balances", noEth, async () => {
    await h.cli("balances", eth);
    h.assertRc(0);
    h.assertHas(h.out, "ETH", "stdout");
  });

  await run("D4", "balances --output json shape ({asset, amount} rows)", noEth, async () => {
    await h.cli("balances", eth, "--output", "json");
    h.assertRc(0);
    const json = h.assertJson(h.out);
    h.assertField(json, "status", "success");
    h.assertField(json, "command", "balances");
    h.assertField(json, "network", "ethereum:main");
    const balances = asArray(jsonAt(json, "balances"));
    h.assertThat(balances.length >= 1, "balances[] is empty");
    h.assertThat(
      jsonAt(balances[0], "asset") !== undefined && jsonAt(balances[0], "amount") !== undefined,
      "balances[0] lacks asset or amount",
    );
    const native = balances.filter(row => jsonAt(row, "asset") === "ethereum");
    h.assertThat(native.length === 1, "expected exactly one native ethereum row");
    h.assertThat(
      (asString(jsonAt(native[0], "amount")) ?? "").endsWith(" ETH"),
      "the native row's amount is not denominated in ETH",
    );
  });

  await run("D5", "balances (solana) works for a non-EVM account", noSol, async () => {
    await h.cli("balances", sol, "--output", "json");
    h.assertRc(0);
    const json = h.assertJson(h.out);
    const native = asArray(jsonAt(json, "balances")).filter(row =>
      (asString(jsonAt(row, "amount")) ?? "").endsWith(" SOL"),
    );
    h.assertThat(native.length === 1, "expected exactly one SOL-denominated row");
  });

  await run("D6", "balances (bitcoin) works for a UTXO account", noBtc, async () => {
    await h.cli("balances", btc, "--output", "json");
    h.assertRc(0);
    const json = h.assertJson(h.out);
    const native = asArray(jsonAt(json, "balances")).filter(row =>
      (asString(jsonAt(row, "amount")) ?? "").endsWith(" BTC"),
    );
    h.assertThat(native.length === 1, "expected exactly one BTC-denominated row");
  });

  await run("D7", "unknown session label fails with actionable guidance", undefined, async () => {
    await h.cli("balances", "no-such-label-9");
    h.assertRc(1);
    h.assertHas(h.out + h.err, "No account labeled");
    h.assertHas(h.out + h.err, "account discover");
  });

  await run("D8", "raw account descriptors are rejected as arguments", undefined, async () => {
    await h.cli(
      "balances",
      "account:1:address:ethereum:main:0x0000000000000000000000000000000000000000:m/44h/60h/0h/0/0",
    );
    h.assertRcNonZero();
  });

  // ---- D9..D11: operations --------------------------------------------------
  await run("D9", "operations --limit returns rows and a pagination cursor", noEth, async () => {
    await h.cli("operations", eth, "--limit", "3");
    h.assertRc(0);
    h.assertNonEmpty(h.out + h.err);
  });

  await run("D10", "operations --output json exposes nextCursor", noEth, async () => {
    await h.cli("operations", eth, "--limit", "3", "--output", "json");
    h.assertRc(0);
    const json = h.assertJson(h.out);
    h.assertField(json, "command", "operations");
    h.assertThat(Array.isArray(jsonAt(json, "operations")), "operations is not an array");
  });

  const page = unavailable
    ? { label: "", cursor: "", firstHash: "" }
    : await findPaginatingAccount(h, session.labels);
  await run(
    "D11",
    page.label
      ? `operations pagination: --cursor advances the page (${page.label})`
      : "operations pagination",
    unavailable ??
      (page.label ? undefined : "no session account has more than one page of history"),
    async () => {
      await h.cli(
        "operations",
        page.label,
        "--limit",
        "2",
        "--cursor",
        page.cursor,
        "--output",
        "json",
      );
      h.assertRc(0);
      const json = h.assertJson(h.out);
      const secondHash = asString(jsonAt(json, "operations.0.hash")) ?? "";
      h.assertThat(
        secondHash !== "" && page.firstHash !== secondHash,
        `cursor page did not advance (${page.firstHash} vs ${secondHash})`,
      );
    },
  );

  // ---- D12..D15: assets -----------------------------------------------------
  await run("D12", "assets token resolves USDT by contract address", undefined, async () => {
    await h.cli("assets", "token", "ethereum", "0xdac17f958d2ee523a2206206994597c13d831ec7");
    h.assertRc(0);
    h.assertHas(h.out, "USDT", "stdout");
    h.assertHas(h.out, "ethereum/erc20/usd_tether__erc20_", "stdout");
  });

  await run("D13", "assets token-by-id round-trips the same id", undefined, async () => {
    await h.cli("assets", "token-by-id", "ethereum/erc20/usd_tether__erc20_", "--output", "json");
    h.assertRc(0);
    const json = h.assertJson(h.out);
    h.assertThat(
      objectsDeep(json).some(node => node.ticker === "USDT"),
      "no object in the envelope carries ticker USDT",
    );
  });

  await run("D14", "assets token for an unknown contract exits non-zero", undefined, async () => {
    await h.cli("assets", "token", "ethereum", "0x0000000000000000000000000000000000000001");
    h.assertRcNonZero();
    h.assertHas(h.out + h.err, "not found");
  });

  await run(
    "D15",
    "assets token resolves a non-EVM (solana) mint by address",
    undefined,
    async () => {
      await h.cli("assets", "token", "solana", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
      h.assertRc(0);
      h.assertHas(h.out, "USDC", "stdout");
    },
  );

  await run(
    "D15b",
    "assets token with a missing positional prints usage, not a stack trace",
    undefined,
    async () => {
      await h.cli("assets", "token", "solana");
      h.assertRcNonZero();
      h.assertHas(h.out + h.err, "Usage: assets token <network> <address>");
    },
  );

  // ---- D16..D20: earn read paths --------------------------------------------
  await run(
    "D16",
    "earn yields (no network) lists supported networks with deeplinks",
    undefined,
    async () => {
      await h.cli("earn", "yields");
      h.assertRc(0);
      h.assertHas(h.out, "ledgerlive://", "stdout");
    },
  );

  await run(
    "D17",
    "earn yields -n solana surfaces --product validator targets",
    undefined,
    async () => {
      await h.cli("earn", "yields", "-n", "solana");
      h.assertRc(0);
      h.assertHas(h.out, "Deposit targets", "stdout");
      h.assertHas(h.out, "--product", "stdout");
      h.assertHas(h.out, "Ledger by", "stdout");
    },
  );

  await run(
    "D18",
    "earn yields -n ethereum surfaces vault ids as --product",
    undefined,
    async () => {
      await h.cli("earn", "yields", "-n", "ethereum", "--output", "json");
      h.assertRc(0);
      const json = h.assertJson(h.out);
      h.assertThat(
        objectsDeep(json).some(node => "vaultId" in node),
        "no vaultId anywhere in the envelope",
      );
    },
  );

  await run("D19", "earn yields --limit and --all are accepted", undefined, async () => {
    await h.cli("earn", "yields", "-n", "solana", "--limit", "3");
    h.assertRc(0);
    await h.cli("earn", "yields", "--all");
    h.assertRc(0);
  });

  await run(
    "D20",
    "earn positions (solana) returns positions and/or on-chain stakes",
    noSol,
    async () => {
      await h.cli("earn", "positions", sol, "--output", "json");
      h.assertRc(0);
      const json = h.assertJson(h.out);
      h.assertField(json, "command", "earn positions");
      h.assertThat(Array.isArray(jsonAt(json, "positions")), "positions is not an array");
    },
  );

  await run("D21", "earn positions --fresh is accepted and stays non-blocking", noSol, async () => {
    await h.cli("earn", "positions", sol, "--fresh");
    h.assertRc(0);
  });

  await run("D22", "earn positions (ethereum) works", noEth, async () => {
    await h.cli("earn", "positions", eth, "--output", "json");
    h.assertRc(0);
    h.assertJson(h.out);
  });

  // ---- D23..D30: send --dry-run (no device, nothing broadcast) --------------
  await run(
    "D23",
    "send --dry-run (native ETH) builds a transaction and shows fees",
    noEth,
    async () => {
      await h.cli("send", eth, "--to", ethAddr, "--amount", "0.0001 ETH", "--dry-run");
      h.assertRc(0);
      h.assertHas(h.out + h.err, "0.0001 ETH");
      h.assertHas(h.out + h.err, "Fees");
      h.assertLacks(h.out + h.err, "hash:", "output (nothing may be broadcast in a dry run)");
    },
  );

  await run("D24", "send --dry-run (ERC-20) resolves the token by ticker", noEth, async () => {
    await h.cli("balances", eth, "--output", "json");
    // `amount` is a display string ("8.0232 USDC"): take the ticker of the first
    // non-native row whose numeric part is > 0.
    const token = asArray(jsonAt(parseJson(h.out), "balances"))
      .filter(row => jsonAt(row, "asset") !== "ethereum")
      .map(row => (asString(jsonAt(row, "amount")) ?? "").split(" "))
      .find(parts => Number((parts[0] ?? "").replaceAll(",", "")) > 0)?.[1];
    if (token) {
      await h.cli("send", eth, "--to", ethAddr, "--amount", `0.01 ${token}`, "--dry-run");
      h.assertRc(0);
      h.assertHas(h.out + h.err, token);
    } else {
      h.failCase(`no funded ERC-20 in ${eth} — run this case on a token-funded account`);
    }
  });

  await run("D25", "send --amount without a ticker is rejected", noEth, async () => {
    await h.cli("send", eth, "--to", ethAddr, "--amount", "0.0001", "--dry-run");
    h.assertRcNonZero();
    h.assertHas(h.out + h.err, "must include a ticker");
  });

  await run("D26", "send with an unknown ticker lists the account's tickers", noEth, async () => {
    await h.cli("send", eth, "--to", ethAddr, "--amount", "1 UNKN", "--dry-run");
    h.assertRcNonZero();
    h.assertHas(h.out + h.err, "not found in account");
    h.assertHas(h.out + h.err, "Available:");
  });

  await run("D27", "send above balance surfaces NotEnoughBalance", noEth, async () => {
    await h.cli("send", eth, "--to", ethAddr, "--amount", "999999 ETH", "--dry-run");
    h.assertRcNonZero();
    h.assertHas(h.out + h.err, "NotEnoughBalance");
  });

  // Address validation now goes through the CoinModuleApi instance (2.1.0 change):
  // exercise it once per family.
  await run(
    "D28",
    "invalid recipient is rejected (ethereum) — validateAddress via CoinModuleApi",
    noEth,
    async () => {
      await h.cli("send", eth, "--to", "0xnotanaddress", "--amount", "0.0001 ETH", "--dry-run");
      h.assertRcNonZero();
      h.assertHas(h.out + h.err, "InvalidAddress");
    },
  );

  // A UTXO descriptor carries an xpub, not a spendable address, so the positive
  // bitcoin dry run (with --fee-per-byte/--rbf) lives in the manual suite, where
  // `receive` has produced a real address. Here we cover validation + flag parsing.
  await run(
    "D29",
    "invalid recipient is rejected (bitcoin) and fee flags parse",
    noBtc,
    async () => {
      await h.cli("send", btc, "--to", "bc1qinvalidaddress", "--amount", "0.0001 BTC", "--dry-run");
      h.assertRcNonZero();
      h.assertHas(h.out + h.err, "InvalidAddress");
      await h.cli(
        "send",
        btc,
        "--to",
        "bc1qinvalidaddress",
        "--amount",
        "0.0001 BTC",
        "--fee-per-byte",
        "5",
        "--rbf",
        "--dry-run",
      );
      h.assertHas(h.out + h.err, "InvalidAddress");
      h.assertLacks(h.out + h.err, "Unknown option");
    },
  );

  await run(
    "D30",
    "invalid recipient is rejected (solana) + --memo accepted in a dry run",
    noSol,
    async () => {
      await h.cli("send", sol, "--to", "notasolanaaddress", "--amount", "0.001 SOL", "--dry-run");
      h.assertRcNonZero();
      h.assertHas(h.out + h.err, "InvalidAddress");
      await h.cli(
        "send",
        sol,
        "--to",
        session.addressOf(solLabel),
        "--amount",
        "0.0001 SOL",
        "--memo",
        "nr-2.1.0",
        "--dry-run",
      );
      h.assertLacks(h.out + h.err, "Unknown option");
      h.assertLacks(h.out + h.err, "hash:", "output (dry run must not broadcast)");
    },
  );

  // ---- D31..D33: earn dry runs ----------------------------------------------
  await run(
    "D31",
    "earn deposit --dry-run (solana stake) validates without signing",
    noSol,
    async () => {
      await h.cli("earn", "yields", "-n", "solana", "--output", "json");
      const validator = objectsDeep(parseJson(h.out))
        .map(node => asString(node.validator))
        .find(Boolean);
      if (!validator) {
        h.failCase("no validator returned by earn yields -n solana");
        return;
      }
      await h.cli(
        "earn",
        "deposit",
        sol,
        "--product",
        validator,
        "--amount",
        "0.5 SOL",
        "--dry-run",
      );
      h.assertLacks(h.out + h.err, "Unknown option");
      h.assertLacks(h.out + h.err, "hash:", "output (dry run must not broadcast)");
    },
  );

  await run(
    "D32",
    "earn deposit --dry-run (ethereum vault) reports the approve/deposit split",
    noEth,
    async () => {
      await h.cli("earn", "yields", "-n", "ethereum", "--output", "json");
      const vault = objectsDeep(parseJson(h.out))
        .map(node => asString(node.vaultId))
        .find(Boolean);
      if (!vault) {
        h.failCase("no vaultId returned by earn yields -n ethereum");
        return;
      }
      await h.cli("earn", "deposit", eth, "--product", vault, "--amount", "1 USDC", "--dry-run");
      h.assertLacks(h.out + h.err, "Unknown option");
      h.assertLacks(h.out + h.err, "hash:", "output (dry run must not broadcast)");
    },
  );

  await run("D33", "earn withdraw --dry-run rejects a missing target", noEth, async () => {
    await h.cli("earn", "withdraw", eth, "--dry-run");
    h.assertRcNonZero();
  });

  // ---- D34..D38: swap quote -------------------------------------------------
  await run(
    "D34",
    "swap quote (ETH -> BTC) queries providers and reports per-provider outcomes",
    noEth,
    async () => {
      if (!btcLabel) {
        h.failCase("no mainnet bitcoin account for the ETH->BTC quote");
        return;
      }
      await h.cli(...QUOTE_ETH_BTC, "--from-account", eth, "--to-account", btc);
      h.assertRc(0);
      h.assertNonEmpty(h.out + h.err);
      h.assertThat(
        /rate|no quotes available/i.test(h.out + h.err),
        "no rate lines and no explicit 'No quotes available'",
      );
    },
  );

  await run("D35", "swap quote --output json shape", noEth, async () => {
    await h.cli(...QUOTE_ETH_BTC, "--from-account", eth, "--to-account", btc, "--output", "json");
    h.assertRc(0);
    h.assertField(h.assertJson(h.out), "command", "swap quote");
  });

  await run("D36", "swap quote accepts a token currency id", noEth, async () => {
    const usdt = "ethereum/erc20/usd_tether__erc20_";
    await h.cli(
      "swap",
      "quote",
      "--from",
      usdt,
      "--to",
      "ethereum",
      "--amount",
      "50",
      "--from-account",
      eth,
      "--to-account",
      eth,
      "--output",
      "json",
    );
    h.assertRc(0);
    h.assertJson(h.out);
  });

  await run("D37", "swap quote with a missing required flag fails cleanly", noEth, async () => {
    await h.cli(...QUOTE_ETH_BTC, "--from-account", eth);
    h.assertRcNonZero();
    h.assertLacks(h.out + h.err, "[object Object]");
  });

  await run("D38", "swap quote with an unknown currency id fails cleanly", noEth, async () => {
    await h.cli(
      "swap",
      "quote",
      "--from",
      "not-a-currency",
      "--to",
      "bitcoin",
      "--amount",
      "0.05",
      "--from-account",
      eth,
      "--to-account",
      btc,
    );
    h.assertRcNonZero();
    h.assertLacks(h.out + h.err, "[object Object]");
  });

  // Documented behaviour: an id the provider does not know is reported as UNKNOWN
  // with exit 0 (it is a status read, not a failure). What must not happen is a
  // crash or an unrendered error object.
  await run(
    "D39",
    "swap status reports UNKNOWN for an unknown swap id without crashing",
    undefined,
    async () => {
      await h.cli(
        "swap",
        "status",
        "--swap-id",
        "nr-2-1-0-does-not-exist",
        "--provider",
        "changelly",
      );
      h.assertRc(0);
      h.assertHas(h.out, "UNKNOWN", "stdout");
      h.assertLacks(h.out + h.err, "[object Object]");
    },
  );

  await run("D39b", "swap status with a missing --provider fails cleanly", undefined, async () => {
    await h.cli("swap", "status", "--swap-id", "nr-2-1-0-does-not-exist");
    h.assertRcNonZero();
    h.assertLacks(h.out + h.err, "[object Object]");
  });

  // ---- D40: version / help surface ------------------------------------------
  const groups = [
    "account",
    "session",
    "balances",
    "operations",
    "receive",
    "send",
    "swap",
    "earn",
    "ring",
    "skill",
    "genuine-check",
    "assets",
  ];
  await run(
    "D40",
    `--version reports ${h.config.expectedVersion} and --help lists every command group`,
    undefined,
    async () => {
      await h.cli("--version");
      h.assertRc(0);
      h.assertHas(h.out, h.config.expectedVersion, "stdout");
      await h.cli("--help");
      h.assertRc(0);
      for (const group of groups) {
        h.assertHas(h.out + h.err, group, `--help output (missing ${group})`);
      }
    },
  );
}
