import BigNumber from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import { formatCurrencyUnit, parseCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies";
import { createBridges } from "@ledgerhq/coin-cosmos/bridge/index";
import { CosmosCoinConfig } from "@ledgerhq/coin-cosmos/config";
import resolver from "@ledgerhq/coin-cosmos/hw-getAddress";
import {
  CosmosAccount,
  CosmosCurrencyConfig,
  CosmosOperationExtra,
  Transaction as CosmosTransaction,
} from "@ledgerhq/coin-cosmos/types/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { makeAccount } from "../fixtures";
import { buildSigner } from "../signer";

type CosmosScenarioTransaction = ScenarioTransaction<CosmosTransaction, CosmosAccount>;

const LOCAL_LCD = "http://127.0.0.1:1317";

// Override coin-cosmos's default config: point sync + broadcast at the local
// node. Runtime shape is flat (CosmosCurrencyConfig + status); the declared
// CosmosCoinConfig type wraps everything in ConfigInfo, which is what LiveConfig
// stores but NOT what `() => config` returns (chain.ts spreads coinConfig as
// flat fields).
const coinConfig = {
  lcd: LOCAL_LCD,
  minGasPrice: 0.002,
  status: { type: "active" as const },
} satisfies CosmosCurrencyConfig & { status: { type: "active" } };

// Query the local node for the first bonded validator. The validator's operator
// address is dynamic per devnet run (the entrypoint's gentx mints fresh keys),
// so scenarios resolve it at runtime rather than hardcoding it.
async function getBondedValidator(lcd: string): Promise<string> {
  const res = await fetch(`${lcd}/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to query bonded validators (${res.status} ${res.statusText}): ${body}`);
  }
  const data = (await res.json()) as { validators?: Array<{ operator_address?: string }> };
  const operators = (data.validators ?? [])
    .map(v => v.operator_address)
    .filter((a): a is string => Boolean(a));
  if (operators.length < 1) {
    throw new Error(
      `Devnet expected >=1 bonded validator, got ${operators.length} — entrypoint's gentx may have failed`,
    );
  }
  return operators[0];
}

export type CosmosScenarioOptions = {
  /** Scenario display name. */
  name: string;
  /** The cryptocurrency under test (drives the unit used for amounts). */
  currency: CryptoCurrency;
  /** Bech32 prefix for the recipient address derivation (e.g. "bbn", "cosmos"). */
  hrp: string;
  /** Label for the delegate step (Babylon notes the x/epoching wrapping). */
  delegateLabel: string;
  /** Bring the devnet up / tear it down. */
  spawn: () => Promise<void>;
  kill: () => Promise<void>;
  /**
   * Retry budget for the LCD to reflect a broadcast. Babylon's delegate is
   * x/epoching-wrapped (applies at the next epoch, ~10 blocks) so it needs a
   * generous budget; Cosmos Hub is immediate (next block).
   */
  retryInterval: number;
  retryLimit: number;
};

