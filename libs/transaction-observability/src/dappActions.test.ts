import type { Account, SignedOperation } from "@ledgerhq/types-live";
import { setEnv } from "@shared/env";
import { buildBroadcastCommonEvent, buildSignCommonEvent } from "./eventBuilders";
import { rememberSignContext } from "./signContext";
import { TransactionPathway, type LogEvent } from "./logEvent";
import { toSegmentTrackEvent } from "./segmentEvent";
import { deriveDappAction, readDappFunction } from "./dappActions";
import { isStakingApp, stakingMethodOf } from "./stakingApps";
import type { TransactionLike } from "./transactionShape";

// Real selectors, so the map is checked against the vocabulary it actually meets.
const LIDO_SUBMIT = "0xa1903eab"; // keccak256("submit(address)")
const WETH_DEPOSIT = "0xd0e30db0"; // keccak256("deposit()") — wrapping ETH, not staking
const STAKE_NO_ARGS = "0x3a4b66f1"; // keccak256("stake()")
const UNMAPPED = "0xdeadbeef";

// Observed in a real Lido stake on desktop: `submit(address)` is called on stETH itself, so
// the deposit target and the receipt token are one address.
const LIDO_STETH = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
const KILN_PSETH = "0x5DB5235b5C7e247488784986e58019fFFd98FdA4";
// Stader publishes this as the only contract its app should touch. A pool manager, not a
// token: CAL returns nothing for it, while ETHx lives at a different address.
const STADER_POOL = "0xcf5ea1b38380f6af39068375516daf40ed70d299";

const ethereum = {
  id: "account-id",
  type: "Account",
  currency: { id: "ethereum", family: "evm", ticker: "ETH" },
} as unknown as Account;

const sei = {
  id: "account-id",
  type: "Account",
  currency: { id: "sei_evm", family: "evm", ticker: "SEI" },
} as unknown as Account;

const callData = (selector: string) => Buffer.from(selector.slice(2), "hex");

const signEvent = (over: {
  account?: Account;
  manifestId?: string;
  transaction: TransactionLike;
}) =>
  buildSignCommonEvent({
    account: over.account ?? ethereum,
    mainAccount: over.account ?? ethereum,
    pathway: TransactionPathway.Dapp,
    manifestId: over.manifestId,
    transaction: over.transaction,
  });

beforeEach(() => setEnv("LEDGER_CLIENT_VERSION", "llc/test"));

describe("the dApp selector vocabulary", () => {
  it("reads the called function's name", () => {
    expect(readDappFunction(LIDO_SUBMIT)).toBe("submit");
  });

  // The miss has to be countable, so an unmapped call reports the selector itself.
  it("falls back to the selector when the function is unknown", () => {
    expect(readDappFunction(UNMAPPED)).toBe("0xdeadbeef");
  });

  it.each([
    ["submit", "deposit"],
    ["stake", "deposit"],
    // Underscored and camel-cased spellings are separate functions in the selector list, and
    // Chorus One really calls this one — a miss here cost us an action in a live test.
    ["deposit_all", "deposit"],
    ["depositAll", "deposit"],
    ["withdraw_all", "withdraw"],
    ["requestWithdrawals", "withdraw"],
    ["redeem", "redeem"],
    ["claimRewards", "claimReward"],
  ])("maps %s to %s", (fn, action) => {
    expect(deriveDappAction(fn)).toBe(action);
  });

  it.each(["swap", "unoswap", "safeTransferFrom", "approve", "0xdeadbeef"])(
    "claims nothing for %s",
    fn => {
      expect(deriveDappAction(fn)).toBeUndefined();
    },
  );

  /**
   * The reason the two vocabularies live in separate maps. A generic-framework `mode` of
   * `stake` picks a validator, so it is a delegation. A contract function named `stake` enters
   * a pool, so it is a deposit. One map would have to answer both with the same word.
   */
  it("disagrees with the family mode map on purpose", () => {
    expect(deriveDappAction("stake")).toBe("deposit");
    expect(
      signEvent({ account: sei, transaction: { family: "evm", mode: "stake" } })
        .earnTransactionType,
    ).toBe("delegate");
  });
});

