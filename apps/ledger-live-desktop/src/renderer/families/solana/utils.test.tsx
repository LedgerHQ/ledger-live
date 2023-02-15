import { getAccountBannerProps } from "~/renderer/families/solana/utils";
import { AccountBannerState } from "@ledgerhq/live-common/families/solana/banner";
import { Hooks } from "~/renderer/screens/account/useGetBannerProps";

describe("getAccountBannerProps", () => {
  it("should hide the banner when state.display is false", () => {
    const props = getAccountBannerProps({ display: false } as AccountBannerState, {}, {} as Hooks);
    expect(props.display).toBe(false);
  });

  it("should hide the  delegation banner with comsos when disabled via the feature flag", () => {
    const props = getAccountBannerProps(
      { display: true, redelegate: false } as AccountBannerState,
      {},
      { stakeAccountBannerParams: { solana: { delegate: false } } } as Hooks,
    );
    expect(props.display).toBe(false);
  });

  it("should hide the  redelegation banner with comsos when disabled via the feature flag", () => {
    const props = getAccountBannerProps(
      { display: true, redelegate: true } as AccountBannerState,
      {} as CosmosAccount,
      { stakeAccountBannerParams: { solana: { redelegate: false } } } as Hooks,
    );
    expect(props.display).toBe(false);
  });

  it("shows the delegation banner props", () => {
    const props = getAccountBannerProps(
      { display: true, redelegate: false } as AccountBannerState,
      { currency: { ticker: "currency-ticker" } },
      {
        t: (input: string) => input,
        stakeAccountBannerParams: { solana: { delegate: true } },
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
        stakeAccountBannerParams: { solana: { redelegate: true } },
      } as Hooks,
    );
    if (!props.display) throw new Error("display should be true");
    expect(props.title).toBe("account.banner.redelegation.solana.title");
    expect(props.description).toBe("account.banner.redelegation.solana.description");
    expect(props.cta).toBe("account.banner.redelegation.cta");
  });
});
