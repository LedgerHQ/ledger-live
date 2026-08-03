/**
 * @jest-environment node
 */
import { liveSlug, trustchainLifecycle } from "../walletsync/trustchainLifecycle";

const deleteData = jest.fn(async () => {});
const uploadData = jest.fn(async () => {});
const encrypt = jest.fn(async () => "encrypted-payload");

jest.mock("@shared/cloud-sync", () => ({
  getCloudSyncApi: jest.fn(() => ({ deleteData, uploadData })),
  makeCipher: jest.fn(() => ({ encrypt })),
}));

// imported after the mock so the factory above is in place
import { getCloudSyncApi, makeCipher } from "@shared/cloud-sync";

const oldTrustchain = { rootId: "old-root", walletSyncEncryptionKey: "old-key" };
const newTrustchain = { rootId: "new-root", walletSyncEncryptionKey: "new-key" };
const memberCredentials = { pubkey: "pub", privatekey: "priv" };

/** Mimics trustchainSdk.withAuth, which hands a JWT to the callback. */
function makeTrustchainSdk() {
  return {
    withAuth: jest.fn(
      async (trustchain: { rootId: string }, _creds: unknown, job: (jwt: string) => unknown) =>
        job(`jwt-for-${trustchain.rootId}`),
    ),
  };
}

function setup(wsState: { data: unknown; version: number }) {
  const trustchainSdk = makeTrustchainSdk();
  const lifecycle = trustchainLifecycle({
    cloudSyncApiBaseUrl: "https://cloudsync.test",
    getCurrentWSState: () => wsState,
  });
  return { trustchainSdk, lifecycle };
}

async function rotate(wsState: { data: unknown; version: number }) {
  const { trustchainSdk, lifecycle } = setup(wsState);
  const finish = await lifecycle.onTrustchainRotation!(
    trustchainSdk as never,
    oldTrustchain as never,
    memberCredentials as never,
  );
  await finish(newTrustchain as never);
  return { trustchainSdk };
}

describe("liveSlug", () => {
  it("is the wallet sync slug used by Live", () => {
    expect(liveSlug).toBe("live");
  });
});

describe("trustchainLifecycle.onTrustchainRotation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("authenticates against the old trustchain before rotating", async () => {
    const { trustchainSdk } = await rotate({ data: { accounts: [] }, version: 7 });
    expect(trustchainSdk.withAuth).toHaveBeenCalledWith(
      oldTrustchain,
      memberCredentials,
      expect.any(Function),
      "refresh",
    );
  });

  it("deletes the old trustchain data with the old JWT", async () => {
    await rotate({ data: { accounts: [] }, version: 7 });
    expect(deleteData).toHaveBeenCalledWith("jwt-for-old-root", liveSlug, oldTrustchain);
  });

  it("re-uploads the current state encrypted for the new trustchain", async () => {
    const data = { accounts: ["a"] };
    await rotate({ data, version: 7 });

    expect(encrypt).toHaveBeenCalledWith(newTrustchain, data);
    expect(uploadData).toHaveBeenCalledWith(
      "jwt-for-new-root",
      liveSlug,
      7,
      "encrypted-payload",
      newTrustchain,
    );
  });

  it("deletes before uploading, so the old copy never outlives the rotation", async () => {
    const order: string[] = [];
    deleteData.mockImplementationOnce(async () => {
      order.push("delete");
    });
    uploadData.mockImplementationOnce(async () => {
      order.push("upload");
    });

    await rotate({ data: { accounts: [] }, version: 1 });
    expect(order).toEqual(["delete", "upload"]);
  });

  it("skips the re-upload when there is no local state to migrate", async () => {
    await rotate({ data: null, version: 0 });

    expect(deleteData).toHaveBeenCalled();
    expect(encrypt).not.toHaveBeenCalled();
    expect(uploadData).not.toHaveBeenCalled();
  });

  it("targets the configured cloudsync base url", async () => {
    await rotate({ data: { accounts: [] }, version: 1 });
    expect(getCloudSyncApi).toHaveBeenCalledWith("https://cloudsync.test");
  });

  it("builds the cipher from the trustchain sdk", async () => {
    const { trustchainSdk } = await rotate({ data: { accounts: [] }, version: 1 });
    expect(makeCipher).toHaveBeenCalledWith(trustchainSdk);
  });

  it("reads the state at rotation time, not at construction time", async () => {
    const wsState = { data: null as unknown, version: 0 };
    const { trustchainSdk, lifecycle } = setup(wsState);
    const finish = await lifecycle.onTrustchainRotation!(
      trustchainSdk as never,
      oldTrustchain as never,
      memberCredentials as never,
    );

    // state appears only after the rotation started
    wsState.data = { accounts: ["late"] };
    wsState.version = 42;
    await finish(newTrustchain as never);

    expect(uploadData).toHaveBeenCalledWith(
      "jwt-for-new-root",
      liveSlug,
      42,
      "encrypted-payload",
      newTrustchain,
    );
  });

  it("propagates a delete failure without uploading", async () => {
    deleteData.mockRejectedValueOnce(new Error("delete failed"));

    await expect(rotate({ data: { accounts: [] }, version: 1 })).rejects.toThrow("delete failed");
    expect(uploadData).not.toHaveBeenCalled();
  });
});
