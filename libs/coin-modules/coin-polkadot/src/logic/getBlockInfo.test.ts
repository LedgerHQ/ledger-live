import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import type { PolkadotCoinConfig } from "../config";
import type { SidecarBlock, SidecarExtrinsic } from "../network/types";
import { polkadotMainnetConfigValue } from "../test/config.fixture";
import { getBlockInfo } from "./getBlockInfo";

const SIDECAR_URL = "https://polkadot.sidecar.test";
const config: PolkadotCoinConfig = { ...polkadotMainnetConfigValue, sidecar: { url: SIDECAR_URL } };

const timestampInherent = (): SidecarExtrinsic => ({
  method: { pallet: "timestamp", method: "set" },
  signature: null,
  nonce: null,
  args: { now: "1793704368000" },
  tip: null,
  hash: "0xtimestamp",
  era: { immortalEra: "0x00" },
  events: [],
  success: true,
  paysFee: false,
});

const signedTransfer = (): SidecarExtrinsic => ({
  method: { pallet: "balances", method: "transferKeepAlive" },
  signature: {
    signature: "0x700a",
    signer: { id: "12burmzVh1dCeZ9KRUV6Pmtabg9MNBNkCh9K7pbzV8dV7xrf" },
  },
  nonce: "0",
  args: {},
  tip: "0",
  hash: "0x36e4",
  era: { immortalEra: "0x00" },
  events: [],
  success: true,
  paysFee: true,
});

const block = (overrides: Partial<SidecarBlock> = {}): SidecarBlock => ({
  number: "22653132",
  hash: "0xdfb85c23d2f195e70e87418cb8d3889b1a5a7cb22d46447b6c5d40b9b7eae1fc",
  parentHash: "0xcfd1fab61599d8545e3f74f127fcd05ebfba9ec374ddf6bb227ae8b123d06ec1",
  stateRoot: "0xd589",
  extrinsicsRoot: "0xcbf1",
  authorId: "134BxqvdkMzf1v95j1Wr2NmXoqpys2Y96GXG5a5H3YtMKLqf",
  logs: [],
  extrinsics: [timestampInherent()],
  onFinalize: { events: [] },
  finalized: true,
  ...overrides,
});

describe("getBlockInfo", () => {
  const mockServer = setupServer();
  const blockEndpoint = jest.fn<SidecarBlock | { error: string }, [string]>();

  beforeAll(() => mockServer.listen({ onUnhandledRequest: "error" }));
  beforeEach(() => {
    blockEndpoint.mockReset();
    mockServer.use(
      http.get(`${SIDECAR_URL}/blocks/:blockId`, ({ params }) => {
        const body = blockEndpoint(String(params.blockId));
        return HttpResponse.json(body, { status: "error" in body ? 400 : 200 });
      }),
    );
  });
  afterEach(() => mockServer.resetHandlers());
  afterAll(() => mockServer.close());

  it("returns the hash, the timestamp and the parent of the block at the given height", async () => {
    blockEndpoint.mockReturnValue(block());

    const info = await getBlockInfo(config, 22653132);

    expect(blockEndpoint).toHaveBeenCalledWith("22653132");
    expect(info).toEqual({
      height: 22653132,
      hash: "0xdfb85c23d2f195e70e87418cb8d3889b1a5a7cb22d46447b6c5d40b9b7eae1fc",
      time: new Date(1793704368000),
      parent: {
        height: 22653131,
        hash: "0xcfd1fab61599d8545e3f74f127fcd05ebfba9ec374ddf6bb227ae8b123d06ec1",
      },
    });
  });

  it("returns the info of a partial block whose timestamp is decoded", async () => {
    const { method: _method, args: _args, ...undecodable } = signedTransfer();
    blockEndpoint.mockReturnValue(
      block({
        partial: true,
        extrinsics: [{ ...undecodable, decodeError: "Unable to decode" }, timestampInherent()],
      }),
    );

    const info = await getBlockInfo(config, 22653132);

    expect(info).toMatchObject({ height: 22653132, time: new Date(1793704368000) });
  });

  it("returns the info of a block with a signed extrinsic whose fees are unavailable", async () => {
    blockEndpoint.mockReturnValue(
      block({
        extrinsics: [{ ...signedTransfer(), paysFee: null }, timestampInherent()],
      }),
    );

    const info = await getBlockInfo(config, 22653132);

    expect(info).toMatchObject({ height: 22653132, time: new Date(1793704368000) });
  });

  it("rejects a partial block whose timestamp cannot be decoded", async () => {
    const { method: _method, args: _args, ...undecodable } = timestampInherent();
    blockEndpoint.mockReturnValue(
      block({
        partial: true,
        extrinsics: [{ ...undecodable, decodeError: "Unable to decode" }],
      }),
    );

    await expect(getBlockInfo(config, 22653132)).rejects.toThrow(
      "Polkadot block 22653132 has no timestamp",
    );
  });

  it("rejects the genesis block, which has no timestamp", async () => {
    blockEndpoint.mockReturnValue(block({ number: "0", extrinsics: [] }));

    await expect(getBlockInfo(config, 0)).rejects.toThrow("Polkadot block 0 has no timestamp");
  });

  it("rejects a block the sidecar does not find", async () => {
    blockEndpoint.mockReturnValue({
      error: "Block not found: Block at height 999999999 not found",
    });

    await expect(getBlockInfo(config, 999999999)).rejects.toThrow(
      "Block at height 999999999 not found",
    );
  });
});
