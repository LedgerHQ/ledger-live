import {
  LAST_SYNC_THRESHOLD_IN_DAYS,
  NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE,
  SECONDS_IN_DAY,
} from "@ledgerhq/live-common/families/internet_computer/consts";
import type { ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";
import { fireEvent, render, screen } from "@tests/test-renderer";
import BigNumber from "bignumber.js";
import React from "react";
import { NavigatorName, ScreenName } from "~/const";
import AccountBodyHeader from "../AccountBodyHeader";
import { makeHealthyNeuron, makeICPAccount, makeNeuron } from "./testUtils";

let flagEnabled = true;
const mockNavigate = jest.fn();

jest.mock("@features/platform-feature-flags", () => ({
  useFeature: () => ({ enabled: flagEnabled }),
}));
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const ENOUGH_TO_STAKE = new BigNumber(100_010_000);

const renderBanner = (
  neurons: ICPNeuron[],
  { spendableBalance = ENOUGH_TO_STAKE, lastUpdatedMSecs = Date.now() } = {},
) =>
  render(
    <AccountBodyHeader account={makeICPAccount({ neurons, spendableBalance, lastUpdatedMSecs })} />,
  );

// Matched exactly: the stakeICP description opens with the same words as its CTA.
const pressCta = (cta: string) => fireEvent.press(screen.getByText(cta, { exact: true }));

describe("ICP stake banner", () => {
  beforeEach(() => {
    flagEnabled = true;
    mockNavigate.mockClear();
  });

  it("stays hidden while the staking flag is off", () => {
    flagEnabled = false;

    expect(renderBanner([]).toJSON()).toBeNull();
  });

  it("stays hidden for a token account", () => {
    const tokenAccount = { type: "TokenAccount" } as never;

    expect(render(<AccountBodyHeader account={tokenAccount} />).toJSON()).toBeNull();
  });

  // `neurons` is typed as required but only a sync or a deserialize populates it, so a just-added
  // account reaches the account page without it — and getBannerState destructures it.
  it("survives an account whose neurons have not been synced yet", () => {
    const unsynced = { ...makeICPAccount({ spendableBalance: ENOUGH_TO_STAKE }) } as {
      neurons?: unknown;
    };
    delete unsynced.neurons;

    expect(() => render(<AccountBodyHeader account={unsynced as never} />)).not.toThrow();
    expect(screen.getByText("Stake ICP", { exact: true })).toBeVisible();
  });

  it("stays hidden when the balance cannot afford a first neuron", () => {
    expect(renderBanner([], { spendableBalance: new BigNumber(1) }).toJSON()).toBeNull();
  });

  it("stays hidden once every neuron is healthy", () => {
    expect(renderBanner([makeHealthyNeuron()]).toJSON()).toBeNull();
  });

  it("invites a first stake when the account can afford one", () => {
    renderBanner([]);
    pressCta("Stake ICP");

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.InternetComputerStakingFlow, {
      screen: ScreenName.InternetComputerStakingStarted,
      params: expect.objectContaining({ accountId: expect.any(String) }),
    });
  });

  it("asks for a refresh when the neuron snapshot has gone stale", () => {
    const staleBy = (LAST_SYNC_THRESHOLD_IN_DAYS + 1) * SECONDS_IN_DAY * 1000;
    renderBanner([makeHealthyNeuron()], { lastUpdatedMSecs: Date.now() - staleBy });

    expect(screen.getByText(/out of date/, { exact: false })).toBeVisible();
  });

  it("sends a decaying neuron straight to the confirmation list, not the neuron list", () => {
    renderBanner([
      makeHealthyNeuron({
        votingPowerRefreshedTimestampSeconds: BigInt(
          Math.floor(Date.now() / 1000) - 195 * SECONDS_IN_DAY,
        ),
      }),
    ]);
    pressCta("Confirm following");

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.InternetComputerNeuronManageFlow, {
      screen: ScreenName.InternetComputerNeuronRefreshVotingPower,
      params: expect.objectContaining({ accountId: expect.any(String) }),
    });
  });

  it("prompts a longer dissolve delay when a neuron cannot vote yet", () => {
    renderBanner([makeHealthyNeuron({ dissolveDelaySeconds: BigInt(SECONDS_IN_DAY) })]);
    pressCta("Manage neurons");

    expect(screen.getByText(/longer dissolve delay/, { exact: false })).toBeVisible();
    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.InternetComputerNeuronManageFlow, {
      screen: ScreenName.InternetComputerNeuronList,
      params: expect.objectContaining({ accountId: expect.any(String) }),
    });
  });

  it("prompts following when a voting-eligible neuron follows nobody", () => {
    renderBanner([
      makeNeuron({
        dissolveDelaySeconds: BigInt(NNS_MINIMUM_DISSOLVE_DELAY_TO_VOTE),
        followees: [],
        votingPowerRefreshedTimestampSeconds: BigInt(Math.floor(Date.now() / 1000)),
      }),
    ]);

    expect(screen.getByText(/Follow other neurons/, { exact: false })).toBeVisible();
  });
});
