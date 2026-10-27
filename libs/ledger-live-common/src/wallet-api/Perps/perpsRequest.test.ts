import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { createPerpsRequest } from "./perpsRequest";

type Result = { swapId?: string };

describe("createPerpsRequest", () => {
  let request: ReturnType<typeof createPerpsRequest<Result>>;

  beforeEach(() => {
    request = createPerpsRequest<Result>();
  });

  it("resolves with the outcome it is settled with", async () => {
    const pending = request.begin();

    request.settle(request.getId(), { swapId: "swap-1" });

    await expect(pending).resolves.toEqual({ swapId: "swap-1" });
    expect(request.getId()).toBeNull();
  });

  it("rejects with a user refusal when cancelled", async () => {
    const pending = request.begin();

    request.cancel();

    await expect(pending).rejects.toBeInstanceOf(UserRefusedOnDevice);
  });

  it("cancels the current request by its id", async () => {
    const pending = request.begin();

    request.cancel(request.getId());

    await expect(pending).rejects.toBeInstanceOf(UserRefusedOnDevice);
    expect(request.getId()).toBeNull();
  });

  it("ignores a cancel for a stale or missing id, so it cannot cancel a newer request", async () => {
    request.begin().catch(() => undefined);
    const staleId = request.getId();
    const current = request.begin();

    request.cancel(staleId);
    request.cancel(null);
    request.settle(request.getId(), { swapId: "swap-2" });

    await expect(current).resolves.toEqual({ swapId: "swap-2" });
  });

  it("rejects the previous request when a new one begins, so it never hangs", async () => {
    const first = request.begin();
    const firstId = request.getId();
    const second = request.begin();

    request.settle(firstId, { swapId: "stale" });
    request.settle(request.getId(), { swapId: "swap-2" });

    await expect(first).rejects.toBeInstanceOf(UserRefusedOnDevice);
    await expect(second).resolves.toEqual({ swapId: "swap-2" });
  });

  it("ignores a cancel once committed, and still settles with the real outcome", async () => {
    const pending = request.begin();
    const id = request.getId();

    request.markCommitted(id);
    request.cancel();

    expect(request.getId()).toBe(id);
    request.settle(request.getId(), { swapId: "swap-1" });

    await expect(pending).resolves.toEqual({ swapId: "swap-1" });
  });

  it("does not reject a committed request when a new one begins", async () => {
    const committed = request.begin();
    const committedId = request.getId();
    request.markCommitted(committedId);

    const next = request.begin();
    request.settle(committedId, { swapId: "swap-1" });
    request.cancel();

    await expect(committed).resolves.toEqual({ swapId: "swap-1" });
    await expect(next).rejects.toBeInstanceOf(UserRefusedOnDevice);
  });

  it("ignores settle and commit for an unknown or missing id", async () => {
    const pending = request.begin();

    expect(() => request.settle(null, { swapId: "swap-1" })).not.toThrow();
    expect(() => request.markCommitted("unknown")).not.toThrow();
    request.cancel();

    await expect(pending).rejects.toBeInstanceOf(UserRefusedOnDevice);
  });

  it("keeps separate requests isolated", async () => {
    const other = createPerpsRequest<Result>();
    const pending = request.begin();
    const otherPending = other.begin();

    other.cancel();
    request.settle(request.getId(), { swapId: "swap-1" });

    await expect(pending).resolves.toEqual({ swapId: "swap-1" });
    await expect(otherPending).rejects.toBeInstanceOf(UserRefusedOnDevice);
  });
});
