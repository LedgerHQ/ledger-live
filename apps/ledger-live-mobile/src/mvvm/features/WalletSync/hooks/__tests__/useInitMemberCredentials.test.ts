import { act, renderHook } from "@tests/test-renderer";
import { memberCredentialsSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import type { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import { useInitMemberCredentials } from "../useInitMemberCredentials";

const mockInitMemberCredentials = jest.fn<Promise<MemberCredentials>, []>();

jest.mock("../useTrustchainSdk", () => ({
  useTrustchainSdk: () => ({ initMemberCredentials: mockInitMemberCredentials }),
}));

const FIRST: MemberCredentials = {
  pubkey: "02".padEnd(66, "a"),
  privatekey: "1".repeat(64),
};
const SECOND: MemberCredentials = {
  pubkey: "03".padEnd(66, "b"),
  privatekey: "2".repeat(64),
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return { promise, resolve };
}

function useTwoCallers() {
  return [useInitMemberCredentials(), useInitMemberCredentials()];
}

describe("useInitMemberCredentials", () => {
  beforeEach(() => {
    mockInitMemberCredentials.mockReset();
  });

  it("should store the keypair that every overlapping caller waits for", async () => {
    const first = deferred<MemberCredentials>();
    mockInitMemberCredentials.mockReturnValueOnce(first.promise).mockResolvedValueOnce(SECOND);

    const { result, store } = renderHook(() => useTwoCallers());

    await act(async () => {
      first.resolve(FIRST);
      await first.promise;
    });

    expect(mockInitMemberCredentials).toHaveBeenCalledTimes(1);
    expect(memberCredentialsSelector(store.getState())).toEqual(FIRST);
    expect(result.current.map(caller => caller.memberCredentials)).toEqual([FIRST, FIRST]);
  });

  it("should not generate a keypair when one is already stored", () => {
    renderHook(() => useInitMemberCredentials(), {
      overrideInitialState: state => ({
        ...state,
        trustchain: { ...state.trustchain, memberCredentials: FIRST },
      }),
    });

    expect(mockInitMemberCredentials).not.toHaveBeenCalled();
  });
});
