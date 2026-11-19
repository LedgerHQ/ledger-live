import { WalletAPIServer } from "@ledgerhq/wallet-api-server";
import { waitFor } from "@testing-library/react";
import {
  StakePositionAccountNotFound,
  StakePositionBusy,
  StakePositionUnsupported,
} from "./errors";
import { handlers, type StakePositionUiHooks } from "./server";
import type { StakePositionOpenResult } from "./types";

type RpcAnswer = Readonly<{ result?: unknown; error?: { code: number; data?: unknown } }>;

const PARAMS = {
  accountId: "wallet-api-account-id",
  positionId: "stake-account-address",
};

const INVALID_REQUEST_CODE = -32600;
const INVALID_PARAMS_CODE = -32602;

const answerNull = async (): Promise<StakePositionOpenResult> => ({ action: null });

// Through the real Wallet API server: the JSON-RPC answer the live app gets.
function setup(answer: StakePositionUiHooks["position.open"] = answerNull) {
  const openPosition = jest.fn(answer);
  const uiHooks: StakePositionUiHooks = { "position.open": openPosition };
  const stakePositionHandlers = handlers({ uiHooks });
  const answers: string[] = [];
  const transport = {
    onMessage: undefined as ((message: string) => void) | undefined,
    send: (message: string) => answers.push(message),
  };
  const config = {
    appId: "earn",
    userId: "user",
    tracking: false,
    wallet: { name: "test-wallet", version: "1.0.0" },
  } as unknown as ConstructorParameters<typeof WalletAPIServer>[1];
  new WalletAPIServer(transport, config, undefined, stakePositionHandlers).setPermissions({
    methodIds: Object.keys(stakePositionHandlers),
  });

  const open = async (params: unknown): Promise<RpcAnswer> => {
    transport.onMessage?.(
      JSON.stringify({ jsonrpc: "2.0", id: "1", method: "custom.stake.position.open", params }),
    );
    await waitFor(() => expect(answers).toHaveLength(1));
    return JSON.parse(answers[0]) as RpcAnswer;
  };
  return { openPosition, open };
}

describe("custom.stake.position.open", () => {
  it("should hand the trimmed ids to the host and answer with its result", async () => {
    const { openPosition, open } = setup(async () => ({ action: "deactivate" }));

    const answer = await open({
      accountId: `  ${PARAMS.accountId} `,
      positionId: ` ${PARAMS.positionId}`,
    });

    expect(openPosition).toHaveBeenCalledWith(PARAMS);
    expect(answer.result).toEqual({ action: "deactivate" });
  });

  it("should pass the unavailable answer of the host to the live app", async () => {
    const { open } = setup(async () => ({ action: null, reason: "unavailable" }));

    const answer = await open(PARAMS);

    expect(answer.result).toEqual({ action: null, reason: "unavailable" });
  });

  it("should hand only the identity of the position to a caller still sending rewards and a validator", async () => {
    const { openPosition, open } = setup();

    const answer = await open({
      ...PARAMS,
      validatorAddress: "validator-vote-address",
      rewards: "20393024000000000",
    });

    expect(openPosition).toHaveBeenCalledWith(PARAMS);
    expect(answer.error).toBeUndefined();
  });

  it("should drop the keys the contract does not know", async () => {
    const { openPosition, open } = setup();

    await open({ ...PARAMS, foo: "bar" });

    expect(openPosition).toHaveBeenCalledWith(PARAMS);
  });

  it.each([
    ["no account id", { positionId: PARAMS.positionId }],
    ["a blank account id", { ...PARAMS, accountId: "   " }],
    ["no position id", { accountId: PARAMS.accountId }],
    ["a blank position id", { ...PARAMS, positionId: "   " }],
    ["a position id over 128 characters", { ...PARAMS, positionId: "a".repeat(129) }],
    ["an account id over 128 characters", { ...PARAMS, accountId: "a".repeat(129) }],
    ["a numeric position id", { ...PARAMS, positionId: 42 }],
    ["null params", null],
    ["an array", []],
    ["a string", "x"],
  ])("should answer INVALID_PARAMS without opening anything for %s", async (_case, params) => {
    const { openPosition, open } = setup();

    const answer = await open(params);

    expect(answer.error?.code).toBe(INVALID_PARAMS_CODE);
    expect(openPosition).not.toHaveBeenCalled();
  });

  it("should accept ids of exactly 128 characters", async () => {
    const { openPosition, open } = setup();
    const params = { accountId: "a".repeat(128), positionId: "b".repeat(128) };

    await open(params);

    expect(openPosition).toHaveBeenCalledWith(params);
  });

  it("should leave a request without params to the JSON-RPC layer, which refuses it", async () => {
    const { openPosition, open } = setup();

    const answer = await open(undefined);

    expect(answer.error?.code).toBe(INVALID_REQUEST_CODE);
    expect(openPosition).not.toHaveBeenCalled();
  });

  it.each([
    new StakePositionAccountNotFound(),
    new StakePositionUnsupported(),
    new StakePositionBusy(),
  ])("should keep $name in the error the live app gets", async error => {
    const { open } = setup(() => Promise.reject(error));

    const answer = await open(PARAMS);

    expect(answer.error?.data).toMatchObject({ data: { name: error.name } });
  });
});
