import { Account } from "@ledgerhq/types-live";
import { getAccountBannerProps } from "~/renderer/families/ethereum/utils";
import { Hooks } from "~/renderer/screens/account/useGetBannerProps";

jest.mock("~/renderer/analytics/segment", () => ({ track: jest.fn() }));

const mockHistoryPush = jest.fn();

const historyMock = ({
  push: mockHistoryPush,
} as unknown) as Hooks["history"];

const hookMocks = {
  ethStakingProviders: null,
  stakeAccountBannerParams: { eth: { kiln: true, lido: true } },
  t: (i: string) => i,
  history: historyMock,
} as Hooks;

const account = {
  id: "some-account-id",
} as Account;

describe("getAccountBannerProps", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("hides banner for kiln when feature flag is off", () => {
    const bannerProps = getAccountBannerProps(
      {
        stakeProvider: "kiln",
      },
      account,
      {
        ...hookMocks,
        stakeAccountBannerParams: { eth: { kiln: false, lido: true } },
      } as Hooks,
    );
    expect(bannerProps).toEqual({ display: false });
  });

  it("hides banner for lido when feature flag is off", () => {
    const bannerProps = getAccountBannerProps(
      {
        stakeProvider: "lido",
      },
      account,
      {
        ...hookMocks,
        stakeAccountBannerParams: { eth: { kiln: true, lido: false } },
      } as Hooks,
    );
    expect(bannerProps).toEqual({ display: false });
  });

  it("gets banner props for ethereum account below 32 ETH", () => {
    const bannerProps = getAccountBannerProps(
      {
        stakeProvider: "lido",
      },
      account,
      hookMocks,
    );
    expect(bannerProps).toEqual({
      cta: "account.banner.delegation.ethereum.lido.cta",
      description: "account.banner.delegation.ethereum.lido.description",
      display: undefined,
      linkText: "account.banner.delegation.linkText",
      linkUrl: "https://www.ledger.com/staking-ethereum",
      onClick: expect.any(Function),
      title: "account.banner.delegation.ethereum.lido.title",
    });
    if ("onClick" in bannerProps) {
      bannerProps.onClick();
    }

    expect(mockHistoryPush).toHaveBeenCalledWith({
      pathname: `/platform/lido`,
      state: { accountId: "some-account-id", returnTo: `/account/some-account-id` },
    });
  });

  it("gets banner props for ethereum account above 32 ETH", () => {
    const bannerProps = getAccountBannerProps(
      {
        stakeProvider: "kiln",
      },
      account,
      hookMocks,
    );
    expect(bannerProps).toEqual({
      cta: "account.banner.delegation.ethereum.kiln.cta",
      description: "account.banner.delegation.ethereum.kiln.description",
      display: undefined,
      linkText: "account.banner.delegation.linkText",
      linkUrl: "https://www.ledger.com/staking-ethereum",
      onClick: expect.any(Function),
      title: "account.banner.delegation.ethereum.kiln.title",
    });
    if ("onClick" in bannerProps) {
      bannerProps.onClick();
    }

    expect(mockHistoryPush).toHaveBeenCalledWith({
      pathname: `/platform/kiln`,
      state: { accountId: "some-account-id", returnTo: `/account/some-account-id` },
    });
  });
});
