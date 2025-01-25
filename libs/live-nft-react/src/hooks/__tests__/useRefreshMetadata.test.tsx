import { act, renderHook, waitFor } from "@testing-library/react";
import { notifyManager } from "@tanstack/react-query";

import { RefreshOpts } from "@ledgerhq/live-nft/api/simplehash";

import { wrapper } from "../../tools/helperTests";
import { useRefreshMetadata } from "../useRefreshMetadata";

// invoke callback instantly
notifyManager.setScheduler(cb => cb());

const ERROR_MESSAGE =
  "No matching NFT found - check the chain, contract_address and token_id or contact support@simplehash.com if you need assistance";

jest.mock("@ledgerhq/live-nft/api/simplehash", () => ({
  refreshMetadata: jest.fn().mockImplementation((opts: RefreshOpts) => {
    if (opts.refreshType === "nft" && !opts.contractAddress && !opts.chainId && !opts.tokenId) {
      return Promise.reject(new Error(ERROR_MESSAGE));
    }

    if (opts.refreshType === "contract" && !opts.contractAddress && !opts.chainId) {
      return Promise.reject(new Error(ERROR_MESSAGE));
    }

    return Promise.resolve({
      message: `${opts.refreshType === "nft" ? `NFT ${opts.tokenId}, ` : ""}Contract ${opts.contractAddress} on ${opts.chainId} refreshed`,
    });
  }),
}));

describe("useRefreshMetadata", () => {
  test("refresh NFT metadata successful", async () => {
    const { result } = renderHook(() => useRefreshMetadata(), {
      wrapper,
    });

    const contractAddress = "0xEDD13";
    const chainId = "ethereum";
    const tokenId = "1";
    act(() => {
      result.current.mutate({
        contractAddress,
        chainId,
        tokenId: "1",
        refreshType: "nft",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() =>
      expect(result.current.data?.message).toBe(
        `NFT ${tokenId}, Contract ${contractAddress} on ${chainId} refreshed`,
      ),
    );
  });

  test("refresh NFT metadata unsuccessful", async () => {
    const { result } = renderHook(() => useRefreshMetadata(), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        refreshType: "nft",
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    await waitFor(() => expect(result.current.error?.message).toBe(ERROR_MESSAGE));
  });

  test("refresh Contract metadata successful", async () => {
    const { result } = renderHook(() => useRefreshMetadata(), {
      wrapper,
    });

    const contractAddress = "0xEDD13";
    const chainId = "ethereum";
    act(() => {
      result.current.mutate({
        contractAddress,
        chainId,
        refreshType: "contract",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() =>
      expect(result.current.data?.message).toBe(
        `Contract ${contractAddress} on ${chainId} refreshed`,
      ),
    );
  });

  test("mark Contract as not spam unsuccessful", async () => {
    const { result } = renderHook(() => useRefreshMetadata(), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        refreshType: "contract",
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    await waitFor(() => expect(result.current.error?.message).toBe(ERROR_MESSAGE));
  });
});
