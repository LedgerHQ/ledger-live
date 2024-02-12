import network from "@ledgerhq/live-network/network";
import { AxiosResponse } from "axios";
import { API_BAKER } from "./types";
import { asBaker, cache } from "./bakers";

jest.mock("@ledgerhq/live-network/network");
const mockedNetwork = jest.mocked(network);

const data: API_BAKER[] = [
  {
    address: "tz1Kf25fX1VdmYGSEzwFy1wNmkbSEZ2V83sY",
    name: "Tezos Seoul",
    logo: "https://services.tzkt.io/v1/avatars/tz1Kf25fX1VdmYGSEzwFy1wNmkbSEZ2V83sY",
    balance: 155309.245322,
    stakingBalance: 1478612.577008,
    stakingCapacity: 1500000,
    maxStakingBalance: 1425000,
    freeSpace: -53612.57700800011,
    fee: 0.07,
    minDelegation: 100,
    payoutDelay: 6,
    payoutPeriod: 1,
    openForDelegation: true,
    estimatedRoi: 0.056842,
    serviceType: "tezos_only",
    serviceHealth: "active",
    payoutTiming: "stable",
    payoutAccuracy: "precise",
    audit: "5fa0308f48ca160f9901116a",
    insuranceCoverage: 0,
  },
  {
    address: "tz1gg5bjopPcr9agjamyu9BbXKLibNc2rbAq",
    name: "hodl.farm",
    logo: "https://services.tzkt.io/v1/avatars/tz1gg5bjopPcr9agjamyu9BbXKLibNc2rbAq",
    balance: 33273.028666,
    stakingBalance: 335991.478219,
    stakingCapacity: 326500,
    maxStakingBalance: 326500,
    freeSpace: -9491.478218999982,
    fee: 0.05,
    minDelegation: 0,
    payoutDelay: -5,
    payoutPeriod: 1,
    openForDelegation: true,
    estimatedRoi: 0.056424,
    serviceType: "tezos_only",
    serviceHealth: "active",
    payoutTiming: "stable",
    payoutAccuracy: "inaccurate",
    audit: "64bd3910d0970a602a90d497",
    insuranceCoverage: 0,
  },
  {
    address: "tz3LV9aGKHDnAZHCtC9SjNtTrKRu678FqSki",
    name: "Ledger Live by Kiln",
    logo: "https://services.tzkt.io/v1/avatars/tz3LV9aGKHDnAZHCtC9SjNtTrKRu678FqSki",
    balance: 708166.216593,
    stakingBalance: 708166.216593,
    stakingCapacity: 7081662.16593,
    maxStakingBalance: 7081662.16593,
    freeSpace: 6373495.949337,
    fee: 0.12,
    minDelegation: 1,
    payoutDelay: 1,
    payoutPeriod: 1,
    openForDelegation: true,
    estimatedRoi: 0.053786,
    serviceType: "tezos_only",
    serviceHealth: "active",
    payoutTiming: "no_data",
    payoutAccuracy: "no_data",
    insuranceCoverage: 0,
  },
  {
    address: "tz1KwafrdmM8RwxUMxdbbtWyZuKLWSPVxe9u",
    name: "Tezberry Pie",
    logo: "https://services.tzkt.io/v1/avatars/tz1KwafrdmM8RwxUMxdbbtWyZuKLWSPVxe9u",
    balance: 9048.905456,
    stakingBalance: 66542.819025,
    stakingCapacity: 72000,
    maxStakingBalance: 72000,
    freeSpace: 5457.180974999996,
    fee: 0.12,
    minDelegation: 10,
    payoutDelay: 1,
    payoutPeriod: 1,
    openForDelegation: true,
    estimatedRoi: 0.053786,
    serviceType: "tezos_only",
    serviceHealth: "active",
    payoutTiming: "stable",
    payoutAccuracy: "inaccurate",
    audit: "63692a2ca6632298f27ed744",
    insuranceCoverage: 0,
  },
];

describe("Tezos Baker", () => {
  afterEach(() => {
    jest.clearAllMocks();
    cache.reset();
  });

  describe("Get bakers from cache", () => {
    beforeEach(() => {
      const response: AxiosResponse<API_BAKER[]> = {
        data,
        status: 200,
        headers: {},
        statusText: "",
        config: {},
      };

      mockedNetwork.mockReturnValue(Promise.resolve(response));
    });

    it("Ledger Baker should be first in the list", async () => {
      const bakers = await cache();
      expect(bakers[0].name).toBe("Ledger Live by Kiln");
    });
  });

  describe("asBaker", () => {
    it("Should convert api baker to LL baker (capacity status full)", () => {
      const testBaker = data.find(baker => baker.freeSpace < 0)!;
      const baker = asBaker(testBaker);
      expect(baker?.name).toBe(testBaker.name);
      expect(baker?.nominalYield).toBe(`${Math.floor(10000 * testBaker.estimatedRoi) / 100} %`);
      expect(baker?.capacityStatus).toBe("full");
    });

    it("Should convert api baker to LL baker (capacity status normal)", () => {
      const testBaker = data.find(baker => baker.freeSpace > 0)!;
      const baker = asBaker(testBaker);
      expect(baker?.name).toBe(testBaker.name);
      expect(baker?.nominalYield).toBe(`${Math.floor(10000 * testBaker.estimatedRoi) / 100} %`);
      expect(baker?.capacityStatus).toBe("normal");
    });
  });
});
