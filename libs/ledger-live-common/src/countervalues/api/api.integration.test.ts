import "../../__tests__/test-helpers/setup";
import api from "./api";

jest.setTimeout(60000);

describe("API specific unit tests", () => {
  test("fetchLatest with empty pairs", async () => {
    const rates = await api.fetchLatest([]);
    expect(rates).toEqual([]);
  });
});
