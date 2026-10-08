import { isConfidentialError, type Handle } from "@ledgerhq/coin-evm/confidential";
import { PreparedPermitExpiredError, RelayerRequestFailedError } from "@zama-fhe/sdk";
import { ZamaConfidentialClient, type ZamaSdkLike } from "./ZamaConfidentialClient";

const ACCOUNT = "0x0a101aA5347Bb16F43019BE42ce5830395739e33";
const WRAPPER = "0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639";
const HANDLE: Handle = "0x4a1e1aca2ef4eaf69b48b6c7c10504538c016862a3ff0000000000aa36a70500";
const START = 1_791_466_141;

const sdkPermit = {
  version: 1 as const,
  signerAddress: ACCOUNT,
  eip712: {
    domain: { name: "Decryption", version: "1", chainId: "11155111" },
    types: {},
    primaryType: "UserDecryptRequestVerification",
    message: { contractAddresses: [WRAPPER], startTimestamp: String(START), durationDays: "30" },
  },
};

function setup() {
  const sdk = {
    permits: { hasPermit: jest.fn().mockResolvedValue(true), registerPermit: jest.fn() },
    offline: { preparePermit: jest.fn().mockResolvedValue(sdkPermit) },
    decryption: { decryptValues: jest.fn() },
  };
  const createSdk = jest.fn(() => sdk as unknown as ZamaSdkLike);
  const client = new ZamaConfidentialClient({ rpcUrl: "rpc", relayerUrl: "relayer", createSdk });
  return { client, sdk, createSdk };
}

describe("ZamaConfidentialClient", () => {
  beforeEach(() => jest.spyOn(Date, "now").mockReturnValue((START + 60) * 1000));
  afterEach(() => jest.restoreAllMocks());

  it("prepares a permit with the expiry the device will show", async () => {
    const { client, sdk } = setup();
    const prepared = await client.preparePermit(ACCOUNT, [WRAPPER]);
    expect(sdk.offline.preparePermit).toHaveBeenCalledWith({
      signer: ACCOUNT,
      contracts: [WRAPPER],
    });
    expect(prepared).toEqual({
      typedData: sdkPermit.eip712,
      signerAddress: ACCOUNT,
      contracts: [WRAPPER],
      expiresAt: START + 30 * 86_400,
    });
  });

  it("registers the prepared SDK permit with the device signature, then reports it covered", async () => {
    const { client, sdk } = setup();
    expect(await client.getPermitStatus(ACCOUNT, [WRAPPER])).toEqual([]);

    const prepared = await client.preparePermit(ACCOUNT, [WRAPPER]);
    await client.registerPermit(prepared, "0xsig");

    expect(sdk.permits.registerPermit).toHaveBeenCalledWith(sdkPermit, "0xsig");
    expect(await client.getPermitStatus(ACCOUNT.toLowerCase(), [WRAPPER])).toEqual([
      { contract: WRAPPER, expiresAt: START + 30 * 86_400 },
    ]);
  });

  it("reports no permit once it has expired", async () => {
    const { client } = setup();
    await client.registerPermit(await client.preparePermit(ACCOUNT, [WRAPPER]), "0xsig");
    jest.spyOn(Date, "now").mockReturnValue((START + 31 * 86_400) * 1000);
    expect(await client.getPermitStatus(ACCOUNT, [WRAPPER])).toEqual([]);
  });

  it("refuses a permit it did not prepare", async () => {
    const { client } = setup();
    const foreign = {
      typedData: sdkPermit.eip712,
      signerAddress: ACCOUNT,
      contracts: [WRAPPER],
      expiresAt: 0,
    };
    await expect(client.registerPermit(foreign, "0xsig")).rejects.toMatchObject({
      code: "PermitRequired",
    });
  });

  it("maps an expired prepared permit to PermitExpired", async () => {
    const { client, sdk } = setup();
    const prepared = await client.preparePermit(ACCOUNT, [WRAPPER]);
    sdk.permits.registerPermit.mockRejectedValue(new PreparedPermitExpiredError("expired"));
    await expect(client.registerPermit(prepared, "0xsig")).rejects.toMatchObject({
      code: "PermitExpired",
    });
  });

  it("decrypts handles, whatever the case of the keys the SDK returns", async () => {
    const { client, sdk } = setup();
    sdk.decryption.decryptValues.mockResolvedValue({
      [HANDLE.toUpperCase().replace("0X", "0x")]: 25n,
    });
    expect(await client.decrypt(ACCOUNT, [{ handle: HANDLE, contract: WRAPPER }])).toEqual({
      [HANDLE]: 25n,
    });
    expect(sdk.decryption.decryptValues).toHaveBeenCalledWith([
      { encryptedValue: HANDLE, contractAddress: WRAPPER },
    ]);
  });

  it("gives every handle the typed error when the relayer fails the batch", async () => {
    const { client, sdk } = setup();
    sdk.decryption.decryptValues.mockRejectedValue(new RelayerRequestFailedError("down"));
    const result = await client.decrypt(ACCOUNT, [{ handle: HANDLE, contract: WRAPPER }]);
    expect(isConfidentialError(result[HANDLE], "RelayerError")).toBe(true);
  });

  it("keeps one SDK per account", async () => {
    const { client, createSdk } = setup();
    await client.getPermitStatus(ACCOUNT, [WRAPPER]);
    await client.getPermitStatus(ACCOUNT.toLowerCase(), [WRAPPER]);
    await client.getPermitStatus("0x0000000000000000000000000000000000000b0b", [WRAPPER]);
    expect(createSdk).toHaveBeenCalledTimes(2);
  });

  it("does not offer the transfer and unshield calls yet", async () => {
    const { client } = setup();
    await expect(client.prepareTransfer()).rejects.toMatchObject({ code: "Unavailable" });
  });
});
