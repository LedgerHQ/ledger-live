import network from "@ledgerhq/live-network/network";
import type { CardanoCoinConfig } from "../config";
import { cardanoDefaults } from "../config";
import { cardanoCoinConfig } from "../fixtures/config";
import { getAllTransactionsByKeys } from "./fetchTransactions";
import { getDelegationInfo } from "./getDelegationInfo";
import { fetchEpochInfo } from "./getEpochInfo";
import { fetchNetworkInfo } from "./getNetworkInfo";
import { fetchPoolDetails, fetchPoolList } from "./getPools";
import { submitTransaction } from "./submitTransaction";

jest.mock("@ledgerhq/live-network/network");

const mockNetwork = jest.mocked(network);

const config: CardanoCoinConfig = {
  ...cardanoCoinConfig,
  api: { url: "https://cardano-api.example" },
  epochParams: { url: "https://cardano-epoch.example/params" },
};

const requestedUrl = () => mockNetwork.mock.calls[0][0].url;

describe("Cardano endpoints", () => {
  beforeEach(() => {
    mockNetwork.mockResolvedValue({
      data: {
        transactions: [],
        blockHeight: 0,
        pools: [],
        transaction: { hash: "hash" },
        delegation: undefined,
        cardano: [{ currentEpoch: { number: 1, protocolParams: {} } }],
      },
    } as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ["transaction", () => getAllTransactionsByKeys(config, ["key"], 0)],
    ["delegation", () => getDelegationInfo(config, "stakeKey")],
    ["network/info", () => fetchNetworkInfo(config)],
    ["pool/list", () => fetchPoolList(config, "", 1, 10)],
    ["pool/detail", () => fetchPoolDetails(config, ["pool"])],
    ["transaction/submit", () => submitTransaction({ transaction: "cbor", config })],
  ])("requests /v1/%s on the API of the coin config", async (path, request) => {
    await request();

    expect(requestedUrl()).toBe(`https://cardano-api.example/v1/${path}`);
  });

  it("requests the epoch params from the coin config", async () => {
    await fetchEpochInfo(config);

    expect(requestedUrl()).toBe("https://cardano-epoch.example/params");
  });
});

describe("cardanoDefaults", () => {
  it.each(Object.entries(cardanoDefaults))(
    "gives %s an API and an epoch-params endpoint",
    (_currencyId, defaults) => {
      expect(defaults.api.url).toMatch(/^https:\/\//);
      expect(defaults.epochParams.url).toMatch(/^https:\/\//);
    },
  );

  it("points the testnet at other endpoints than the mainnet", () => {
    expect(cardanoDefaults.cardano_testnet.api.url).not.toBe(cardanoDefaults.cardano.api.url);
    expect(cardanoDefaults.cardano_testnet.epochParams.url).not.toBe(
      cardanoDefaults.cardano.epochParams.url,
    );
  });
});
