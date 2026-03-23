import React from "react";
import { render, screen } from "tests/testSetup";
import StakeBanner from "../StakeBanner";
import { createMockMinaAccount, createDelegatingMinaAccount } from "./testUtils";
import { track } from "~/renderer/analytics/segment";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

jest.mock("~/renderer/analytics/segment");

jest.mock("@ledgerhq/live-common/featureFlags/useFeature");
const mockUseFeature = jest.mocked(useFeature);

jest.mock("~/renderer/hooks/useGetStakeLabelLocaleBased", () => ({
  useGetStakeLabelLocaleBased: () => "Earn",
}));

describe("StakeBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFeature.mockReturnValue({ enabled: true } as ReturnType<typeof useFeature>);
  });

  it("renders nothing when stakeAccountBanner feature flag is disabled", () => {
    mockUseFeature.mockReturnValue(null as unknown as ReturnType<typeof useFeature>);

    const account = createMockMinaAccount();
    const { container } = render(<StakeBanner account={account} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the banner with stake CTA when account has no delegation", () => {
    const account = createMockMinaAccount();

    render(<StakeBanner account={account} />);

    expect(screen.getByTestId("account-stake-banner")).toBeInTheDocument();
  });

  it("renders the banner with change delegation CTA when account has active delegation", () => {
    const account = createDelegatingMinaAccount();

    render(<StakeBanner account={account} />);

    expect(screen.getByTestId("account-stake-banner")).toBeInTheDocument();
  });

  it("renders different title for non-delegating account", () => {
    const account = createMockMinaAccount();

    render(<StakeBanner account={account} />);

    expect(screen.getByText("Earn rewards with MINA")).toBeInTheDocument();
  });

  it("renders different title for delegating account", () => {
    const account = createDelegatingMinaAccount();

    render(<StakeBanner account={account} />);

    expect(screen.getByText("Manage your MINA delegation")).toBeInTheDocument();
  });

  it("tracks analytics when CTA is clicked for non-delegating account", async () => {
    const account = createMockMinaAccount();
    const { user } = render(<StakeBanner account={account} />);

    const ctaButton = screen.getByTestId("account-stake-banner-button");
    await user.click(ctaButton);

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        delegation: "stake",
        button: "delegate",
        currency: "MINA",
      }),
    );
  });

  it("tracks manage_delegation when CTA is clicked for delegating account", async () => {
    const account = createDelegatingMinaAccount();
    const { user } = render(<StakeBanner account={account} />);

    const ctaButton = screen.getByTestId("account-stake-banner-button");
    await user.click(ctaButton);

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({
        delegation: "manage_delegation",
        button: "manage",
        currency: "MINA",
      }),
    );
  });
});
