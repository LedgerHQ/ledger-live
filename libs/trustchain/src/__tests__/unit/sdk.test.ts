import { http, HttpResponse } from "msw";
import { setupServer, SetupServerApi } from "msw/node";
import Transport from "@ledgerhq/hw-transport";
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
    const transport = {} as Transport;
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
      http.get("*/v1/trustchain/ROOTID", () => HttpResponse.json(MOCK_DATA.TrustChain_INITIAL)),
      http.all("*", () => HttpResponse.json({})),
    );
    mswServer.listen();

    HWDeviceProviderMethodsMocks.withHw.mockResolvedValueOnce(
      StreamTree.deserialize(MOCK_DATA.TrustChain_INITIAL),
    );
    HWDeviceProviderMethodsMocks.withHw.mockResolvedValueOnce(
      StreamTree.deserialize(MOCK_DATA.TrustChain_WithMemberEvent),
    );

    const sdk = new SDK({ applicationId: 16, name: "Foo" }, hwDeviceProviderMock);

    const { type, trustchain } = await sdk.getOrCreateTrustchain(
      transport,
      MOCK_DATA.Member1Creds,
      callbacks,
      new Uint8Array(0x1234),
    );

    expect(type).toBe(TrustchainResultType.created);
    expect(trustchain).toEqual({
      applicationPath: "0h/16h/0h",
      rootId: "ROOTID",
      walletSyncEncryptionKey: "bcc1d039696b02f9bc6c1e85399d4c57829c4c5209e5a879ec5a4aff080b3f73",
    });
    // TODO add more expectations
  });
});

