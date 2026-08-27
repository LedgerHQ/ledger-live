/**
 * @jest-environment jsdom
 */
import "../../__tests__/test-helpers/dom-polyfill";
import { renderHook, waitFor } from "@testing-library/react";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { ValidatorsAppValidator } from "@ledgerhq/coin-solana/network/validator-app/index";
import type { SolanaStakingPosition } from "@ledgerhq/coin-solana/types";
import type { StakingResources } from "@ledgerhq/types-live";
import { getSolanaValidators } from "@ledgerhq/coin-solana/validators";
import BigNumber from "bignumber.js";
import * as hooks from "./react";

jest.mock("@ledgerhq/coin-solana/validators", () => ({
  getSolanaValidators: jest.fn(),
}));

const mockedGetSolanaValidators = jest.mocked(getSolanaValidators);

// the hook memoizes per currency id, so each test uses its own to stay isolated
let currencyCount = 0;
const nextCurrency = () => ({ id: `solana-${currencyCount++}` }) as CryptoCurrency;

const ledgerValidator: ValidatorsAppValidator = {
  activeStake: 100,
  commission: 7,
  totalScore: 10,
  voteAccount: "ledger-vote-account",
  name: "Ledger by Figment",
  avatarUrl: "ledger-avatar",
  wwwUrl: "ledger-url",
};

describe("solana/react", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetSolanaValidators.mockResolvedValue([ledgerValidator]);
  });

  describe("useValidators", () => {
    // the API cannot be made to fail on demand, so these branches are only reachable here
    it("returns an empty list when the very first fetch fails", async () => {
      mockedGetSolanaValidators.mockRejectedValue(new Error("validators.app is down"));
      const currency = nextCurrency();

      const { result } = renderHook(() => hooks.useValidators(currency));

      await waitFor(() => expect(mockedGetSolanaValidators).toHaveBeenCalled());
      expect(result.current).toEqual([]);
    });

    it("keeps the last known list when a later fetch fails", async () => {
      const currency = nextCurrency();

      const first = renderHook(() => hooks.useValidators(currency));
      await waitFor(() => expect(first.result.current).toEqual([ledgerValidator]));
      first.unmount();

      mockedGetSolanaValidators.mockRejectedValue(new Error("validators.app is down"));
      const second = renderHook(() => hooks.useValidators(currency));

      await waitFor(() => expect(mockedGetSolanaValidators).toHaveBeenCalledTimes(2));
      expect(second.result.current).toEqual([ledgerValidator]);
    });

    it("retries on the next mount after a failure", async () => {
      const currency = nextCurrency();

      mockedGetSolanaValidators.mockRejectedValueOnce(new Error("validators.app is down"));
      const first = renderHook(() => hooks.useValidators(currency));
      await waitFor(() => expect(mockedGetSolanaValidators).toHaveBeenCalledTimes(1));
      first.unmount();

      const second = renderHook(() => hooks.useValidators(currency));

      await waitFor(() => expect(second.result.current).toEqual([ledgerValidator]));
    });
  });

  describe("useSolanaStakesWithMeta", () => {
    const resourcesWith = (...delegations: SolanaStakingPosition[]): StakingResources => ({
      delegations: delegations as StakingResources["delegations"],
      redelegations: [],
      unbondings: [],
      delegatedBalance: new BigNumber(0),
      pendingRewardsBalance: new BigNumber(0),
      unbondingBalance: new BigNumber(0),
    });

    const stake: SolanaStakingPosition = {
      positionId: "stake-account",
      validatorAddress: "ledger-vote-account",
      amount: new BigNumber(0),
      pendingRewards: new BigNumber(0),
      status: "bonded",
    };

    it("attaches the validator metadata to each stake", async () => {
      const currency = nextCurrency();

      const { result } = renderHook(() =>
        hooks.useSolanaStakesWithMeta(currency, resourcesWith(stake)),
      );

      await waitFor(() =>
        expect(result.current).toEqual([
          {
            stake,
            meta: {
              validator: {
                img: ledgerValidator.avatarUrl,
                name: ledgerValidator.name,
                url: ledgerValidator.wwwUrl,
              },
            },
          },
        ]),
      );
    });

    it("returns the same result across renders when the resources object is unchanged", async () => {
      const currency = nextCurrency();
      const resources = resourcesWith(stake);

      const { result, rerender } = renderHook(() =>
        hooks.useSolanaStakesWithMeta(currency, resources),
      );

      // wait for the fetched validator metadata to land, otherwise the capture races the fetch
      await waitFor(() =>
        expect(result.current[0]?.meta.validator?.name).toBe(ledgerValidator.name),
      );
      const first = result.current;
      rerender();

      expect(result.current).toBe(first);
    });

    it("leaves the metadata empty for an unknown validator", async () => {
      const unknown: SolanaStakingPosition = { ...stake, validatorAddress: "unknown" };

      const currency = nextCurrency();

      const { result } = renderHook(() =>
        hooks.useSolanaStakesWithMeta(currency, resourcesWith(unknown)),
      );

      await waitFor(() => expect(result.current.length).toBe(1));
      expect(result.current).toEqual([
        {
          stake: unknown,
          meta: { validator: { img: undefined, name: undefined, url: undefined } },
        },
      ]);
    });
  });
});
