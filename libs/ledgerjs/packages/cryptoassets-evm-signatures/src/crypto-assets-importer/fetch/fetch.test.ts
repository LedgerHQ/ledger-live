import axios from "axios";
import { fetchTokensFromCDN } from ".";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("fetcher", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return data when fetched", async () => {
    const response = [{ myToken: { name: "myToken" } }];
    mockedAxios.get.mockImplementation(() =>
      Promise.resolve({ data: response, headers: { etag: "hash" } }),
    );
    const [tokens, hash] = await fetchTokensFromCDN("tokens.json");
    expect(tokens).toBe(response);
    expect(hash).toBe("hash");
  });

  it("should throw error if fetch failed", async () => {
    mockedAxios.get.mockImplementation(() => Promise.reject({ message: "could not fetch" }));
    expect(async () => {
      await fetchTokensFromCDN("tokens.json");
    }).rejects.toThrow();
  });
});