describe("reading the action off an EVM transaction", () => {
  // Native EVM staking sets a generic-framework mode and may still carry call data. The mode
  // has to win, or sei/monad would silently switch to the dApp vocabulary.
  it("prefers the staking mode over the call data", () => {
    const common = signEvent({
      account: sei,
      transaction: { family: "evm", mode: "delegate", data: callData(LIDO_SUBMIT) },
    });

    expect(common).toMatchObject({
      earnTransactionType: "delegate",
      rawTransactionType: "delegate",
    });
  });

  it("reads the contract call when the mode is a plain send", () => {
    const common = signEvent({
      manifestId: "lido",
      transaction: { family: "evm", mode: "send", data: callData(LIDO_SUBMIT) },
    });

    expect(common).toMatchObject({ earnTransactionType: "deposit", rawTransactionType: "submit" });
  });

  it("reports the selector when the function is not mapped", () => {
    const common = signEvent({
      manifestId: "lido",
      transaction: { family: "evm", mode: "send", data: callData(UNMAPPED) },
    });

    expect(common.earnTransactionType).toBeUndefined();
    expect(common.rawTransactionType).toBe("0xdeadbeef");
  });

  it("claims nothing for a plain transfer with no call data", () => {
    const common = signEvent({ transaction: { family: "evm", mode: "send" } });

    expect(common.earnTransactionType).toBeUndefined();
  });
});

describe("resolving the contract", () => {
  const lidoStake = (over: { recipient?: string } = {}) =>
    signEvent({
      manifestId: "lido",
      transaction: {
        family: "evm",
        mode: "send",
        recipient: over.recipient ?? LIDO_STETH,
        data: callData(LIDO_SUBMIT),
      },
    });

  it("reports the contract that was called", () => {
    expect(lidoStake().dappContract).toBe(LIDO_STETH.toLowerCase());
  });

  it("reads the receipt token off the contract", () => {
    expect(lidoStake().outputCurrency).toBe("stETH");
  });

  // Reported lower-cased whichever way it arrives, so one contract cannot become two rows.
  it("normalises the address, whichever casing it arrives in", () => {
    expect(lidoStake({ recipient: LIDO_STETH.toLowerCase() })).toMatchObject({
      dappContract: LIDO_STETH.toLowerCase(),
      outputCurrency: "stETH",
    });
    expect(
      lidoStake({ recipient: LIDO_STETH.toUpperCase().replace("0X", "0x") }).dappContract,
    ).toBe(LIDO_STETH.toLowerCase());
  });

  /**
   * The reason the contract is read at all. `kiln-staking` serves a pooled and a dedicated
   * product behind one manifest, so only the contract can say which this was.
   */
  it("names the product where the manifest cannot", () => {
    const pooled = signEvent({
      manifestId: "kiln-staking",
      transaction: {
        family: "evm",
        mode: "send",
        recipient: KILN_PSETH,
        data: callData(LIDO_SUBMIT),
      },
    });

    expect(pooled).toMatchObject({ stakingMethod: "pooling", outputCurrency: "psETH" });
  });

  /**
   * Stader is why the deposit target cannot be inferred from the receipt token: it mints ETHx
   * from a pool manager at a different address. Lido is the exception, not the rule.
   */
  it("resolves a pool contract that is not the receipt token", () => {
    const staked = signEvent({
      manifestId: "stader-eth",
      transaction: {
        family: "evm",
        mode: "send",
        recipient: STADER_POOL,
        data: callData(LIDO_SUBMIT),
      },
    });

    expect(staked).toMatchObject({
      dappContract: STADER_POOL.toLowerCase(),
      outputCurrency: "ETHx",
      stakingMethod: "liquid",
    });
  });

  // Never guess. An unmapped pool would otherwise report as dedicated and nobody would know;
  // an absent field plus `contract_address` says exactly what to add.
  it("reports no method or token for an unknown contract, rather than a default", () => {
    const unknown = signEvent({
      manifestId: "kiln-staking",
      transaction: {
        family: "evm",
        mode: "send",
        recipient: "0x00000000000000000000000000000000deadbeef",
        data: callData(LIDO_SUBMIT),
      },
    });

    expect(unknown.stakingMethod).toBeUndefined();
    expect(unknown.outputCurrency).toBeUndefined();
    expect(unknown.dappContract).toBe("0x00000000000000000000000000000000deadbeef");
  });

  // A plain send's recipient is the user's own payee, so it must never be read as a contract.
  it("never reports a recipient outside a staking app", () => {
    const send = signEvent({
      manifestId: "uniswap",
      transaction: {
        family: "evm",
        mode: "send",
        recipient: LIDO_STETH,
        data: callData(WETH_DEPOSIT),
      },
    });

    expect(send.dappContract).toBeUndefined();
  });

  it("never reports a recipient for native staking", () => {
    const native = signEvent({
      account: sei,
      transaction: { family: "evm", mode: "delegate", recipient: LIDO_STETH },
    });

    expect(native.dappContract).toBeUndefined();
    expect(native.outputCurrency).toBeUndefined();
  });
});

