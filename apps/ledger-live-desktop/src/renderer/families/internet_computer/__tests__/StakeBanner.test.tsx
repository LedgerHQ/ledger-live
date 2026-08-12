import BigNumber from "bignumber.js";
import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { makeICPAccount, makeNeuron } from "./testUtils";

const bridgeMock = {
  createTransaction: jest.fn(() => ({ family: "internet_computer", type: "send" })),
  updateTransaction: jest.fn((transaction, patch) => ({ ...transaction, ...patch })),
};

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  __esModule: true,
  useAccountBridge: () => bridgeMock,
}));

import StakeBanner from "../StakeBanner";

// MIN_NEURON_STAKE (1 ICP) + ICP_FEES
const ENOUGH_TO_STAKE = new BigNumber(100_010_000);
const NOT_ENOUGH_TO_STAKE = new BigNumber(100_009_999);

// The banner needs both switches: the shared banner flag and internet_computer being listed as a
// natively-staked currency, which is what also drives the Earn action in the account header.
const bannerOn = withFlagOverrides({
  stakeAccountBanner: { enabled: true },
  stakePrograms: { enabled: true, params: { list: ["internet_computer"], redirects: {} } },
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("StakeBanner (internet_computer)", () => {
  it("renders the banner when the account can stake and holds no neurons", () => {
    const account = makeICPAccount({ spendableBalance: ENOUGH_TO_STAKE });
    render(<StakeBanner account={account} />, { initialState: bannerOn });

    expect(screen.getByTestId("account-stake-banner")).toBeInTheDocument();
  });

  it("renders nothing when the stakeAccountBanner flag is off", () => {
    const account = makeICPAccount({ spendableBalance: ENOUGH_TO_STAKE });
    const { container } = render(<StakeBanner account={account} />, {
      initialState: withFlagOverrides({
        stakeAccountBanner: { enabled: false },
        stakePrograms: { enabled: true, params: { list: ["internet_computer"], redirects: {} } },
      }),
    });

    expect(container.firstChild).toBeNull();
  });

  // Keeps the banner in step with the header's Earn action, which AccountHeaderActions hides unless
  // the currency is listed here.
  it("renders nothing when internet_computer is absent from stakePrograms", () => {
    const account = makeICPAccount({ spendableBalance: ENOUGH_TO_STAKE });
    const { container } = render(<StakeBanner account={account} />, {
      initialState: withFlagOverrides({ stakeAccountBanner: { enabled: true } }),
    });

    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when internet_computer is redirected to a platform app", () => {
    const account = makeICPAccount({ spendableBalance: ENOUGH_TO_STAKE });
    const { container } = render(<StakeBanner account={account} />, {
      initialState: withFlagOverrides({
        stakeAccountBanner: { enabled: true },
        stakePrograms: {
          enabled: true,
          params: {
            list: ["internet_computer"],
            redirects: { internet_computer: { platform: "earn", name: "Earn", queryParams: {} } },
          },
        },
      }),
    });

    expect(container.firstChild).toBeNull();
  });

  it("renders nothing once the account has neurons", () => {
    const account = makeICPAccount({
      spendableBalance: ENOUGH_TO_STAKE,
      neurons: [makeNeuron()],
    });
    const { container } = render(<StakeBanner account={account} />, { initialState: bannerOn });

    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when the balance is one e8 below the minimum stake plus fees", () => {
    const account = makeICPAccount({ spendableBalance: NOT_ENOUGH_TO_STAKE });
    const { container } = render(<StakeBanner account={account} />, { initialState: bannerOn });

    expect(container.firstChild).toBeNull();
  });

  it("opens the send flow with a create_neuron transaction when the CTA is clicked", async () => {
    const account = makeICPAccount({ spendableBalance: ENOUGH_TO_STAKE });
    const { store, user } = render(<StakeBanner account={account} />, { initialState: bannerOn });

    await user.click(screen.getByTestId("account-stake-banner-button"));

    expect(bridgeMock.updateTransaction).toHaveBeenCalledWith(expect.anything(), {
      type: "create_neuron",
    });
    expect(store.getState().modals.MODAL_SEND?.isOpened).toBe(true);
  });
});
