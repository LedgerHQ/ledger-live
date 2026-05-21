/**
 * @jest-environment jsdom
 */
import { http, HttpResponse } from "msw";
import { createTestStore } from "@tests/test-helpers/testUtils";
import { counterValuesApi as api } from "./api";
import { idsMock, spotSimpleResponseMock } from "./schema";
import { setupServer } from "msw/node";

const mockedValidate = jest.fn().mockReturnValue({ value: idsMock });
const mockedSpotValidate = jest.fn().mockReturnValue({ value: spotSimpleResponseMock });

jest.mock("./schema", () => ({
  ...jest.requireActual("./schema"),
  counterValueIdsSortedByMarketCapSchema: { "~standard": { validate: () => mockedValidate() } },
  spotSimpleResponseSchema: { "~standard": { validate: () => mockedSpotValidate() } },
}));

let store: ReturnType<typeof createTestStore>;
const server = setupServer();
const originalConsoleError = console.error;

beforeAll(() => {
  server.listen();
  console.error = jest.fn();
});

afterAll(() => {
  server.close();
  console.error = originalConsoleError;
});

beforeEach(() => {
  store = createTestStore([api]);
  server.use(
    http.get(`*/v3/supported/crypto`, () => HttpResponse.json(idsMock)),
    http.get(`*/v3/spot/simple`, () => HttpResponse.json(spotSimpleResponseMock)),
  );
});

afterEach(() => {
  store.dispatch(api.util.resetApiState());
  server.resetHandlers();
});

describe("counterValuesApi", () => {
  it("has the correct reducerPath", () => {
    expect(api.reducerPath).toBe("counterValuesApi");
  });

  describe("[endpoint] getCounterValueIdsSortedByMarketCap", () => {
    const { getCounterValueIdsSortedByMarketCap } = api.endpoints;

    it("fetches counter-value IDs", async () => {
      const result = await store.dispatch(getCounterValueIdsSortedByMarketCap.initiate());

      expect(result.isSuccess).toBe(true);
      expect(result.data).toEqual(idsMock);
    });

    it("errors if counterValueIdsSortedByMarketCapSchema rejects", async () => {
      mockedValidate.mockReturnValueOnce({ issues: [{ message: "mock schema error", path: [] }] });

      const result = await store.dispatch(getCounterValueIdsSortedByMarketCap.initiate());

      expect(result.isError).toBe(true);
    });
  });

  describe("[endpoint] getUsdToFiatRate", () => {
    const { getUsdToFiatRate } = api.endpoints;

    it("extracts the requested fiat rate from the spot payload", async () => {
      const result = await store.dispatch(getUsdToFiatRate.initiate({ to: "eur" }));

      expect(result.isSuccess).toBe(true);
      expect(result.data).toBe(spotSimpleResponseMock.USD);
    });

    it("is case-insensitive on the target ticker", async () => {
      const result = await store.dispatch(getUsdToFiatRate.initiate({ to: "EUR" }));

      expect(result.isSuccess).toBe(true);
      expect(result.data).toBe(spotSimpleResponseMock.USD);
    });

    it("returns null when the USD rate is missing from the payload", async () => {
      server.use(http.get(`*/v3/spot/simple`, () => HttpResponse.json({})));
      mockedSpotValidate.mockReturnValueOnce({ value: {} });

      const result = await store.dispatch(getUsdToFiatRate.initiate({ to: "jpy" }));

      expect(result.isSuccess).toBe(true);
      expect(result.data).toBeNull();
    });

    it("errors if spotSimpleResponseSchema rejects", async () => {
      mockedSpotValidate.mockReturnValueOnce({
        issues: [{ message: "mock schema error", path: [] }],
      });

      const result = await store.dispatch(getUsdToFiatRate.initiate({ to: "eur" }));

      expect(result.isError).toBe(true);
    });
  });
});
