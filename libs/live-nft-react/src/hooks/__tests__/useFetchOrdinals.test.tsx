import { useFetchOrdinals } from "../useFetchOrdinals";
import { renderHook } from "@testing-library/react";
import { wrapper } from "../../tools/helperTests";
import { useInfiniteQuery } from "@tanstack/react-query";

jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useInfiniteQuery: jest.fn(),
}));

const mockedBTCAddresses = "bc1pgtat0n2kavrz4ufhngm2muzxzx6pcmvr4czp089v48u5sgvpd9vqjsuaql";
const threshold = 0.5;

const mockQueryResult = {
  data: {
    pages: [{ nfts: [] }],
  },
  isLoading: false,
  isError: false,
  fetchNextPage: jest.fn(),
  hasNextPage: false,
};

describe("useFetchOrdinals", () => {
  it("calls useInfiniteQuery with correct arguments", async () => {
    (useInfiniteQuery as jest.Mock).mockReturnValue(mockQueryResult);

    renderHook(() => useFetchOrdinals({ addresses: mockedBTCAddresses, threshold }), { wrapper });

    expect(useInfiniteQuery).toHaveBeenCalledWith({
      queryKey: [
        "FetchOrdinals",
        "bc1pgtat0n2kavrz4ufhngm2muzxzx6pcmvr4czp089v48u5sgvpd9vqjsuaql",
        ["bitcoin", "utxo"],
      ],
      queryFn: expect.any(Function),
      initialPageParam: undefined,
      getNextPageParam: expect.any(Function),
      enabled: true,
    });
  });
});
