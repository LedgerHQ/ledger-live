import BigNumber from "bignumber.js";
import { Account, StakingResources } from "@ledgerhq/types-live";
import { Scenario, ScenarioTransaction } from "@ledgerhq/coin-tester/main";
import type { BridgeStrategy } from "@ledgerhq/coin-tester/types";
import { formatCurrencyUnit, parseCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import {
  CosmosAccount,
  CosmosCurrencyConfig,
  CosmosOperationExtra,
} from "@ledgerhq/coin-cosmos/types/index";
import { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { makeAccount } from "../fixtures";
import { buildSigner } from "../signer";
import { getBridges } from "../helpers";

type CosmosScenarioTransaction = ScenarioTransaction<GenericTransaction, Account>;

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
): Scenario<GenericTransaction, Account> {
  const { name, currency, hrp, delegateLabel, spawn, kill, retryInterval, retryLimit } = options;
  const unit = currency.units[0];

  // Populated in setup() before getTransactions() runs. Closure-scoped per
  // scenario, so two scenarios never share state.
  let recipientAddress = "";
  let validatorAddress = "";

  /** The subset of delegation-shaped fields both `CosmosResources` and the generic
   * framework's `StakingResources` agree on (only `status`'s literal union differs). */
  interface StakingView {
    delegations: Array<{ validatorAddress: string; amount: BigNumber }>;
    delegatedBalance: BigNumber;
  }

  /**
   * Legacy exposes `cosmosResources`, generic-adapter `stakingResources` (untyped on Account —
   * genericGetAccountShape sets it directly), so each is read behind a cast.
   */
  const getStakingView = (account: Account, strategy: BridgeStrategy): StakingView | undefined =>
    strategy === "legacy"
      ? (account as CosmosAccount).cosmosResources
      : (account as Account & { stakingResources?: StakingResources }).stakingResources;

  const getTransactions = (
    _address: string,
    strategy: BridgeStrategy,
  ): CosmosScenarioTransaction[] => [
    {
      name: `Send 1 ${currency.ticker}`,
      family: "cosmos",
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
      family: "cosmos",
      mode: "delegate",
      // Delegate reads transaction.amount (unlike undelegate/redelegate, which read
      // validators[].amount); genericToCosmosTransaction sets both — see bridges.ts.
      valAddress: validatorAddress,
      amount: parseCurrencyUnit(unit, "100"),
      expect: (previousAccount, currentAccount) => {
        const [latestOperation] = currentAccount.operations;
        expect(currentAccount.operations.length - previousAccount.operations.length).toBe(1);
        expect(latestOperation.type).toBe("DELEGATE");
        // op.value for DELEGATE is just the fee — principal is bonded, not spent.
        expect(latestOperation.value.toFixed()).toBe(latestOperation.fee.toFixed());
        // The retry budget lets the delegation land (immediate on Hub, next epoch on Babylon).
        const staking = getStakingView(currentAccount, strategy);
        expect(staking).toBeDefined();
        expect(staking!.delegations.some(d => d.validatorAddress === validatorAddress)).toBe(true);
        expect(staking!.delegatedBalance.toFixed()).toBe(parseCurrencyUnit(unit, "100").toFixed());
        // Legacy's operation.extra carries cosmos's `validators` array; the generic framework's
        // adaptCoreOperationToLiveOperation only forwards a singular `stake` field (see
        // listOperations.ts's toOperation, which mirrors validators[0] into details.stake for it).
        const stakeTarget =
          strategy === "legacy"
            ? (latestOperation.extra as CosmosOperationExtra).validators?.[0]
            : (latestOperation.extra as { stake?: { address: string; amount: BigNumber } }).stake;
        expect(stakeTarget?.address).toBe(validatorAddress);
        expect(stakeTarget?.amount.toFixed()).toBe(parseCurrencyUnit(unit, "100").toFixed());
      },
    },
    {
      name: "Claim rewards",
      family: "cosmos",
      mode: "claimReward",
      valAddress: validatorAddress,
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

    setup: async strategy => {
      const signer = await buildSigner();

      // generic-adapter reads its config from LiveConfig; harmless for the legacy
      // arm (which gets coinConfig directly via getBridges below).
      // Merge into the existing schema instead of replacing it: sibling scenarii (Babylon/Cosmos)
      // run in the same Jest worker and each register their own currency key.
      LiveConfig.setConfig({
        ...LiveConfig.instance.config,
        [`config_currency_${currency.id}`]: { type: "object" as const, default: coinConfig },
      });

      const { accountBridge, currencyBridge, getAddress } = await getBridges(
        strategy,
        signer,
        coinConfig,
      );

      // Derive the dev account from the (random) seed BEFORE the chain boots, then
      // hand its address to the devnet so genesis pre-funds exactly that account.
      // entrypoint.sh reads DEV_ADDRESS from the environment via docker-compose.
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
        // Typed on the broad `Account`: legacy sets `cosmosResources`, generic-adapter
        // `stakingResources`, so no single family type fits both — getStakingView reads the right one.
        accountBridge,
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
