import { http, HttpResponse, PathParams, StrictRequest } from "msw";
import { setupServer } from "msw/node";
import { crypto, Device, Permissions, SoftwareDevice, StreamTree } from "@ledgerhq/hw-trustchain";
import { getEnv } from "@ledgerhq/live-env";
import { PutCommandsRequest } from "../../api";
import { HWDeviceProvider } from "../../HWDeviceProvider";
import { convertLiveCredentialsToKeyPair, SDK } from "../../sdk";
import { TrustchainResultType } from "../../types";

describe("Trustchain SDK", () => {
  // Setup API calls mocks
  const apiMocks = {
    getTrustchainsMock: jest.fn(),
    getTrustchainByIdMock: jest.fn(),
    getChalenge: jest.fn(),
    postAuthenticate: jest.fn(),
    putCommands: jest.fn<object, [StrictRequest<PutCommandsRequest>]>(),
  };
  const mswServer = setupServer(
    http.get("*/v1/trustchains", () => HttpResponse.json(apiMocks.getTrustchainsMock())),
    http.get("*/v1/trustchain/ROOTID", () => HttpResponse.json(apiMocks.getTrustchainByIdMock())),
    http.put<PathParams, PutCommandsRequest>("*/v1/trustchain/ROOTID/commands", ({ request }) =>
      HttpResponse.json(apiMocks.putCommands(request)),
    ),
    http.get("*/v1/challenge", () => HttpResponse.json(apiMocks.getChalenge())),
    http.post("*/v1/authenticate", () => HttpResponse.json(apiMocks.postAuthenticate())),
    http.all("*", () => HttpResponse.json({})),
  );
  mswServer.listen();

  // Setup APDU device interactions mocks
  const HWDeviceProviderMethodsMocks = {
    withJwt: jest.fn(),
    withHw: jest.fn(),
    refreshJwt: jest.fn(),
    clearJwt: jest.fn(),
  } satisfies Partial<HWDeviceProvider>;
  const hwDeviceProviderMock = HWDeviceProviderMethodsMocks as unknown as HWDeviceProvider;
  const deviceCallbacks = {
    onStartRequestUserInteraction: jest.fn(),
    onEndRequestUserInteraction: jest.fn(),
  };

  afterAll(() => {
    mswServer.close();
  });

  const apiBaseUrl = getEnv("TRUSTCHAIN_API_STAGING");
  const sdkContext = { applicationId: 16, name: "Foo", apiBaseUrl };

  beforeEach(() => {
    Object.values(apiMocks).forEach(mock => mock.mockClear());
    Object.values(HWDeviceProviderMethodsMocks).forEach(mock => mock.mockClear());
    Object.values(deviceCallbacks).forEach(mock => mock.mockClear());
  });

  it("should create Trustchain", async () => {
    // Mock trustchain states:
    const device = new SoftwareDevice(convertLiveCredentialsToKeyPair(MOCK_DATA.members.alice));
    const initialTree = await createTrustChain(device);
    const oneMemberTree = await addMember(device, "m/0'/16'/0'", "alice")(initialTree);

    // Mock API calls:
    apiMocks.getTrustchainsMock.mockReturnValueOnce({});
    apiMocks.getTrustchainsMock.mockReturnValueOnce({ ROOTID: { "m/": [] } });
    apiMocks.getTrustchainByIdMock.mockReturnValue(initialTree.serialize());

    // Mock APDU device interactions:
    HWDeviceProviderMethodsMocks.withJwt.mockImplementation(async (deviceId, job) =>
      job({ accessToken: "ACCESS TOKEN" }),
    );
    HWDeviceProviderMethodsMocks.withHw.mockResolvedValueOnce(initialTree);
    HWDeviceProviderMethodsMocks.withHw.mockResolvedValueOnce(oneMemberTree);

    // Run the test:
    const sdk = new SDK(sdkContext, hwDeviceProviderMock);
    const { alice } = MOCK_DATA.members;
    const { type, trustchain } = await sdk.getOrCreateTrustchain("foo", alice, deviceCallbacks);

    // Check expectations:
    expect(type).toBe(TrustchainResultType.created);
    expect(trustchain).toEqual({
      applicationPath: "m/0'/16'/0'",
      rootId: "ROOTID",
      walletSyncEncryptionKey: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
    // TODO add more expectations
  });

  it("should remove a member from the Trustchain", async () => {
    // Mock trustchain states:
    const device = new SoftwareDevice(convertLiveCredentialsToKeyPair(MOCK_DATA.members.alice));
    const threeMembersTree = await createTrustChain(device)
      .then(addMember(device, "m/0'/16'/0'", "alice"))
      .then(addMember(device, "m/0'/16'/0'", "bob"))
      .then(addMember(device, "m/0'/16'/0'", "charlie"));
    const rmMembersTree = await addMember(device, "m/0'/16'/1'", "alice")(threeMembersTree);

    // Mock API calls:
    apiMocks.getTrustchainByIdMock.mockReturnValue(threeMembersTree.serialize());
    apiMocks.getChalenge.mockReturnValue({ json: {}, tlv: MOCK_DATA.challengeTlv });
    apiMocks.postAuthenticate.mockReturnValue({
      accessToken: "BACKEND JWT",
      permissions: { ROOTID: { "m/0'/16'/1'": ["owner"] } },
    });

    // Mock APDU device interactions:
    HWDeviceProviderMethodsMocks.withJwt.mockImplementation(async (deviceId, job) =>
      job({ accessToken: "ACCESS TOKEN" }),
    );
    HWDeviceProviderMethodsMocks.withHw.mockResolvedValueOnce(threeMembersTree);
    HWDeviceProviderMethodsMocks.withHw.mockResolvedValueOnce(rmMembersTree);

    // Run the test:
    const sdk = new SDK(sdkContext, hwDeviceProviderMock);

    const { alice, bob, charlie } = MOCK_DATA.members;
    const trustchain = {
      applicationPath: "m/0'/16'/0'",
      rootId: "ROOTID",
      walletSyncEncryptionKey: "",
    };
    const memberToRemove = {
      name: "bob",
      id: bob.pubkey,
      permissions: Permissions.OWNER,
    };
    const res = await sdk.removeMember("foo", trustchain, alice, memberToRemove, deviceCallbacks);

    // Check expectations:
    expect(res).toEqual({
      applicationPath: "m/0'/16'/1'",
      rootId: "ROOTID",
      walletSyncEncryptionKey: expect.stringMatching(/^[0-9a-f]{64}$/),
    });

    const lastCommand = await Promise.all(
      apiMocks.putCommands.mock.calls.map(([request]) => request.json()),
    ).then(commands => commands.filter(({ path }) => path === "m/0'/16'/1'").at(-1)?.blocks[0]);
    expect(lastCommand).toContain(alice.pubkey);
    expect(lastCommand).not.toContain(bob.pubkey);
    expect(lastCommand).toContain(charlie.pubkey);
    // TODO add more expectations
  });
});

const MOCK_DATA = {
  members: {
    alice: {
      pubkey: "02e3311a12c450604725f02d1a775ef5cdb4a1b832eb41ac6b1302adbe92a612fc",
      privatekey: "873f500bd20783224f7e78d4f8cce3d2bf69eb8008fbd697d20bbea31a721a03",
    },
    bob: {
      pubkey: "034ac6813695b0d5e033a2a19061c83951e2241aad62ec8fa347a944831c07ea82",
    },
    charlie: {
      pubkey: "03b4165cddf39e58f3a89682fdf1ccba213167084fecdbb3b86669d40d201df1cf",
    },
  },

  challengeTlv:
    "010107020100121053801a35c2e24b627d6e4925ce318980140101154630440220319b42a416512437e48d9c9bf204daea7da03d452c50a8caa4c2d152407ffd0c02201f121b0e99df1d30f4757b6a00b8d974d70996771893ac49c4a245c147cc1d8f160466a90248202b7472757374636861696e2d6261636b656e642e6170692e6177732e7374672e6c64672d746563682e636f6d320121332103cb7628e7248ddf9c07da54b979f16bf081fb3d173aac0992ad2a44ef6a388ae2600401000000",
};

function createTrustChain(device: Device): Promise<StreamTree> {
  return StreamTree.createNewTree(device);
}

function addMember(
  device: Device,
  path: string,
  name: keyof typeof MOCK_DATA.members,
): (tree: StreamTree) => Promise<StreamTree> {
  const memberId = crypto.from_hex(MOCK_DATA.members[name].pubkey);
  return (tree: StreamTree) => tree.share(path, device, memberId, name, Permissions.OWNER);
}
