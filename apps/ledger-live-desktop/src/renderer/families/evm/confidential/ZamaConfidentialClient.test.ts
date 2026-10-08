import { isConfidentialError, type Handle } from "@ledgerhq/coin-evm/confidential";
import { PreparedPermitExpiredError, RelayerRequestFailedError } from "@zama-fhe/sdk";
import { ZamaConfidentialClient, type ZamaSdkLike } from "./ZamaConfidentialClient";

const ACCOUNT = "0x0a101aA5347Bb16F43019BE42ce5830395739e33";
const WRAPPER = "0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639";
const USDC = "0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF";
const RECIPIENT = "0xa92Bd6359601D00Ed49E34079EE91670c34aCF80";
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
    registry: {
      getConfidentialToken: jest
        .fn()
        .mockResolvedValue({ confidentialTokenAddress: WRAPPER, isValid: true }),
    },
  };
  const createSdk = jest.fn(() => sdk as unknown as ZamaSdkLike);
  const client = new ZamaConfidentialClient({
    rpcUrl: "rpc",
    relayerUrl: "relayer",
    oracleUrl: "http://oracle",
    createSdk,
  });
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

  it("reads the wrapper from the registry", async () => {
    const { client, sdk } = setup();
    expect(await client.getConfidentialToken(USDC)).toEqual({ wrapper: WRAPPER, isValid: true });
    expect(sdk.registry.getConfidentialToken).toHaveBeenCalledWith(USDC);
    sdk.registry.getConfidentialToken.mockResolvedValue(null);
    expect(await client.getConfidentialToken(USDC)).toBeNull();
  });

  describe("prepareTransfer", () => {
    const request = { from: ACCOUNT, wrapper: WRAPPER, to: RECIPIENT, amount: 750_000n };
    const fetchMock = jest.fn();
    beforeEach(() => {
      fetchMock.mockReset();
      global.fetch = fetchMock;
    });
    const answer = (status: number, body: unknown) =>
      fetchMock.mockResolvedValue({ ok: status < 300, status, json: async () => body });

    it("asks the service for the transfer and returns its transaction and handle", async () => {
      const { client } = setup();
      answer(200, { unsignedTx: "0x02f901b0", handle: HANDLE.toUpperCase().replace("0X", "0x") });
      expect(await client.prepareTransfer(request)).toEqual({
        transaction: "0x02f901b0",
        handle: HANDLE,
      });
      expect(fetchMock).toHaveBeenCalledWith("http://oracle/prepare/transfer", expect.anything());
      expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
        chainId: 11155111,
        from: ACCOUNT,
        token: WRAPPER,
        to: RECIPIENT,
        amount: "750000",
      });
    });

    it.each([
      ["WRAPPER_NOT_REGISTERED", 422, "WrapperNotRegistered"],
      ["RELAYER_ERROR", 502, "RelayerError"],
      ["INSUFFICIENT_INPUT", 422, "Unknown"],
    ])("maps the service error %s", async (code, status, expected) => {
      const { client } = setup();
      answer(status, { error: { code, message: "refused" } });
      await expect(client.prepareTransfer(request)).rejects.toMatchObject({ code: expected });
    });

    it("reports an unreachable service", async () => {
      const { client } = setup();
      fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
      await expect(client.prepareTransfer(request)).rejects.toMatchObject({
        code: "OracleUnavailable",
      });
    });
  });

  it("does not offer the unshield calls yet", async () => {
    const { client } = setup();
    await expect(client.publicDecrypt()).rejects.toMatchObject({ code: "Unavailable" });
  });
});
