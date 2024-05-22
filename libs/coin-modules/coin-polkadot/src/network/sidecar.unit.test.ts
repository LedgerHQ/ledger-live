import BigNumber from "bignumber.js";
import { HttpResponse, http } from "msw";
import { setCoinConfig } from "../config";
import { getAccount, getRegistry } from "./sidecar";
import mockServer, { SIDECAR_BASE_URL_TEST } from "./sidecar.mock";

jest.setTimeout(60000);

describe("getAccount", () => {
  let balanceResponseStub = {};

  beforeAll(() => {
    setCoinConfig(() => ({
      status: {
        type: "active",
      },
      sidecar: {
        url: SIDECAR_BASE_URL_TEST,
      },
    }));

    mockServer.listen();
  });

  beforeEach(() => {
    mockServer.resetHandlers();
    mockServer.use(
      http.get("https://polkadot-sidecar.coin.ledger.com/accounts/:addr/balance-info", () => {
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
    setCoinConfig(() => ({
      status: {
        type: "active",
      },
      sidecar: {
        url: SIDECAR_BASE_URL_TEST,
      },
    }));

    mockServer.listen();
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
