import { useQuery } from "@tanstack/react-query";
import { NFTS_QUERY_KEY } from "../../queryKeys";
import { renderHook } from "@testing-library/react";
import { useCheckSpamScore } from "../useCheckSpamScore";
import { CheckSpamScoreOpts } from "@ledgerhq/live-nft/api/simplehash";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

describe("useCheckSpamScore", () => {
  it("calls useQuery with correct arguments", () => {
    const elemToCheck: CheckSpamScoreOpts = {
      chainId: "ethereum",
      contractAddress: "0x06012c8c66d",
    };
    renderHook(() => useCheckSpamScore(elemToCheck));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
        queryFn: expect.any(Function),
        queryKey: [NFTS_QUERY_KEY.CheckSpamScore, elemToCheck],
      }),
    );
  });
});
