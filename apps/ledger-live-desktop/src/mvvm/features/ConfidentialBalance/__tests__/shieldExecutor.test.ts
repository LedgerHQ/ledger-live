import { createApi } from "@ledgerhq/coin-evm/api";
import { isConfidentialError } from "@ledgerhq/coin-evm/confidential";
import type { EvmContext } from "@ledgerhq/coin-evm/config";
import { createDeviceShieldExecutor } from "../utils/shieldExecutor";

jest.mock("@ledgerhq/coin-evm/api", () => ({ createApi: jest.fn() }));

const UNSIGNED = "0x02e5";
const SIGNATURE = `0x${"11".repeat(65)}`;
const SIGNED = "0x02signed";
const HASH = `0x${"ab".repeat(32)}`;
const context = { config: jest.fn(), logger: jest.fn() } satisfies EvmContext;

function setup(receipts: ({ status: string } | null)[] = []) {
  const api = {
    combine: jest.fn().mockReturnValue(SIGNED),
    broadcast: jest.fn().mockResolvedValue(HASH),
  };
  jest.mocked(createApi).mockReturnValue(api as unknown as ReturnType<typeof createApi>);
  const fetchMock = jest.fn();
  for (const result of receipts)
    fetchMock.mockResolvedValueOnce({ json: async () => ({ result }) });
  global.fetch = fetchMock;
  const signTransaction = jest.fn().mockResolvedValue(SIGNATURE);
  const executor = createDeviceShieldExecutor({
    currencyId: "ethereum_sepolia",
    context,
    signTransaction,
    rpcUrl: "rpc",
    pollMs: 0,
    timeoutMs: 1000,
  });
  return { api, executor, signTransaction, fetchMock };
}

describe("createDeviceShieldExecutor", () => {
  it("signs on the device, combines and broadcasts through coin-evm", async () => {
    const { api, executor, signTransaction } = setup();

    expect(await executor.signAndBroadcast("approve", { transaction: UNSIGNED })).toBe(HASH);
    expect(signTransaction).toHaveBeenCalledWith(UNSIGNED);
    expect(api.combine).toHaveBeenCalledWith(context, UNSIGNED, [SIGNATURE]);
    expect(api.broadcast).toHaveBeenCalledWith(context, SIGNED);
  });

  it("broadcasts nothing when the device refuses", async () => {
    const { api, executor, signTransaction } = setup();
    signTransaction.mockRejectedValueOnce(new Error("refused"));

    await expect(executor.signAndBroadcast("wrap", { transaction: UNSIGNED })).rejects.toThrow(
      "refused",
    );
    expect(api.broadcast).not.toHaveBeenCalled();
  });

  it("waits until the receipt is there", async () => {
    const { executor, fetchMock } = setup([null, null, { status: "0x1" }]);

    await executor.waitForConfirmation(HASH);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      method: "eth_getTransactionReceipt",
      params: [HASH],
    });
  });

  it("fails on a reverted transaction", async () => {
    const { executor } = setup([{ status: "0x0" }]);

    const error = await executor.waitForConfirmation(HASH).catch(e => e);
    expect(isConfidentialError(error, "Unknown")).toBe(true);
  });
});
