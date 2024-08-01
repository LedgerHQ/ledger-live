import { http, HttpResponse } from "msw";
import { setupServer, SetupServerApi } from "msw/node";
import { StreamTree } from "@ledgerhq/hw-trustchain";
import { HWDeviceProvider } from "../../HWDeviceProvider";
import { SDK } from "../../sdk";
import { TrustchainResultType } from "../../types";

describe("Trustchain SDK", () => {
  const HWDeviceProviderMethodsMocks = {
    withJwt: jest.fn(),
    withHw: jest.fn(),
    refreshJwt: jest.fn(),
    clearJwt: jest.fn(),
  } satisfies Partial<HWDeviceProvider>;

  const hwDeviceProviderMock = HWDeviceProviderMethodsMocks as unknown as HWDeviceProvider;

  let mswServer: SetupServerApi | undefined;

  beforeEach(() => {
    mswServer?.close();
    HWDeviceProviderMethodsMocks.withJwt.mockClear();
    HWDeviceProviderMethodsMocks.withHw.mockClear();
    HWDeviceProviderMethodsMocks.refreshJwt.mockClear();
    HWDeviceProviderMethodsMocks.clearJwt.mockClear();
  });

  it("should create Trustchain", async () => {
    const callbacks = {
      onStartRequestUserInteraction: jest.fn(),
      onEndRequestUserInteraction: jest.fn(),
    };

    HWDeviceProviderMethodsMocks.withJwt.mockImplementation(async (transport, job) =>
      job({ accessToken: "ACCESS TOKEN" }),
    );

    const reqCount = { trustchains: 0 };
    mswServer = setupServer(
      http.get("*/v1/trustchains", () => {
        switch (reqCount.trustchains++) {
          case 0: {
            return HttpResponse.json({});
          }
          case 1: {
            return HttpResponse.json({ ROOTID: { "m/": [] } });
          }
        }
      }),
      http.get("*/v1/trustchain/ROOTID", () =>
        HttpResponse.json({ "m/": MOCK_DATA.trustChains.tree1.root }),
      ),
      http.all("*", () => HttpResponse.json({})),
    );
    mswServer.listen();

    HWDeviceProviderMethodsMocks.withHw.mockResolvedValueOnce(
      StreamTree.deserialize({ "m/": MOCK_DATA.trustChains.tree1.root }),
    );
    HWDeviceProviderMethodsMocks.withHw.mockResolvedValueOnce(
      StreamTree.deserialize({
        "m/": MOCK_DATA.trustChains.tree1.root,
        "m/0'/16'/0':": MOCK_DATA.trustChains.tree1.pushMember,
      }),
    );

    const sdk = new SDK({ applicationId: 16, name: "Foo" }, hwDeviceProviderMock);

    const { type, trustchain } = await sdk.getOrCreateTrustchain(
      "foo",
      MOCK_DATA.credentials.member1,
      callbacks,
      new Uint8Array(0x1234),
    );

    expect(type).toBe(TrustchainResultType.created);
    expect(trustchain).toEqual({
      applicationPath: "m/0'/16'/0'",
      rootId: "ROOTID",
      walletSyncEncryptionKey: expect.any(String),
    });
    // TODO add more expectations
  });
});

const MOCK_DATA = {
  credentials: {
    member1: {
      pubkey: "0306af506179ca737dbd45a699aa5ea5d2fe5f32a5517b60e642f3e0f4f8aae882",
      privatekey: "75e25449353cfd6952d61b88f257dc529d579d6e590bec175980449bcb49627e",
    },
  },
  trustChains: {
    tree1: {
      root: "0101010220ce28e53bc4b6b5266f5850ab5a712de83346e4e32f598cd457ba051408b321d10621032348f4c7d507c5aa2c00e9e9b71f0cdc137b59afe62a220bded59311df26cc9301010110b005000102000006210324d6d2be4dc02bec8014226e8dabd0df745605e3421d4f988241e6892578ca360510395f2994be710a27992193c8fd62578005502629b9325c9635157f7c49514a66c0a0d42af5210192ecb2e5f46bf7dcc77ab179f9e3633d5cefd0972d285dd18683742cf804b6ec4a68882033b9a9cdff7c3ddc78bca5f2ca6036d0bb01bc5a307f19062102b293202376dd8c70732cae2ab39f04beb321e5cbc8b77b2220862801f6006941034630440220238b0e5614e485ba1f227519e7f9f084f8c1f62caa389c2e72aa2a744942895202205637356693f558f71915396ba7a43db12eaaa7edbe53d3165aaab96ce22bf157",
      pushMember:
        "0101010220f21394bdef8bc27a0695e80896c1de7242a586c403274e20abbbd75c5eb7cc990621032348f4c7d507c5aa2c00e9e9b71f0cdc137b59afe62a220bded59311df26cc9301010315b8050c800000008000001080000000062102846c94806532b7102712aa37a223c9709a2f16e0602f8cc752fac4764ade82e10510f70f41fe07c988db7030e9b1fc5b177505502e0b33584d7bcf45afb682e8a47461186d226d5e5d64188a1dba8e29933bbcd984956137173e31703195b346bfc60cd1a3d93a2f239cea8b8b800a50843aafa2d8b14314819af251f459e45bdd1b508d062102fe743822595843b7e69df5ca96c6cbc477400bcd97c519f546753c0226aaae54113304084d656d626572203106210306af506179ca737dbd45a699aa5ea5d2fe5f32a5517b60e642f3e0f4f8aae8820104ffffffff12aa0510cc9af7d206117c3f4cc0e523a8be7140055078dff588a71eea1994e14ea50b8db7c500d267a62cde4c30cf56ce4a3c6ad80d05600f9c8d68d5dd20194408a2e906ebc8d20972a77fc9b1d8d95d4baf2b794ad92ff2f287255eb90ce8b4be68b3e70106210306af506179ca737dbd45a699aa5ea5d2fe5f32a5517b60e642f3e0f4f8aae882062102275f88d0c6deb9ddd8b9184cd7a871827be1879e6add14c5deec077384361e3b03473045022100e5934425144f62896d0dfe12dae62a17bf019c21d12a1c57b08ae9844d38a67e02204c7b86d44a8cd27a9d56c244423340635a55afc94714fabb4c966ab7dfd46c8d",
    },
  },
};
