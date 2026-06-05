import network from "@ledgerhq/live-network";
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
});
