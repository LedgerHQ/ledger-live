import { renderHook } from "@testing-library/react";
import { wrapper } from "../../tools/helperTests";
import { useQuery } from "@tanstack/react-query";
import { useFetchOrdinalByTokenId } from "../useFetchOrdinalByTokenId";

jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQuery: jest.fn(),
}));

const mockedInscriptionID = "51fb634f0fefa3441e1a60090d9e292ce1f0803258c2dae818410db4192c89f6i0";

const mockQueryResult = {
  data: {},
  isLoading: false,
  isError: false,
  fetchNextPage: jest.fn(),
  hasNextPage: false,
};

describe("useFetchOrdinals", () => {
  it("calls useInfiniteQuery with correct arguments", async () => {
    (useQuery as jest.Mock).mockReturnValue(mockQueryResult);

    renderHook(() => useFetchOrdinalByTokenId(mockedInscriptionID), {
      wrapper,
    });

    expect(useQuery).toHaveBeenCalledWith({
      queryKey: [
        "FectchOrdinalsByTokenId",
        "51fb634f0fefa3441e1a60090d9e292ce1f0803258c2dae818410db4192c89f6i0",
        ["bitcoin"],
        "0",
      ],
      queryFn: expect.any(Function),
    });
  });
});