describe("the staking-app gate", () => {
  it("knows the ETH providers", () => {
    expect(isStakingApp("lido")).toBe(true);
    expect(isStakingApp("uniswap")).toBe(false);
    expect(isStakingApp(undefined)).toBe(false);
  });

  it("reports how each app stakes", () => {
    expect(stakingMethodOf("lido")).toBe("liquid");
    expect(stakingMethodOf("kelp-dao")).toBe("restaking");
    expect(stakingMethodOf("p2p")).toBe("dedicated");
  });

  // Kiln serves a pooled and a dedicated product behind one manifest, so the manifest cannot
  // say which. An absent field is honest; a guessed one is not.
  it("reports no method for an app that stakes more than one way", () => {
    expect(isStakingApp("kiln-staking")).toBe(true);
    expect(stakingMethodOf("kiln-staking")).toBeUndefined();
  });
});

describe("what reaches Segment", () => {
  const failure = (common: ReturnType<typeof signEvent>): LogEvent =>
    ({
      ...common,
      status: "failure",
      stage: "sign",
      errorCategory: "unknown",
      error: new Error("nope"),
    }) as unknown as LogEvent;

  it("emits a staking dApp call with its action and method", () => {
    const mapped = toSegmentTrackEvent(
      failure(
        signEvent({
          manifestId: "lido",
          transaction: {
            family: "evm",
            mode: "send",
            recipient: LIDO_STETH,
            data: callData(LIDO_SUBMIT),
          },
        }),
      ),
    );

    expect(mapped!.properties).toMatchObject({
      transaction_type: "deposit",
      raw_transaction_type: "submit",
      manifest_id: "lido",
      staking_method: "liquid",
      contract_address: LIDO_STETH.toLowerCase(),
      output_currency: "stETH",
      flow: "stake",
    });
  });

  // The case that decides why the manifest gates and the call data does not: this same
  // selector is a staking entry in a vault and an ETH wrap in WETH.
  it("drops a deposit call made outside a staking app", () => {
    const mapped = toSegmentTrackEvent(
      failure(
        signEvent({
          manifestId: "uniswap",
          transaction: { family: "evm", mode: "send", data: callData(WETH_DEPOSIT) },
        }),
      ),
    );

    expect(mapped).toBeNull();
  });

  // A staking app is doing something we cannot name yet. Counting it keeps the funnel honest,
  // and the selector says what to map next.
  it("keeps an unmapped call from a staking app, marked unknown", () => {
    const mapped = toSegmentTrackEvent(
      failure(
        signEvent({
          manifestId: "kiln-staking",
          transaction: { family: "evm", mode: "send", data: callData(UNMAPPED) },
        }),
      ),
    );

    expect(mapped!.properties).toMatchObject({
      transaction_type: "unknown",
      raw_transaction_type: "0xdeadbeef",
      manifest_id: "kiln-staking",
    });
    expect(mapped!.properties).not.toHaveProperty("staking_method");
  });

  it("still drops a plain send that no staking app started", () => {
    const mapped = toSegmentTrackEvent(
      failure(signEvent({ transaction: { family: "evm", mode: "send" } })),
    );

    expect(mapped).toBeNull();
  });

  it("does not emit for the Earn live app, which reports its own", () => {
    const mapped = toSegmentTrackEvent(
      failure(
        signEvent({
          manifestId: "earn",
          transaction: { family: "evm", mode: "send", data: callData(STAKE_NO_ARGS) },
        }),
      ),
    );

    expect(mapped).toBeNull();
  });
});

describe("carrying the contract to the broadcast stage", () => {
  const signedOperation = (op: Record<string, unknown>) =>
    ({ signature: "0xsig", operation: op }) as unknown as SignedOperation;

  /**
   * Broadcast is where successes are reported, and the contract is only legible at sign. If it
   * does not survive the hop, every successful stake loses `contract_address`,
   * `output_currency` and — for Kiln, whose manifest serves two products — its method.
   */
  it("keeps the contract, token and method on a success", () => {
    const signed = signedOperation({ type: "OUT", extra: {} });
    rememberSignContext(
      signed,
      "evm",
      {
        family: "evm",
        mode: "send",
        recipient: KILN_PSETH,
        data: callData(LIDO_SUBMIT),
      },
      "kiln-staking",
    );

    const broadcast = buildBroadcastCommonEvent({
      account: ethereum,
      mainAccount: ethereum,
      pathway: TransactionPathway.Dapp,
      manifestId: "kiln-staking",
      signedOperation: signed,
    });

    expect(broadcast).toMatchObject({
      earnTransactionType: "deposit",
      dappContract: KILN_PSETH.toLowerCase(),
      outputCurrency: "psETH",
      stakingMethod: "pooling",
    });
  });

  // Without the contract the manifest cannot name Kiln's product, so an absent contract must
  // leave the method absent rather than fall back to something plausible.
  it("reports no method at broadcast when nothing was correlated", () => {
    const orphan = signedOperation({ type: "OUT", extra: {} });

    const broadcast = buildBroadcastCommonEvent({
      account: ethereum,
      mainAccount: ethereum,
      pathway: TransactionPathway.Dapp,
      manifestId: "kiln-staking",
      signedOperation: orphan,
    });

    expect(broadcast.dappContract).toBeUndefined();
    expect(broadcast.outputCurrency).toBeUndefined();
    expect(broadcast.stakingMethod).toBeUndefined();
  });
});

