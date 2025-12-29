import network from "@ledgerhq/live-network/network";
import coinConfig, { TezosCoinConfig } from "../config";
import { mockConfig } from "../test/config";
import { asBaker, cache, type TezosApiBaker } from "./bakers";

jest.mock("@ledgerhq/live-network/network");
const mockedNetwork = jest.mocked(network);

const data: TezosApiBaker[] = [
  {
    address: "tz1Kf25fX1VdmYGSEzwFy1wNmkbSEZ2V83sY",
    name: "Tezos Seoul",
    status: "closed",
    balance: 2.941247,
    features: [],
    delegation: {
      enabled: true,
      minBalance: 100,
      fee: 0.07,
      capacity: 0,
      freeSpace: -815914.909184,
      estimatedApy: 0,
      features: [
        {
          title: "Distributed rewards",
          content: "Baker doesn't pay network fee rewards",
        },
      ],
    },
    staking: {
      enabled: false,
      minBalance: 0,
      fee: 0,
      capacity: 0,
      freeSpace: 0,
      estimatedApy: 0.0967,
      features: [],
    },
  },
  {
    address: "tz1gg5bjopPcr9agjamyu9BbXKLibNc2rbAq",
    name: "hodl.farm",
    status: "active",
    balance: 43334.236051,
    features: [
      {
        title: "Contribution",
        content: {
          project: "Tezos on Kubernetes",
          link: "https://github.com/hodl-dot-farm/tezos-on-gke",
        },
      },
    ],
    delegation: {
      enabled: false,
      minBalance: 0,
      fee: 1,
      capacity: 363902.963184,
      freeSpace: 162427.070878,
      estimatedApy: 0,
      features: [
        {
          title: "Distributed rewards",
          content: "Baker doesn't pay network fee, denunciation and revelation rewards",
        },
        {
          title: "Compensated loss",
          content: "Baker compensates missed baking and attestation rewards",
        },
      ],
    },
    staking: {
      enabled: true,
      minBalance: 0,
      fee: 0.075,
      capacity: 363902.963184,
      freeSpace: 293604.290457,
      estimatedApy: 0.0894,
      features: [],
    },
  },
  {
    address: "tz3LV9aGKHDnAZHCtC9SjNtTrKRu678FqSki",
    name: "Ledger by Kiln",
    status: "active",
    balance: 801425.237986,
    features: [],
    delegation: {
      enabled: true,
      minBalance: 1,
      fee: 0.12,
      capacity: 7002345.443544,
      freeSpace: 36021.368062,
      estimatedApy: 0.0284,
      features: [],
    },
    staking: {
      enabled: true,
      minBalance: 0,
      fee: 0.2,
      capacity: 7002345.443544,
      freeSpace: 6837721.800765,
      estimatedApy: 0.0774,
      features: [],
    },
  },
  {
    address: "tz1KwafrdmM8RwxUMxdbbtWyZuKLWSPVxe9u",
    name: "Tezberry Pie",
    status: "active",
    balance: 17798.149073,
    features: [],
    delegation: {
      enabled: true,
      minBalance: 10,
      fee: 0.12,
      capacity: 155364.334245,
      freeSpace: 100030.802123,
      estimatedApy: 0.0284,
      features: [],
    },
    staking: {
      enabled: true,
      minBalance: 0,
      fee: 0.12,
      capacity: 155364.334245,
      freeSpace: 100143.090362,
      estimatedApy: 0.0851,
      features: [],
    },
  },
  {
    address: "tz1WnfXMPaNTBmH7DBPwqCWs9cPDJdkGBTZ8",
    name: "TezosHODL",
    status: "active",
    balance: 417336.25576,
    features: [],
    delegation: {
      enabled: true,
      minBalance: 10,
      fee: 0.15,
      capacity: 3733611.262254,
      freeSpace: 2216838.749908,
      estimatedApy: 0.0274,
      features: [
        {
          title: "Distributed rewards",
          content: "Baker doesn't pay denunciation rewards",
        },
      ],
    },
    staking: {
      enabled: true,
      minBalance: 0,
      fee: 0.15,
      capacity: 2074228.47903,
      freeSpace: 1440050.488348,
      estimatedApy: 0.0822,
      features: [],
    },
  },
];

describe("Tezos Baker", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig((): TezosCoinConfig => mockConfig as TezosCoinConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
    cache.reset();
  });

  describe("Get bakers from cache", () => {
    beforeEach(() => {
      const response = {
        data,
        status: 200,
        headers: {} as any,
        statusText: "",
        config: {
          headers: {} as any,
        },
      };

      mockedNetwork.mockReturnValue(Promise.resolve(response));
    });

    it("Ledger Baker should be first in the list", async () => {
      const bakers = await cache();
      expect(bakers[0].name).toBe("Ledger by Kiln");
    });
  });

  describe("asBaker", () => {
    it("Should convert api baker to LL baker (capacity status full)", () => {
      const testBaker = data.find(baker => baker.delegation.freeSpace < 0)!;
      const baker = asBaker(testBaker);
      expect(baker?.name).toBe(testBaker.name);
      expect(baker?.nominalYield).toBe(
        `${Math.floor(10000 * testBaker.delegation.estimatedApy) / 100} %`,
      );
      expect(baker?.capacityStatus).toBe("full");
    });

    it("Should convert api baker to LL baker (capacity status normal)", () => {
      const testBaker = data.find(baker => baker.delegation.freeSpace > 0)!;
      const baker = asBaker(testBaker);
      expect(baker?.name).toBe(testBaker.name);
      expect(baker?.nominalYield).toBe(
        `${Math.floor(10000 * testBaker.delegation.estimatedApy) / 100} %`,
      );
      expect(baker?.capacityStatus).toBe("normal");
    });
  });
});
