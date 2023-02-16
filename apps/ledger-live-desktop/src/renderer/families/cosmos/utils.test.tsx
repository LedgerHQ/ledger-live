import { getAccountBannerProps } from "~/renderer/families/cosmos/utils";
import { AccountBannerState } from "@ledgerhq/live-common/families/cosmos/banner";
import { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";
import { Hooks } from "~/renderer/screens/account/useGetBannerProps";

describe("getAccountBannerProps", () => {
  it("should hide the banner when state.display is false", () => {
    const props = getAccountBannerProps(
      { display: false } as AccountBannerState,
      {} as CosmosAccount,
      {} as Hooks,
    );
    expect(props.display).toBe(false);
  });

  it("should hide the redelegation banner with comsos when feature flag is missing", () => {
    const props = getAccountBannerProps(
      { display: true, redelegate: true } as AccountBannerState,
      {} as CosmosAccount,
      { stakeAccountBannerParams: { cosmos: undefined } } as Hooks,
    );
    expect(props.display).toBe(false);
  });

  it("should hide the delegation banner with comsos when feature flag is missing", () => {
    const props = getAccountBannerProps(
      { display: true, redelegate: false } as AccountBannerState,
      {} as CosmosAccount,
      { stakeAccountBannerParams: { cosmos: undefined } } as Hooks,
    );
    expect(props.display).toBe(false);
  });

  it("should hide the delegation banner with comsos when disabled via the feature flag", () => {
    const props = getAccountBannerProps(
      { display: true, redelegate: false } as AccountBannerState,
      {} as CosmosAccount,
      { stakeAccountBannerParams: { cosmos: { delegate: false } } } as Hooks,
    );
    expect(props.display).toBe(false);
  });

  it("should hide the redelegation banner with comsos when disabled via the feature flag", () => {
    const props = getAccountBannerProps(
      { display: true, redelegate: true } as AccountBannerState,
      {} as CosmosAccount,
      { stakeAccountBannerParams: { cosmos: { redelegate: false } } } as Hooks,
    );
    expect(props.display).toBe(false);
  });

  it("shows the delegation banner props", () => {
    const props = getAccountBannerProps(
      { display: true, redelegate: false } as AccountBannerState,
      { currency: { ticker: "currency-ticker" } } as CosmosAccount,
      {
        t: (input: string) => input,
        stakeAccountBannerParams: { cosmos: { delegate: true } },
      } as Hooks,
    );
    if (!props.display) throw new Error("display should be true");
    expect(props.title).toBe("account.banner.delegation.title");
    expect(props.description).toBe("account.banner.delegation.description");
    expect(props.cta).toBe("account.banner.delegation.cta");
  });

  it("shows the redelegation banner props", () => {
    const props = getAccountBannerProps(
      { display: true, redelegate: true } as AccountBannerState,
      { currency: { ticker: "currency-ticker" } } as CosmosAccount,
      {
        t: (input: string) => input,
        stakeAccountBannerParams: { cosmos: { redelegate: true } },
      } as Hooks,
    );
    if (!props.display) throw new Error("display should be true");
    expect(props.title).toBe("account.banner.redelegation.title");
    expect(props.description).toBe("account.banner.redelegation.description");
    expect(props.cta).toBe("account.banner.redelegation.cta");
  });
});
