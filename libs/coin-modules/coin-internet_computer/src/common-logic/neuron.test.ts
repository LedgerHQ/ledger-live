import { setup } from "../test/jest.mocks";
setup();

import BigNumber from "bignumber.js";
import { getBannerState } from "./neuron";
import { getEmptyAccount, SAMPLE_ACCOUNT_SHAPE_INFO } from "../test/__fixtures__";
import { ICPAccount, ICPNeuron } from "../types";
import { votingPowerNeedsRefresh } from "@zondax/ledger-live-icp/neurons";
import { getTimeUntil } from "@zondax/ledger-live-icp/utils";

describe("getBannerState", () => {
  let account: ICPAccount;

  beforeEach(() => {
    jest.clearAllMocks();
    account = getEmptyAccount(SAMPLE_ACCOUNT_SHAPE_INFO.currency);
    account.neurons.lastUpdatedMSecs = Date.now();
    account.balance = new BigNumber(0);
    account.neurons.fullNeurons = [];
  });

  it("should return 'confirmFollowing' when voting power needs refresh", () => {
    (votingPowerNeedsRefresh as jest.Mock).mockReturnValue({
      needsRefresh: true,
      minDays: 1,
      minHours: 2,
      minMinutes: 3,
    });
    const result = getBannerState(account);
    expect(result.state).toBe("confirmFollowing");
    expect(result.data).toEqual({ days: 1, hours: 2, minutes: 3 });
  });

  it("should return syncNeurons when last sync is too old", () => {
    (votingPowerNeedsRefresh as jest.Mock).mockReturnValue({
      needsRefresh: false,
      minDays: 0,
      minHours: 0,
      minMinutes: 0,
    });
    (getTimeUntil as jest.Mock).mockReturnValue({ days: 15, hours: 0, minutes: 0 });
    account.neurons.lastUpdatedMSecs = Date.now() - 31 * 24 * 60 * 60 * 1000; // 15 days ago
    const result = getBannerState(account);
    expect(result.state).toBe("syncNeurons");
    expect(result.data).toEqual({ days: 15, hours: 0, minutes: 0 });
  });

  it("should return 'lockNeurons' when there are unlocked neurons", () => {
    (votingPowerNeedsRefresh as jest.Mock).mockReturnValue({
      needsRefresh: false,
      minDays: 0,
      minHours: 0,
      minMinutes: 0,
    });
    (getTimeUntil as jest.Mock).mockReturnValue({ days: 0, hours: 0, minutes: 0 });
    account.neurons.fullNeurons = [{ dissolveState: "Unlocked" }] as unknown as ICPNeuron[];
    const result = getBannerState(account);
    expect(result.state).toBe("lockNeurons");
  });

  it("should return 'addFollowees' when a neuron has no followees", () => {
    (votingPowerNeedsRefresh as jest.Mock).mockReturnValue({
      needsRefresh: false,
      minDays: 0,
      minHours: 0,
      minMinutes: 0,
    });
    account.neurons.fullNeurons = [
      {
        dissolveState: "Dissolved",
        followees: [],
      },
    ] as unknown as ICPNeuron[];
    (getTimeUntil as jest.Mock).mockReturnValue({ days: 0, hours: 0, minutes: 0 });
    const result = getBannerState(account);
    expect(result.state).toBe("addFollowees");
  });

  it("should return 'stakeICP' when balance is greater than 1", () => {
    (votingPowerNeedsRefresh as jest.Mock).mockReturnValue({
      needsRefresh: false,
      minDays: 0,
      minHours: 0,
      minMinutes: 0,
    });
    (getTimeUntil as jest.Mock).mockReturnValue({ days: 0, hours: 0, minutes: 0 });
    account.balance = new BigNumber(2);
    const result = getBannerState(account);
    expect(result.state).toBe("stakeICP");
  });

  it("should return default 'stakeICP' when no other condition is met", () => {
    (votingPowerNeedsRefresh as jest.Mock).mockReturnValue({
      needsRefresh: false,
      minDays: 0,
      minHours: 0,
      minMinutes: 0,
    });
    const result = getBannerState(account);
    expect(result.state).toBe("stakeICP");
  });
});
