import { http, HttpResponse } from "msw";
import { TEST_STACKS_ENDPOINT, server } from "../../test/msw.mock";
import { listOperations } from "./listOperations";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const SENDER = "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J";
const RECIPIENT = "SPNX9YY3T4GR4XDSNRVWB2MDQVCTJMP3BGT7VCZA";

describe("listOperations via MSW", () => {
  it("paginates through the real /extended/v2/addresses/:addr/transactions shape", async () => {
    server.use(
      http.get(`${TEST_STACKS_ENDPOINT}/extended/v2/addresses/${SENDER}/transactions`, () =>
        HttpResponse.json({
          limit: 50,
          offset: 0,
          total: 1,
          results: [
            {
              tx: {
                tx_id: "0xtx1",
                nonce: 1,
                fee_rate: "1000",
                sender_address: SENDER,
                sponsored: false,
                post_condition_mode: "deny",
                post_conditions: [],
                anchor_mode: "any",
                is_unanchored: false,
                block_hash: "0xblock1",
                parent_block_hash: "0xparent",
                block_height: 100,
                block_time: 1700000000,
                block_time_iso: "",
                burn_block_time: 1700000000,
                burn_block_time_iso: "",
                parent_burn_block_time: 0,
                parent_burn_block_time_iso: "",
                canonical: true,
                tx_index: 0,
                tx_status: "success",
                tx_result: { hex: "0x0703", repr: "(ok true)" },
                microblock_hash: "0x",
                microblock_sequence: 0,
                microblock_canonical: true,
                event_count: 1,
                execution_cost_read_count: 0,
                execution_cost_read_length: 0,
                execution_cost_runtime: 0,
                execution_cost_write_count: 0,
                execution_cost_write_length: 0,
                events: [],
                tx_type: "token_transfer",
                token_transfer: { recipient_address: RECIPIENT, amount: "1000", memo: "" },
              },
              stx_sent: "1000",
              stx_received: "0",
              events: {
                stx: { transfer: 1, mint: 0, burn: 0 },
                ft: { transfer: 0, mint: 0, burn: 0 },
                nft: { transfer: 0, mint: 0, burn: 0 },
              },
            },
          ],
        }),
      ),
    );

    const { items } = await listOperations(SENDER, { minHeight: 0 });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      type: "OUT",
      senders: [SENDER],
      recipients: [RECIPIENT],
      value: 1000n,
      asset: { type: "native" },
    });
  });
});
