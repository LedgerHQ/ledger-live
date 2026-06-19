import network from "@ledgerhq/live-network/network";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { APIEpochParams } from "./api-types";
import { fetchEpochInfo } from "./getEpochInfo";

jest.mock("@ledgerhq/live-network/network");
const mockNetwork = jest.mocked(network);

const currency = getCryptoCurrencyById("cardano");

const withCurrentEpoch = (currentEpoch: APIEpochParams["cardano"][number]["currentEpoch"]) =>
  ({ data: { cardano: [{ currentEpoch }] } }) as never;

describe("fetchEpochInfo", () => {
  afterEach(() => jest.clearAllMocks());

  it("flattens nested adaPots/activeStake_aggregate and stringifies the lovelace numbers", async () => {
    mockNetwork.mockResolvedValue(
      withCurrentEpoch({
        number: 637,
        protocolParams: { a0: 0.3, rho: 0.003, tau: 0.2 },
        adaPots: { reserves: 6307350175048889 },
        // exactly-representable >2^53 value so String() is deterministic (real values may round at parse)
        activeStake_aggregate: { aggregate: { sum: { amount: 22000000000000000 } } },
      }),
    );

    expect(await fetchEpochInfo(currency)).toEqual({
      number: 637,
      reserves: "6307350175048889",
      activeStake: "22000000000000000",
      params: { a0: 0.3, rho: 0.003, tau: 0.2 },
    });
  });

  it("leaves reserves/activeStake undefined when the query doesn't serve them yet", async () => {
    mockNetwork.mockResolvedValue(
      withCurrentEpoch({
        number: 637,
        protocolParams: { a0: 0.3, rho: 0.003, tau: 0.2 },
      }),
    );

    const epoch = await fetchEpochInfo(currency);
    expect(epoch.reserves).toBeUndefined();
    expect(epoch.activeStake).toBeUndefined();
    expect(epoch.params).toEqual({ a0: 0.3, rho: 0.003, tau: 0.2 });
  });
});
