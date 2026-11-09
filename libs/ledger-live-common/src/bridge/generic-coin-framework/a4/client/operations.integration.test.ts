import "../../../../__tests__/test-helpers/setup.integration";
import { deriveA4AccountId } from "./accountId";
import { A4Client } from "./index";
import { fetchA4Operations } from "./operations";
import { resolveA4BaseUrl } from "./utils";

describe("A4 operations against the production server", () => {
  const address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
  const client = new A4Client(resolveA4BaseUrl("prd"), "ethereum");

  it("lists operations up to the latest block when no range is given", async () => {
    const { data, version } = await client.listOperations(deriveA4AccountId(address), { size: 5 });

    expect(version).toEqual(expect.any(String));
    expect(data.items).toHaveLength(5);
    expect(data.items).toEqual(
      Array(5).fill(
        expect.objectContaining({
          tx: expect.objectContaining({ hash: expect.stringMatching(/^0x[0-9a-f]{64}$/) }),
          block: expect.objectContaining({ height: expect.any(Number) }),
        }),
      ),
    );
  });

  it("lists operations over a numeric blocks range", async () => {
    await expect(
      client.listOperations(deriveA4AccountId(address), { blocks: [0, 1000000], size: 5 }),
    ).resolves.toEqual(
      expect.objectContaining({ data: expect.objectContaining({ items: expect.any(Array) }) }),
    );
  });

  it("lists operations up to the pending block", async () => {
    await expect(
      client.listOperations(deriveA4AccountId(address), { blocks: [0, "pending"], size: 5 }),
    ).resolves.toEqual(
      expect.objectContaining({ data: expect.objectContaining({ items: expect.any(Array) }) }),
    );
  });

  it("fetches and adapts operations from a minimum height", async () => {
    const { operations } = await fetchA4Operations(client, deriveA4AccountId(address), {
      liveAccountId: "liveAccountId",
      address,
      chain: "ethereum",
      minHeight: 0,
      maxDcRoamRetries: 0,
      maxOperations: 5,
      pageSize: 5,
    });

    expect(operations.length).toBeGreaterThan(0);
    expect(operations).toEqual(
      Array(operations.length).fill(
        expect.objectContaining({ hash: expect.stringMatching(/^0x[0-9a-f]{64}$/) }),
      ),
    );
  });
});
