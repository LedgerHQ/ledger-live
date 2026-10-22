import { InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";
import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { Address, Cell, comment } from "@ton/core";
import { keyPairFromSeed } from "@ton/crypto";
import { WalletContractV4 } from "@ton/ton";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { TON_API_MOCKED, createMockTonContext } from "../../test/context";
import { NOT_MASTER, OWNER, PEER_RAW } from "../../test/history.fixtures";
import { decodeTransferBody } from "../../test/transferBody";
import type { TonMemo } from "../../types";
import { estimateFees } from "../estimateFees";

const SOURCE_FEES = { in_fwd_fee: 400000, storage_fee: 30, gas_fee: 1323200, fwd_fee: 266669 };
const publicKey = keyPairFromSeed(Buffer.alloc(32, 7)).publicKey;
const PEER = Address.parse(PEER_RAW).toString({ urlSafe: true, bounceable: false });
const PEER_MISTYPED = `${PEER.slice(0, -1)}${PEER.endsWith("A") ? "B" : "A"}`;

const intent = (overrides: Partial<TransactionIntent<TonMemo>> = {}): TransactionIntent<TonMemo> =>
  ({
    intentType: "transaction",
    type: "send",
    sender: OWNER,
    recipient: PEER_RAW,
    amount: 1_000_000_000n,
    asset: { type: "native" },
    sequence: 3n,
    memo: { type: "none" },
    ...overrides,
  }) as TransactionIntent<TonMemo>;

type EstimateRequest = {
  address: string;
  body: string;
  init_code?: string;
  init_data?: string;
  ignore_chksig: boolean;
};

describe("estimateFees", () => {
  const server = setupServer();
  const context = createMockTonContext();
  let request: EstimateRequest | undefined;

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  beforeEach(() => {
    request = undefined;
    server.use(
      http.post(`${TON_API_MOCKED}/estimateFee`, async ({ request: received }) => {
        request = (await received.json()) as EstimateRequest;
        return HttpResponse.json({ source_fees: SOURCE_FEES, destination_fees: [] });
      }),
    );
  });
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  const signedTransfer = () => {
    const slice = Cell.fromBase64(request?.body ?? "").beginParse();
    return { signature: slice.loadBuffer(64), transfer: decodeTransferBody(slice.asCell()) };
  };

  it("prices a native transfer with every source fee, without checking the signature", async () => {
    await expect(estimateFees(context, intent())).resolves.toEqual({ value: 1989899n });

    expect(request).toEqual(expect.objectContaining({ address: OWNER, ignore_chksig: true }));
    expect(request?.init_code).toBeUndefined();
    const { signature, transfer } = signedTransfer();
    expect(signature).toEqual(Buffer.alloc(64));
    expect(transfer).toEqual(
      expect.objectContaining({ seqno: 3, to: Address.parse(PEER_RAW), amount: 1_000_000_000n }),
    );
  });

  it.each([
    ["not typed in yet", "not an address"],
    ["with a checksum typo", PEER_MISTYPED],
  ])("prices a recipient %s as the zero address", async (_, recipient) => {
    await estimateFees(context, intent({ recipient }));

    expect(signedTransfer().transfer).toEqual(
      expect.objectContaining({ to: new Address(0, Buffer.alloc(32)), bounce: true }),
    );
  });

  it("prices a comment too long for the device across cells", async () => {
    const text = "x".repeat(200);

    await expect(
      estimateFees(context, intent({ memo: { type: "string", kind: "comment", value: text } })),
    ).resolves.toEqual({ value: 1989899n });

    expect(signedTransfer().transfer.payload?.hash()).toEqual(comment(text).hash());
  });

  it("deploys the wallet in the priced message of its first transfer", async () => {
    const { init } = WalletContractV4.create({ workchain: 0, publicKey });

    await estimateFees(
      context,
      intent({ sequence: 0n, senderPublicKey: publicKey.toString("hex") }),
    );

    expect(request?.init_code).toBe(init.code.toBoc().toString("base64"));
    expect(request?.init_data).toBe(init.data.toBoc().toString("base64"));
  });

  it.each([
    ["no public key", undefined],
    ["the address instead of the public key", OWNER],
    ["a truncated public key", publicKey.toString("hex").slice(0, 62)],
  ])("needs the public key to price a wallet's first transfer, given %s", async (_, key) => {
    await expect(
      estimateFees(context, intent({ sequence: 0n, senderPublicKey: key })),
    ).rejects.toThrow(InvalidParameterError);
  });

  it("charges a jetton transfer the 0.1 TON it attaches, without asking the node", async () => {
    await expect(
      estimateFees(
        context,
        intent({ asset: { type: "jetton", assetReference: NOT_MASTER, assetOwner: OWNER } }),
      ),
    ).resolves.toEqual({ value: 100_000_000n });
    expect(request).toBeUndefined();
  });
});
