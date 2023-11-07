import axios from "axios";
import { fetchTokens } from ".";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("fetcher", () => {
  it("should return data when fetched", async () => {
    const response = [{ myToken: { name: "myToken" } }];
    mockedAxios.get.mockImplementation(() => Promise.resolve({ data: response }));
    const tokens = await fetchTokens("tokens.json");
    expect(tokens).toBe(response);
  });

  it("should return null if error", async () => {
    mockedAxios.get.mockImplementation(() => Promise.reject({ message: "could not fetch" }));
    const tokens = await fetchTokens("tokens.json");
    expect(tokens).toBe(null);
  });
});
