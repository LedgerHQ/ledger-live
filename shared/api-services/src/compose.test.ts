import { defineApiServices, type ApiServiceDescriptor, type ApiServicesState } from "./compose";
import { calApi, calService } from "./services/cal";
import { dadaApi, dadaService } from "./services/dada";
import { swapApi, swapService } from "./services/swap";

const common = { ledgerClientVersion: "test" };

function unreadable(): never {
  throw new Error("read at define time");
}

function fakeService(
  reducerPath: string,
  buildExtra: ApiServiceDescriptor["buildExtra"] = () => ({}),
): ApiServiceDescriptor {
  return { api: { reducerPath, reducer: jest.fn(), middleware: jest.fn() }, buildExtra };
}

describe("defineApiServices", () => {
  it("keys the reducers by reducer path", () => {
    const first = fakeService("firstApi");
    const second = fakeService("secondApi");

    const { reducers } = defineApiServices([first, second]);

    expect(reducers).toEqual({ firstApi: first.api.reducer, secondApi: second.api.reducer });
  });

  it("keeps the middlewares in descriptor order", () => {
    const first = fakeService("firstApi");
    const second = fakeService("secondApi");

    expect(defineApiServices([second, first]).middlewares).toEqual([
      second.api.middleware,
      first.api.middleware,
    ]);
  });

  it("reads no service config before createExtra runs", () => {
    const services = defineApiServices([
      calService(unreadable),
      swapService(unreadable),
      fakeService("fakeApi", unreadable),
    ]);

    expect(() => services.createExtra(common)).toThrow("read at define time");
  });

  it("merges every service's extraArgument and passes the common config", () => {
    const buildFirst = jest.fn(() => ({ firstUrl: "https://first.test" }));
    const buildSecond = jest.fn(() => ({ secondUrl: "https://second.test" }));

    const extra = defineApiServices([
      fakeService("firstApi", buildFirst),
      fakeService("secondApi", buildSecond),
    ]).createExtra(common);

    expect(extra).toEqual({ firstUrl: "https://first.test", secondUrl: "https://second.test" });
    expect(buildFirst).toHaveBeenCalledWith(common);
    expect(buildSecond).toHaveBeenCalledWith(common);
  });

  it("merges a key two services give the same value", () => {
    const extra = defineApiServices([
      fakeService("firstApi", ({ ledgerClientVersion }) => ({ ledgerClientVersion })),
      fakeService("secondApi", ({ ledgerClientVersion }) => ({ ledgerClientVersion })),
    ]).createExtra(common);

    expect(extra).toEqual({ ledgerClientVersion: "test" });
  });

  it("throws when two services give different values for one key", () => {
    const services = defineApiServices([
      fakeService("firstApi", () => ({ url: "https://first.test" })),
      fakeService("secondApi", () => ({ url: "https://second.test" })),
    ]);

    expect(() => services.createExtra(common)).toThrow(
      "secondApi and firstApi give different values for extraArgument.url",
    );
  });
});

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

const listed = defineApiServices([
  calService(() => ({ calServiceUrl: "https://cal.test" })),
  dadaService(),
  swapService(() => ({ getSwapApiBaseUrl: () => "https://swap.test" })),
]);

const stateMatchesListedApis: Equals<
  ApiServicesState<typeof listed>,
  {
    calApi: ReturnType<typeof calApi.reducer>;
    assetsDataApi: ReturnType<typeof dadaApi.reducer>;
    swapApi: ReturnType<typeof swapApi.reducer>;
  }
> = true;

describe("ApiServicesState", () => {
  it("is the reducer state of each listed service api", () => {
    expect(stateMatchesListedApis).toBe(true);
  });
});
