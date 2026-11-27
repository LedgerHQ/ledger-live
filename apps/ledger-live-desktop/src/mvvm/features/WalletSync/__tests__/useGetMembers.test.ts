import { renderHook, waitFor } from "tests/testSetup";
import { useGetMembers } from "../hooks/useGetMembers";
import { KeyRingMemberIdSchema, type KeyRingMember } from "@features/platform-key-ring";
import { simpleTrustChain } from "./shared";

const mockInstances: KeyRingMember[] = [
  { id: KeyRingMemberIdSchema.parse("1"), name: "Desktop" },
  { id: KeyRingMemberIdSchema.parse("2"), name: "Mobile" },
];

const Mocks = {
  listMembers: jest.fn().mockResolvedValue(mockInstances),
  handleError: jest.fn(),
};

jest.mock("../hooks/useKeyRingClient", () => {
  const { fakeKeyRingClient } = jest.requireActual("@features/platform-key-ring/testing");
  const client = fakeKeyRingClient({
    listMembers: (...args: unknown[]) => Mocks.listMembers(...args),
    openStream: () => null,
  });
  return { useKeyRingClient: () => client };
});

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
    Mocks.listMembers.mockResolvedValue(mockInstances);
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
    Mocks.listMembers.mockRejectedValue(err);

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
    expect(Mocks.listMembers).not.toHaveBeenCalled();
  });
});
