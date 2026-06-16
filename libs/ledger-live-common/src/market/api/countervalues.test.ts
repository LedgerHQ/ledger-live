import network from "@ledgerhq/live-network";
import { Order } from "../utils/types";
import { fetchList } from "./countervalues";

jest.mock("@ledgerhq/live-network", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@ledgerhq/live-env", () => ({
  getEnv: jest.fn((key: string) => {
    if (key === "LEDGER_COUNTERVALUES_API") return "https://countervalues.example.com";
    return "";
  }),
}));

const mockedNetwork = jest.mocked(network);

function getLastRequestUrl() {
  const lastCall = mockedNetwork.mock.calls[mockedNetwork.mock.calls.length - 1];
  const request = lastCall?.[0] as { url: string } | undefined;
  if (!request) throw new Error("No network request was made");

  return new URL(request.url);
}

describe("market countervalues API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedNetwork.mockResolvedValue({ data: [], status: 200 });
  });

  it("does not send a one-character filter", async () => {
    await fetchList({ counterCurrency: "usd", search: "b" });

    expect(getLastRequestUrl().searchParams.get("filter")).toBeNull();
  });

  it("sends the filter once the search reaches two characters", async () => {
    await fetchList({ counterCurrency: "usd", search: "bt" });

    expect(getLastRequestUrl().searchParams.get("filter")).toBe("bt");
  });

  it("sends an explicit filter independently from the search length", async () => {
    await fetchList({ counterCurrency: "usd", search: "b", filter: "stock" });

    expect(getLastRequestUrl().searchParams.get("filter")).toBe("stock");
  });

  it("keeps the top parameter for unfiltered top gainers", async () => {
    await fetchList({ counterCurrency: "usd", order: Order.topGainers });

    expect(getLastRequestUrl().searchParams.get("top")).toBe("100");
  });

  it("does not send the top parameter when top gainers use an explicit filter", async () => {
    await fetchList({ counterCurrency: "usd", order: Order.topGainers, filter: "stock" });

    expect(getLastRequestUrl().searchParams.get("top")).toBeNull();
  });

  it("does not send the top parameter when top gainers are scoped to a category", async () => {
    await fetchList({ counterCurrency: "usd", order: Order.topGainers, categories: "privacy" });

    const url = getLastRequestUrl();
    expect(url.searchParams.get("top")).toBeNull();
    expect(url.searchParams.get("categories")).toBe("privacy");
  });
});
