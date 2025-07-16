import { HttpResponse, http } from "msw";
import coinConfig, { StellarCoinConfig } from "../config";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/lib/currencies";
import { AccountShapeInfo } from "@ledgerhq/coin-framework/lib/bridge/jsHelpers";
import { StellarAccount } from "../types";
import { SyncConfig } from "@ledgerhq/types-live";
import { getAccountShape } from "./synchronization";
import { HORIZON_TEST_BASE_URL, handles, mockServer } from "./msw-handles.fixture";
import { generateOperationsList } from "./generators.fixture";

describe("getAccountShape", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(
      (): StellarCoinConfig => ({
        status: { type: "active" },
        explorer: {
          url: HORIZON_TEST_BASE_URL,
          fetchLimit: 100,
        },
      }),
    );
    mockServer.listen({ onUnhandledRequest: "error" });
  });

  beforeEach(() => {
    let requestCount = 0; // track the number of requests

    mockServer.resetHandlers();
    mockServer.use(
      ...handles,
      http.get(`${HORIZON_TEST_BASE_URL}/accounts/:addr/operations`, ({ params, request }) => {
        const addr = params.addr as string;

        const url = new URL(request.url);
        const order = url.searchParams.get("order");

        let operationsCount = 100;

        // init sync, reach the threshold for fetching operations
        if (addr == "GC65W5WLL7FN6WASRY5RCQAFF2CM75RBY2A6G7GF6UP244PVPUFBLIB6") {
          if (order !== "desc") {
            return HttpResponse.json({}, { status: 400 });
          }
        }

        // init sync, not reach the threshold for fetching operations
        if (addr == "GBRBXWKLSAE2JMVCJSPC2NJEOS33MLMQ6DPSBEK76DEB5A6Q3DR43BJC") {
          if (order !== "desc") {
            return HttpResponse.json({}, { status: 400 });
          }
          if (requestCount >= 3) {
            operationsCount = 0;
          }
        }

        // sync, fetch new operations after init sync
        if (addr == "GBYLYVN3JLX4CTJ7HRAME5MNT5BJ32JLYBI7M7R5TI35I3HR6DLU46CC") {
          switch (requestCount) {
            case 0:
              operationsCount = 80;
              break;
            case 2:
              {
                operationsCount = 10;
                if (order !== "asc") {
                  return HttpResponse.json({}, { status: 400 });
                }
              }
              break;
            default:
              operationsCount = 0;
          }
        }

        requestCount++;

        const resp = {
          _links: {
            self: {
              href: `${HORIZON_TEST_BASE_URL}/accounts/${addr}/operations?order=${order}`,
            },
            next: {
              href: `${HORIZON_TEST_BASE_URL}/accounts/${addr}/operations?order=${order}`,
            },
            prev: {
              href: `${HORIZON_TEST_BASE_URL}/accounts/${addr}/operations?order=${order}`,
            },
          },
          _embedded: {
            records: generateOperationsList(addr, operationsCount),
          },
        };

        return HttpResponse.json(resp);
      }),
    );
  });

  afterAll(() => {
    mockServer.close();
  });

  it("init sync, reach the threshold for fetching operations", async () => {
    const info = {
      address: "GC65W5WLL7FN6WASRY5RCQAFF2CM75RBY2A6G7GF6UP244PVPUFBLIB6",
      currency: getCryptoCurrencyById("stellar"),
      derivationMode: "",
      index: 0,
    } as AccountShapeInfo<StellarAccount>;
    const syncConfig = {} as SyncConfig;
    const account = await getAccountShape(info, syncConfig);
    expect(account.operations?.length).toEqual(1000);
  });

  it("init sync, not reach the threshold for fetching operations", async () => {
    const info = {
      address: "GBRBXWKLSAE2JMVCJSPC2NJEOS33MLMQ6DPSBEK76DEB5A6Q3DR43BJC",
      currency: getCryptoCurrencyById("stellar"),
      derivationMode: "",
      index: 0,
    } as AccountShapeInfo<StellarAccount>;
    const syncConfig = {} as SyncConfig;
    const account = await getAccountShape(info, syncConfig);
    expect(account.operations?.length).toEqual(300);
  });

  it("sync, fetch new operations after init sync", async () => {
    const initInfo = {
      address: "GBYLYVN3JLX4CTJ7HRAME5MNT5BJ32JLYBI7M7R5TI35I3HR6DLU46CC",
      currency: getCryptoCurrencyById("stellar"),
      derivationMode: "",
      index: 0,
    } as AccountShapeInfo<StellarAccount>;
    const syncConfig = {} as SyncConfig;
    const initAccount = await getAccountShape(initInfo, syncConfig);
    expect(initAccount.operations?.length).toEqual(80);

    const info = {
      address: "GBYLYVN3JLX4CTJ7HRAME5MNT5BJ32JLYBI7M7R5TI35I3HR6DLU46CC",
      currency: getCryptoCurrencyById("stellar"),
      derivationMode: "",
      index: 0,
      initialAccount: initAccount,
    } as AccountShapeInfo<StellarAccount>;
    const account = await getAccountShape(info, syncConfig);
    expect(account.operations?.length).toEqual(90);
  });
});