describe("reading call data in either shape", () => {
  // A serialised transaction carries `data` as a hex string. Treating it as a Buffer produced
  // `0x0x095ea7` — a plausible-looking selector that is not one.
  it("reads a hex string as well as a Buffer", () => {
    const asString = signEvent({
      manifestId: "lido",
      transaction: { family: "evm", mode: "send", recipient: LIDO_STETH, data: LIDO_SUBMIT },
    });

    expect(asString).toMatchObject({
      earnTransactionType: "deposit",
      rawTransactionType: "submit",
    });
  });

  it("reads a hex string with no 0x prefix", () => {
    const bare = signEvent({
      manifestId: "lido",
      transaction: { family: "evm", mode: "send", data: LIDO_SUBMIT.slice(2) },
    });

    expect(bare.rawTransactionType).toBe("submit");
  });

  it.each([["0x"], [""], ["0x12"], ["zzzzzzzz"]])("claims nothing for %p", bad => {
    const junk = signEvent({
      manifestId: "lido",
      transaction: { family: "evm", mode: "send", data: bad },
    });

    expect(junk.earnTransactionType).toBeUndefined();
    expect(junk.rawTransactionType).toBe("send");
  });
});

describe("the gate rejects inherited property names", () => {
  // `in` and a bare index answer for these, which would open the gate and, worse, report
  // `Object.prototype.toString` as a staking method.
  it.each(["toString", "constructor", "hasOwnProperty", "__proto__"])(
    "%s is not a staking app",
    name => {
      expect(isStakingApp(name)).toBe(false);
      expect(stakingMethodOf(name)).toBeUndefined();
    },
  );
});

describe("classifying at broadcast with no sign context", () => {
  /**
   * The generic coin framework copies the transaction onto the operation: `recipients` is its
   * recipient and `transactionRaw.data` its call data, as a bare hex string with no `0x`.
   *
   * This is the route correlation cannot serve — a signed operation serialised across the
   * wallet-api webview boundary loses object identity, and successes are reported here.
   */
  const broadcastOnly = (raw: Record<string, unknown>, recipients: string[], manifestId?: string) =>
    buildBroadcastCommonEvent({
      account: ethereum,
      mainAccount: ethereum,
      pathway: TransactionPathway.Dapp,
      manifestId,
      signedOperation: {
        signature: "0xsig",
        operation: { type: "OUT", extra: {}, recipients, transactionRaw: raw },
      } as unknown as SignedOperation,
    });

  it("reads the action, contract and token off the operation", () => {
    const common = broadcastOnly(
      { mode: "send", data: LIDO_SUBMIT.slice(2) },
      [LIDO_STETH],
      "lido",
    );

    expect(common).toMatchObject({
      earnTransactionType: "deposit",
      rawTransactionType: "submit",
      dappContract: LIDO_STETH.toLowerCase(),
      outputCurrency: "stETH",
      stakingMethod: "liquid",
      dataSource: "broadcast",
    });
  });

  // Kiln's two products share a manifest, so without the contract a success could not say
  // which one it was — the case that made carrying state necessary in the first place.
  it("names Kiln's product from the operation alone", () => {
    const common = broadcastOnly(
      { mode: "send", data: LIDO_SUBMIT.slice(2) },
      [KILN_PSETH],
      "kiln-staking",
    );

    expect(common).toMatchObject({ stakingMethod: "pooling", outputCurrency: "psETH" });
  });

  it("claims nothing for a contract call outside a staking app", () => {
    const common = broadcastOnly({ mode: "send", data: WETH_DEPOSIT.slice(2) }, [LIDO_STETH]);

    expect(common.earnTransactionType).toBeUndefined();
    expect(common.dappContract).toBeUndefined();
  });

  // A plain send's recipient is the user's own payee. It must never surface as a contract.
  it("never reports a recipient when there is no call data", () => {
    const common = broadcastOnly({ mode: "send" }, ["0xsomeone"], "lido");

    expect(common.dappContract).toBeUndefined();
    expect(common.rawTransactionType).toBe("OUT");
  });

  it("still falls back to the operation type when transactionRaw is absent", () => {
    const common = buildBroadcastCommonEvent({
      account: ethereum,
      mainAccount: ethereum,
      pathway: TransactionPathway.Dapp,
      manifestId: "lido",
      signedOperation: {
        signature: "0xsig",
        operation: { type: "OUT", extra: {} },
      } as unknown as SignedOperation,
    });

    expect(common.rawTransactionType).toBe("OUT");
    expect(common.dappContract).toBeUndefined();
  });
});
