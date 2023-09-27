import axios from "axios";
import { fetchTokens } from "./fetch";

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
    mockedAxios.get.mockImplementation(() => Promise.reject({ error: { message: "error" } }));
    const tokens = await fetchTokens("tokens.json");
    expect(tokens).toBe(null);
  });
});
