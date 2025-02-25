import BigNumber from "bignumber.js";
import { HttpResponse, http } from "msw";
import coinConfig from "../config";
import { getAccount, getRegistry } from "./sidecar";
import mockServer, { SIDECAR_BASE_URL_TEST } from "./sidecar.mock";

jest.mock("./node", () => ({
  fetchConstants: jest.fn(),
  fetchStakingInfo: jest.fn(),
  fetchValidators: jest.fn(),
  fetchNominations: jest.fn(),
}));

describe("getAccount", () => {
  let balanceResponseStub = {};

  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      node: {
        url: "https://httpbin.org/",
      },
      sidecar: {
        url: SIDECAR_BASE_URL_TEST,
      },
      metadataShortener: {
        url: "",
      },
      metadataHash: {
        url: "",
      },
    }));

    mockServer.listen({ onUnhandledRequest: "error" });
  });

  beforeEach(() => {
    mockServer.resetHandlers();
    mockServer.use(
      http.get(`${SIDECAR_BASE_URL_TEST}/accounts/:addr/balance-info`, () => {
        return HttpResponse.json(balanceResponseStub);
      }),
    );
  });

  afterAll(() => {
    mockServer.close();
  });

  it("should estimate lockedBalance correctly with 1 locked balance type", async () => {
    balanceResponseStub = {
      at: {
        height: "0",
      },
      locks: [
        {
          amount: "60000000000",
          reasons: "All",
        },
      ],
      targets: [],
    };

    const { lockedBalance } = await getAccount("addr");
    expect(lockedBalance).toEqual(new BigNumber("60000000000"));
  });

  it("should estimate lockedBalance when one locked balance is higher than others", async () => {
    balanceResponseStub = {
      at: {
        height: "0",
      },
      locks: [
        {
          amount: "1",
          reasons: "reason 1",
        },
        {
          amount: "5",
          reasons: "reason 2",
        },
        {
          amount: "3",
          reasons: "reason 3",
        },
      ],
      targets: [],
    };
    const { lockedBalance } = await getAccount("addr");
    expect(lockedBalance).toEqual(new BigNumber("5"));
  });
});

describe("getRegistry", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      node: {
        url: "https://httpbin.org/",
      },
      sidecar: {
        url: SIDECAR_BASE_URL_TEST,
      },
      metadataShortener: {
        url: "",
      },
      metadataHash: {
        url: "",
      },
    }));

    mockServer.listen({ onUnhandledRequest: "error" });
  });

  beforeEach(() => {
    mockServer.resetHandlers();
  });

  afterAll(() => {
    mockServer.close();
  });

  it("works", async () => {
    const { registry, extrinsics } = await getRegistry();
    expect(registry).not.toBeNull();
    expect(extrinsics).not.toBeNull();
  });
});
