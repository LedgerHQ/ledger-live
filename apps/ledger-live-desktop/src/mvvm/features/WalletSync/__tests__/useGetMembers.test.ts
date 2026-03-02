import { renderHook, waitFor } from "tests/testSetup";
import { useGetMembers } from "../hooks/useGetMembers";
import { TrustchainMember } from "@ledgerhq/ledger-key-ring-protocol/types";
import { simpleTrustChain } from "./shared";

const mockInstances: TrustchainMember[] = [
  { id: "1", name: "Desktop", permissions: 112 },
  { id: "2", name: "Mobile", permissions: 112 },
];

const Mocks = {
  getMembers: jest.fn().mockResolvedValue(mockInstances),
  handleError: jest.fn(),
};

jest.mock("../hooks/useTrustchainSdk", () => ({
  useTrustchainSdk: () => ({ getMembers: Mocks.getMembers }),
}));

jest.mock("../hooks/walletSync.hooks", () => ({
  useLifeCycle: () => ({ handleError: Mocks.handleError }),
}));

const initialStateWithTrustchain = {
  trustchain: {
    trustchain: simpleTrustChain,
    memberCredentials: { pubkey: "pk", privatekey: "sk" },
  },
};

describe("useGetMembers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Mocks.getMembers.mockResolvedValue(mockInstances);
  });

  it("should return instances when query succeeds", async () => {
    const { result } = renderHook(() => useGetMembers(), {
      initialState: initialStateWithTrustchain,
    });

    await waitFor(() => expect(result.current.isMembersLoading).toBe(false));
    expect(result.current.instances).toEqual(mockInstances);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should call handleError when query fails", async () => {
    const err = new Error("Trustchain not found");
    Mocks.getMembers.mockRejectedValue(err);

    const { result } = renderHook(() => useGetMembers(), {
      initialState: initialStateWithTrustchain,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(err);
    expect(Mocks.handleError).toHaveBeenCalledWith(err);
  });

  it("should not fetch when trustchain or memberCredentials missing", async () => {
    const { result } = renderHook(() => useGetMembers(), {
      initialState: {},
    });

    await waitFor(() => expect(result.current.isMembersLoading).toBe(false));
    expect(Mocks.getMembers).not.toHaveBeenCalled();
  });
});
