import { Account } from "@ledgerhq/types-live";
import { getAccountBannerProps } from "~/renderer/families/ethereum/utils";

jest.mock("~/renderer/analytics/segment", () => ({ track: jest.fn() }));

const mockHistoryPush = jest.fn();

// eslint-disable-next-line
const hookMocks: any = {
  t: (i: string) => i,
  history: {
    push: mockHistoryPush,
  },
};

const account = {
  id: "some-account-id",
} as Account;

describe("getAccountBannerProps", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("ethereum", () => {
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
        linkText: "Learn more",
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
        linkText: "Learn more",
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
});
