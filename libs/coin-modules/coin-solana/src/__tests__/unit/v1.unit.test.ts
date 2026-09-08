import { Connection } from "@solana/web3.js";
import { getChainAPI } from "../../network/chain/index";
import { toLiveTransaction } from "../../rawTransaction";

// Pre-built v1 SOL transfer (version byte 0x81), fake blockhash, PAYER signing to self.
// Structurally valid but not broadcastable.
const V1_TX_FIXTURE =
  "gQEAAQAAAADMSQ6SjNLjhzuzQ/yV2jMXnKYPTb9GwsNukSmdVdTmuQEC5IvdNmgZwhyUJ0IuhnzsDudAywLFWcA265wPkApgEc8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAECDAAAAAIAAADoAwAAAAAAAEH610qbrnhmDJP0YUcU3KB6WsCwYc3e01URupdUSSP3NyLxaWfi+6eGOTuxD1svmfseABS6cB7BfKFKeFFaEA8=";

describe("Solana v1 transaction support (SIMD-0385)", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("passes maxSupportedTransactionVersion: 1 to getParsedTransactions", async () => {
    const spy = jest.spyOn(Connection.prototype, "getParsedTransactions").mockResolvedValue([]);
    const api = getChainAPI({ endpoint: "http://localhost:8899" });
    await api.getParsedTransactions(["5Et9TMD3YMTXAJWnraSe8Tgf5SaV5TbsFNXqZeD83d1"]);
    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ maxSupportedTransactionVersion: 1 }),
    );
  });

  it("toLiveTransaction handles a v1 transaction without throwing", async () => {
    jest
      .spyOn(Connection.prototype, "getFeeForMessage")
      .mockResolvedValue({ context: { slot: 1 }, value: 5000 });
    const api = getChainAPI({ endpoint: "http://localhost:8899" });
    const result = await toLiveTransaction(api, V1_TX_FIXTURE);
    expect(result.raw).toEqual(V1_TX_FIXTURE);
  });
});
