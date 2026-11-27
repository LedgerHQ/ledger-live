import BigNumber from "bignumber.js";
import type { Request } from "@playwright/test";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import {
  buildSolanaStake,
  buildStakesV3Response,
  buildValidatorsSummary,
  type EarnStakeId,
} from "@ledgerhq/live-e2e-shared/earnPositions";
import type { PageHolder } from "tests/page/abstractClasses";
import type { StakePositionFigures } from "tests/page/dialog/stakePosition.dialog";
import { fulfillNetworkRoute } from "tests/utils/networkUtils";
import type { ActiveSolanaStakePosition } from "tests/utils/stakePositionUtils";

// Matched by path, since the build bakes in the Earn host. The coin module reads the validators
// summary from another host for its validator list, and the mocked entries suit it too. The dialog
// does not read it: the rate it shows is the `interest` of the stake row.
const STAKES_URL = "**/v3/stakes";
const VALIDATORS_SUMMARY_URL = "**/figment/solana/validators_summary";

const VALIDATOR_NAME = "E2E mocked validator";
/** The rate of the position, shown by the dialog. */
const POSITION_APY = 0.0781;
const POSITION_APY_BADGE = "7.81% APY";
/** The rate of the validator in the summary. It differs from the one above on purpose: the dialog must not show it. */
const VALIDATOR_SUMMARY_APY = 0.0912;
/** The rewards are a twentieth of the delegated amount, and the rest is the initial deposit. */
const REWARDS_DIVISOR = 20;

type RouteStakesOptions = {
  position: ActiveSolanaStakePosition;
  isFailing: () => boolean;
};

function amountsOf({ amount }: ActiveSolanaStakePosition) {
  const balance = new BigNumber(amount);
  const rewards = balance.idiv(REWARDS_DIVISOR);
  return {
    balance: balance.toFixed(),
    deposited: balance.minus(rewards).toFixed(),
    rewards: rewards.toFixed(),
  };
}

function figuresOf(position: ActiveSolanaStakePosition): StakePositionFigures {
  const { balance, deposited, rewards } = amountsOf(position);
  const format = (baseUnits: string) =>
    formatCurrencyUnit(position.unit, new BigNumber(baseUnits), { showCode: true });
  return {
    totalRewards: format(rewards),
    currentBalance: format(balance),
    initialDeposit: format(deposited),
    apyBadge: POSITION_APY_BADGE,
    status: "Active",
    validatorName: VALIDATOR_NAME,
  };
}

const isStakeId = (value: unknown): value is EarnStakeId =>
  typeof value === "object" &&
  value !== null &&
  "network" in value &&
  typeof value.network === "string" &&
  "address" in value &&
  typeof value.address === "string";

/** One row per requested address, like the backend: the position for its owner, none otherwise. */
function stakesAnswerFor(request: Request, position: ActiveSolanaStakePosition) {
  const body: unknown = request.postDataJSON();
  const stake = buildSolanaStake({
    stakeAccount: position.positionId,
    validatorAddress: position.validatorAddress,
    validatorName: VALIDATOR_NAME,
    status: "activated",
    apy: POSITION_APY,
    ...amountsOf(position),
  });
  return buildStakesV3Response(
    (Array.isArray(body) ? body.filter(isStakeId) : [])
      .filter(
        ({ network, address }) => network === position.network && address === position.ownerAddress,
      )
      .map(({ network, address }) => ({ id: { network, address }, stake })),
  );
}

async function routeStakes(pageHolder: PageHolder, options: RouteStakesOptions) {
  const { position, isFailing } = options;
  await fulfillNetworkRoute(pageHolder, {
    url: STAKES_URL,
    respond: request =>
      isFailing()
        ? { status: 500, json: { message: "Internal Server Error" } }
        : { status: 200, json: stakesAnswerFor(request, position) },
  });
}

/**
 * Serves the validator list that the coin module reads, with the validator of the position as the only
 * entry. The dialog ignores it, so its rate differs from the one of the position on purpose.
 */
export async function mockSolanaValidatorsSummary(
  pageHolder: PageHolder,
  position: ActiveSolanaStakePosition,
) {
  const summary = buildValidatorsSummary([
    { voteAccount: position.validatorAddress, apy: VALIDATOR_SUMMARY_APY, name: VALIDATOR_NAME },
  ]);
  await fulfillNetworkRoute(pageHolder, {
    url: VALIDATORS_SUMMARY_URL,
    respond: () => ({ status: 200, json: summary }),
  });
}

/** Serves the position with its own rate, and returns the figures the details then show. */
export async function mockEarnPositions(
  pageHolder: PageHolder,
  position: ActiveSolanaStakePosition,
): Promise<StakePositionFigures> {
  await mockSolanaValidatorsSummary(pageHolder, position);
  await routeStakes(pageHolder, { position, isFailing: () => false });
  return figuresOf(position);
}

/** Like `mockEarnPositions`, but every `/v3/stakes` read, retries included, fails until `recover`. */
export async function mockEarnPositionsFailure(
  pageHolder: PageHolder,
  position: ActiveSolanaStakePosition,
) {
  let isFailing = true;
  await mockSolanaValidatorsSummary(pageHolder, position);
  await routeStakes(pageHolder, { position, isFailing: () => isFailing });
  return {
    figures: figuresOf(position),
    recover: () => {
      isFailing = false;
    },
  };
}
