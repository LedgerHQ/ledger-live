/**
 * @jest-environment jsdom
 */
import { http, HttpResponse } from "msw";
import { createTestStore } from "@tests/test-helpers/testUtils";
import { counterValuesApi as api } from "./api";
import { idsMock } from "./schema";
import { setupServer } from "msw/node";

const mockedValidate = jest.fn().mockReturnValue({ value: idsMock });

jest.mock("./schema", () => ({
  ...jest.requireActual("./schema"),
  counterValueIdsSortedByMarketCapSchema: { "~standard": { validate: () => mockedValidate() } },
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
  server.use(http.get(`*/v3/supported/crypto`, () => HttpResponse.json(idsMock)));
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
});