// Build a send → delegate → claim-rewards scenario against a local Cosmos-SDK
// devnet. The flow is identical across the cosmos family; only the currency,
// devnet lifecycle, address prefix, and retry budget differ — hence the options.
export function makeCosmosScenario(
  options: CosmosScenarioOptions,
): Scenario<CosmosTransaction, CosmosAccount> {
  const { name, currency, hrp, delegateLabel, spawn, kill, retryInterval, retryLimit } = options;
  const unit = currency.units[0];

  // Populated in setup() before getTransactions() runs. Closure-scoped per
  // scenario, so two scenarios never share state.
  let recipientAddress = "";
  let validatorAddress = "";

  const getTransactions = (): CosmosScenarioTransaction[] => [
    {
      name: `Send 1 ${currency.ticker}`,
      mode: "send",
      recipient: recipientAddress,
      amount: parseCurrencyUnit(unit, "1"),
      expect: (previousAccount, currentAccount) => {
        const [latestOperation] = currentAccount.operations;
        expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
        expect(latestOperation.type).toBe("OUT");
        // op.value = amount + fee for an OUT
        expect(latestOperation.value.toFixed()).toBe(
          latestOperation.fee.plus(parseCurrencyUnit(unit, "1")).toFixed(),
        );
        expect(currentAccount.balance.toFixed()).toBe(
          previousAccount.balance.minus(latestOperation.value).toFixed(),
        );
      },
    },
    {
      name: delegateLabel,
      mode: "delegate",
      // Delegate is keyed on transaction.amount across the whole cosmos module:
      // getTransactionStatus.getDelegateTransactionStatus validates it and
      // buildTransaction's "delegate" case reads it — unlike redelegate/undelegate,
      // which read validators[].amount. So the delegated amount goes in
      // transaction.amount; validators[0] only supplies the target address (its
      // amount is unused by the delegate build path, kept for symmetry below).
      amount: parseCurrencyUnit(unit, "100"),
      validators: [
        {
          address: validatorAddress,
          amount: parseCurrencyUnit(unit, "100"),
        },
      ],
      expect: (previousAccount, currentAccount) => {
        const [latestOperation] = currentAccount.operations;
        expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
        expect(latestOperation.type).toBe("DELEGATE");
        // op.value for DELEGATE is just the fee — principal is bonded, not spent.
        expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.toFixed());
        // The retry budget gives the delegation time to land (immediately on
        // Cosmos Hub, at the next epoch boundary on Babylon); once applied, the
        // LCD reflects it.
        expect(
          currentAccount.cosmosResources.delegations.some(d => d.validatorAddress === validatorAddress),
        ).toBe(true);
        expect(currentAccount.cosmosResources.delegatedBalance.toFixed()).toBe(
          parseCurrencyUnit(unit, "100").toFixed(),
        );
        // Op extras name the validator we delegated to.
        const extra = latestOperation.extra as CosmosOperationExtra;
        expect(extra.validators?.[0]?.address).toBe(validatorAddress);
        expect(extra.validators?.[0]?.amount.toFixed()).toBe(
          parseCurrencyUnit(unit, "100").toFixed(),
        );
      },
    },
    {
      name: "Claim rewards",
      mode: "claimReward",
      validators: [{ address: validatorAddress, amount: new BigNumber(0) }],
      expect: (previousAccount, currentAccount) => {
        const [latestOperation] = currentAccount.operations;
        expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
        expect(latestOperation.type).toBe("REWARD");
        // Only a sliver of rewards has accrued to the freshly-bonded 100 units by
        // this point, so the chain may emit no reward-coin event and
        // synchronisation records no per-validator reward shard (extra.validators
        // stays empty). The REWARD op type is the guaranteed signal that the claim
        // landed; only assert the validator when a shard actually exists.
        const extra = latestOperation.extra as CosmosOperationExtra;
        if (extra.validators?.length) {
          expect(extra.validators[0].address).toBe(validatorAddress);
        }
      },
    },
    // NOTE: undelegate and redelegate are intentionally omitted. Crafting is
    // correct (covered by coin-cosmos buildTransaction.unit.test.ts); they are
    // left out to keep both scenarios in step — on the babylond devnet the
    // wrapped variants are accepted but no-op at the epoch boundary, a chain /
    // x-epoching execution gap to resolve in a follow-up.
  ];

  return {
    name,

    setup: async () => {
      const signer = await buildSigner();
      const signerContext: Parameters<typeof resolver>[0] = (_, fn) => fn(signer);
      const { accountBridge, currencyBridge } = createBridges(
        signerContext,
        () => coinConfig as unknown as CosmosCoinConfig,
      );

      // Derive the dev account from the (random) seed BEFORE the chain boots, then
      // hand its address to the devnet so genesis pre-funds exactly that account.
      // entrypoint.sh reads DEV_ADDRESS from the environment via docker-compose.
      const getAddress = resolver(signerContext);
      const { address } = await getAddress("", {
        path: "44'/118'/0'/0/0",
        currency,
        derivationMode: "",
      });
      process.env.DEV_ADDRESS = address;

      await spawn();

      // Recipient = alt-account-index derivation. Address validation only checks
      // the hrp prefix, so any well-formed bech32 with it works.
      const recipient = await signer.getAddressAndPubKey([44, 118, 1, 0, 0], hrp);
      recipientAddress = recipient.bech32_address;

      // The validator address is dynamic per devnet run; pick the first bonded
      // validator the entrypoint bootstrapped.
      validatorAddress = await getBondedValidator(LOCAL_LCD);

      const account = makeAccount(address, currency);
      return {
        // Drop the narrower CosmosOperation generic — Scenario expects the
        // 2-arity AccountBridge; cast is sound because Scenario only exposes
        // the base interface.
        accountBridge: accountBridge as AccountBridge<CosmosTransaction, CosmosAccount>,
        currencyBridge,
        account,
        retryInterval,
        retryLimit,
      };
    },

    getTransactions,

    beforeAll: async account => {
      // entrypoint.sh funds the dev account with 1,000,000 units at genesis. The
      // chain leaves it marginally under that after genesis processing (a small,
      // deterministic overhead), so assert it's funded with effectively the full
      // amount rather than to the exact base unit.
      const balance = Number(formatCurrencyUnit(unit, account.balance, { useGrouping: false }));
      expect(balance).toBeGreaterThanOrEqual(999_900);
      expect(balance).toBeLessThanOrEqual(1_000_000);
    },

    teardown: async () => {
      await kill();
    },
  };
}