const MOCK_DATA = {
  Member1Creds: {
    pubkey: "02468c0c825f762ffd2dba89597a6425de814869272d9e651f4c49c6d24c79f250",
    privatekey: "647d597c681ef08b276fdc6670bf05e76d3b29bbd7f1220d6948c9967cb94e41",
  },
  TrustChain_INITIAL: {
    "m/": "01010102200c86b0ef263a725a53ab014bffe1f619ce4f3cdfbc11768135bba8c0ce5cdcde062103876b4fbf687fef6a46fa3733858c53ac22a6fb84532308a1ba58021cded4e96e01010110a00500010200000621030bc1cf68147d77848d23dd1fd5271f1433b493d4bcf139eec326baacacbbb0e90510607700660f38df49e93692b29521d1dd054071e3b4307caa47ec1526b62891771b069d81d49f2c8cd41c21d7fe1f3883d875358bc12f3087bbad7f41e98d7ab527f5ebb0b40b702ac96266cbb33a520bcc3a062103b0a731447c67d3e54e90fc4b040a65500617058f92bdec9c3f3d7793ffad994b03473045022100e8a08b5ce96c6525e16513f7c2cfdb26917aafa63cb0b20b3bd736d01c37e1fd0220659d528f5bdf489d8b79b328c2dc2c79ed52a4b4bd7389e6b1f5033351e067b5",
    "m/16'":
      "0101010220b0db865a16d051d0846ba264f766f02a66177fdbb823f2eff815a14ccb6d82d6062103876b4fbf687fef6a46fa3733858c53ac22a6fb84532308a1ba58021cded4e96e01010315a8050c8000000080000010800000000621035c1b48a973a500795072671fccf424e5ee215803e656675a491af03d6b9905ad05106428c07380e18113ab7ec2ca1a713bdf05402e2ffe8cce425eb453698edce12e8cabe2bd497b8ab8c12c0c3644feee685bf701443cfdb08a0843057f1264a166504699a3ff76b8016ecb74fd1f3c58cbf7b0062103c8cbd99eda76a1f07b46a47787b7a3acfec2d9c513d84c05a9c2c25d1e30fd84113304084d656d6265722031062103884b6d7e53c6ced2ef9e3a437a49e34fc80521f4d3bf2191a475c4a86a8c42930104ffffffff129a0510895270bd9fa3cc7e56c22c9ebd1dc1960540ff2a8ebdde86c6ee04fcceddb077b0f374379543726c7280e9f338972923c262b7fde54f90deb33351b5bdf8754beac19ddd378152a426b1c8c9dfd827ba4149062103884b6d7e53c6ced2ef9e3a437a49e34fc80521f4d3bf2191a475c4a86a8c42930621029c441b5e1453a6cccf95d88632d3dcba15d5a2962d02454231382076c8e8715a034630440220747e082c6374e91ecbe455b3c4c5f59b347840aaafc793e36c57da4b42666eeb02201897fde347a4c08e45fb2fa715cc92e93f92ace1f7953ee81e0e3f74ec054d840101010220f60871c944c3256137a0f4d277ea4bab89ecdfd02abe96025f95fd6bd4bc5a5f062103884b6d7e53c6ced2ef9e3a437a49e34fc80521f4d3bf2191a475c4a86a8c4293010102113304084d656d6265722032062102daa64396c98fc4d8ad09d62fa447e70a9630317a51c4649770da0aa3ff21d09b0104ffffffff129a05103640d466e03047243fc7bda15b7a042c05407a20912474b429f88ac31329e6d0690a31a21cfdf0afb70efc8bcaedcf6c42720df865cf72171456f5f23d33ed2666a5cbaa707069081520cd17fa01cdfdb3f5062102daa64396c98fc4d8ad09d62fa447e70a9630317a51c4649770da0aa3ff21d09b062102c3e22f5016b01a13a7cfeca5e95cc9e77ae60455be5060911f8246eb8d2d34a5034630440220735eb8b6b197377ac007ad346371b3e3b2d0897793ba66b9d562cd87538563b802201bba1ec01bbe3d54d33554dbbbb7a90fb1f282a434ddcbe0ff8a4d3e3302ca4d01010102208b3c8f811467e3abe307cf8c1d31159f46d7a00ecc331c3a5ac60170495ebf30062102daa64396c98fc4d8ad09d62fa447e70a9630317a51c4649770da0aa3ff21d09b010102113304084d656d6265722033062102468c0c825f762ffd2dba89597a6425de814869272d9e651f4c49c6d24c79f2500104ffffffff129a0510a9a61814a6b2b4a849642d06226da5ab0540214d734840ddd662c993054e199f50b4c246e88e63d07e290b2155c1468ccfbc8177837df02cf6d363991109c48eebacd3ef7e314112a1b23275a4f350512137062102468c0c825f762ffd2dba89597a6425de814869272d9e651f4c49c6d24c79f25006210225ad4f97bbeca3ba46dbee619c12a9cb1ec7e8d1c8a39b4d2eb9445582553d560346304402201985d7cb1554edc09c326f51222b842def1c7d85b019bd6c377fad3da0756b43022078fa547d08c8290779243eb23e2263521f032df859deab34b17d5311daf52c72",
  },
  get TrustChain_WithMemberEvent() {
    return {
      ...MOCK_DATA.TrustChain_INITIAL,
      "m/16'/1'":
        "0101010220b0db865a16d051d0846ba264f766f02a66177fdbb823f2eff815a14ccb6d82d6062103876b4fbf687fef6a46fa3733858c53ac22a6fb84532308a1ba58021cded4e96e01010315a8050c800000008000001080000001062102180fb61478effbcc9bb1936d53cde944ab10665b92315685ca0cc6e1dc95c8b805108d6af2f63b886612d94666360696fb0d0540382681bf91dc86eb8955a290d61ebacd26b0d994eaca4ec434f636fe5bbd1e67d1c65a3f7499aca41ed878dc6618437168049915a8e383126c40db38473ee80b0621038e8c2b3ea07d9395ef091deb1ef2a424ce89c566f4d355fe7bd1dd3fe28f71f0113304084d656d6265722031062103884b6d7e53c6ced2ef9e3a437a49e34fc80521f4d3bf2191a475c4a86a8c42930104ffffffff129a05104902d1b7db7f229c36c8f3cbbb5a13730540cb379619135b39bb164c0ca4b0696ae8bcea12b3a27401dfa71224b7bd45b976994c46a2adca47208a825bad126b6ee4eaf3ccf8a781c099b9352d7dd2cfb23a062103884b6d7e53c6ced2ef9e3a437a49e34fc80521f4d3bf2191a475c4a86a8c4293062103b8b6bfbd2baf40cde9487e1d7a5736318dec264b164512467c6ef9fd5c765efb03463044022035ba2f3be833d41a2ebcf71f634ff3fedcb36153aab66f652e24aa3c14dadd39022044853b43206f2631d6afbb32d21c31da2a5b63c91931c2c8867ab2157defb140010101022096da6577f731b3da7f0334f67883f36b2f2321b73f8628a306f2ce899c5b6010062103884b6d7e53c6ced2ef9e3a437a49e34fc80521f4d3bf2191a475c4a86a8c4293010102113304084d656d6265722033062102468c0c825f762ffd2dba89597a6425de814869272d9e651f4c49c6d24c79f2500104ffffffff129a05103a2d677e3c8203cab2ffecefb7013c8705409a4a23b9254927c2ff8d8567cfb3375d78b8b0f5d0cc362acf9576fa520c9e9fbfe0341ef77f01f95edb5340c548d95e529219f135b7f0319f8a77e39939d49c062102468c0c825f762ffd2dba89597a6425de814869272d9e651f4c49c6d24c79f250062102260478a3f0809f58a0752e649c8fc9f130e42752574f6b8df2e15c0970c7527b034730450221008275c56a119cdce41beff924485853baea2e1ef444f4c4b1fb5b23746a391f5b02200a585abef1de4577617176921526570dcd1bad603b156cb56869dc4d055c94e4",
    };
  },
};
