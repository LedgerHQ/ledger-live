import { act, renderHook, waitFor } from "@testing-library/react";
import { notifyManager } from "@tanstack/react-query";

import { useSpamReportNft } from "../useSpamReportNft";
import { EventType, NftSpamReportOpts } from "@ledgerhq/live-nft/api/simplehash";

import { wrapper } from "../../tools/helperTests";

// invoke callback instantly
notifyManager.setScheduler(cb => cb());

const ERROR_MESSAGE = "Missing required fields";
jest.mock("@ledgerhq/live-nft/api/simplehash", () => ({
  reportSpamNtf: jest.fn().mockImplementation((opts: NftSpamReportOpts) => {
    if (!opts.contractAddress && !opts.chainId && !opts.tokenId && !opts.tokenId) {
      return Promise.reject(new Error(ERROR_MESSAGE));
    }

    return Promise.resolve({
      message: `Contract ${opts.contractAddress} on ${opts.chainId} logged`,
    });
  }),
}));

describe("useSpamReportNft", () => {
  test("mark NFT as not spam successful", async () => {
    const { result } = renderHook(() => useSpamReportNft(), {
      wrapper,
    });

    const contractAddress = "0xEDD13";
    const chainId = "ethereum";
    act(() => {
      result.current.mutate({
        contractAddress,
        chainId,
        eventType: "mark_as_not_spam" as EventType,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() =>
      expect(result.current.data?.message).toBe(`Contract ${contractAddress} on ${chainId} logged`),
    );
  });

  test("mark NFT as not spam unsuccessful", async () => {
    const { result } = renderHook(() => useSpamReportNft(), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        eventType: "mark_as_not_spam" as EventType,
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    await waitFor(() => expect(result.current.error?.message).toBe(ERROR_MESSAGE));
  });
});
