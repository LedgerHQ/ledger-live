import { fetchNonce } from "../../network/api";
import { getNextSequence } from "../getNextSequence";

jest.mock("../../network/api");

describe("getNextSequence", () => {
  it("returns the possible_next_nonce from the indexer as a bigint", async () => {
    (fetchNonce as jest.Mock).mockResolvedValue({
      last_mempool_tx_nonce: 4,
      last_executed_tx_nonce: 4,
      possible_next_nonce: 5,
      detected_missing_nonces: [],
    });

    await expect(getNextSequence("SP_ADDRESS")).resolves.toBe(5n);
    expect(fetchNonce).toHaveBeenCalledWith("SP_ADDRESS");
  });
});
