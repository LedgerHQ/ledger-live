import { onDappMessage } from "../onDappMessage";
import type { DappMessageDeps, JsonRpcRequestMessage } from "../types";

jest.mock("../ethChainId", () => ({ handleEthChainId: jest.fn() }));
jest.mock("../ethAccounts", () => ({ handleEthAccounts: jest.fn() }));
jest.mock("../walletSwitchEthereumChain", () => ({ handleWalletSwitchEthereumChain: jest.fn() }));
jest.mock("../ethSendTransaction", () => ({ handleEthSendTransaction: jest.fn() }));
jest.mock("../personalSign", () => ({ handlePersonalSign: jest.fn() }));
jest.mock("../ethSignTypedData", () => ({ handleEthSignTypedData: jest.fn() }));
jest.mock("../rpcPassthrough", () => ({ handleRpcPassthrough: jest.fn() }));

const { handleEthChainId } = jest.requireMock("../ethChainId");
const { handleEthAccounts } = jest.requireMock("../ethAccounts");
const { handleWalletSwitchEthereumChain } = jest.requireMock("../walletSwitchEthereumChain");
const { handleEthSendTransaction } = jest.requireMock("../ethSendTransaction");
const { handlePersonalSign } = jest.requireMock("../personalSign");
const { handleEthSignTypedData } = jest.requireMock("../ethSignTypedData");
const { handleRpcPassthrough } = jest.requireMock("../rpcPassthrough");

const account = { type: "Account", id: "acc-1", freshAddress: "0xACC" };
const parentAccount = { type: "Account", id: "parent-1", freshAddress: "0xPARENT" };

function buildDeps(overrides: Partial<DappMessageDeps> = {}): DappMessageDeps {
  return {
    manifest: { id: "dapp-1" },
    currentAccount: account,
    currentParentAccount: undefined,
    currentNetwork: { currency: "ethereum", chainID: 1 },
    postMessage: jest.fn(),
    tracking: {},
    uiHook: {},
    setCurrentAccount: jest.fn(),
    setCurrentAccountHist: jest.fn(),
    wsRef: { current: undefined },
    ...overrides,
  } as unknown as DappMessageDeps;
}

function msg(method: string): JsonRpcRequestMessage {
  return { jsonrpc: "2.0", method, id: 1 };
}

describe("onDappMessage — guards", () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => consoleError.mockRestore());

  it("ignores non-jsonrpc-2.0 requests without responding", async () => {
    const deps = buildDeps();
    await onDappMessage(deps, { method: "eth_chainId", id: 1 } as unknown as JsonRpcRequestMessage);

    expect(deps.postMessage).not.toHaveBeenCalled();
    expect(handleEthChainId).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();
  });

  it("responds with InternalError when no network is selected", async () => {
    const deps = buildDeps({ currentNetwork: undefined });
    await onDappMessage(deps, msg("eth_chainId"));

    expect(deps.postMessage).toHaveBeenCalledWith(expect.stringContaining("No network selected"));
    expect(handleEthChainId).not.toHaveBeenCalled();
  });

  it("responds with InternalError when no account is selected", async () => {
    const deps = buildDeps({ currentAccount: null });
    await onDappMessage(deps, msg("eth_chainId"));

    expect(deps.postMessage).toHaveBeenCalledWith(expect.stringContaining("No account selected"));
    expect(handleEthChainId).not.toHaveBeenCalled();
  });

  it("responds with InternalError when a token account has no parent", async () => {
    const deps = buildDeps({
      currentAccount: { type: "TokenAccount", id: "tok-1" } as never,
      currentParentAccount: undefined,
    });
    await onDappMessage(deps, msg("eth_chainId"));

    expect(deps.postMessage).toHaveBeenCalledWith(
      expect.stringContaining("No parent account found"),
    );
    expect(handleEthChainId).not.toHaveBeenCalled();
  });
});

describe("onDappMessage — dispatch", () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    ["eth_chainId", () => handleEthChainId],
    ["eth_requestAccounts", () => handleEthAccounts],
    ["enable", () => handleEthAccounts],
    ["eth_accounts", () => handleEthAccounts],
    ["wallet_switchEthereumChain", () => handleWalletSwitchEthereumChain],
    ["eth_sendTransaction", () => handleEthSendTransaction],
    ["personal_sign", () => handlePersonalSign],
    ["eth_signTypedData", () => handleEthSignTypedData],
    ["eth_signTypedData_v4", () => handleEthSignTypedData],
    ["eth_unknownMethod", () => handleRpcPassthrough],
  ])("routes %s to the right handler", async (method, getHandler) => {
    const deps = buildDeps();
    await onDappMessage(deps, msg(method));
    expect(getHandler()).toHaveBeenCalledTimes(1);
  });

  it("passes the account itself as signerAccount for a plain account", async () => {
    const deps = buildDeps();
    await onDappMessage(deps, msg("eth_chainId"));

    expect(handleEthChainId).toHaveBeenCalledWith(
      expect.objectContaining({ signerAccount: account, currentAccount: account }),
      expect.any(Object),
    );
  });

  it("passes the parent account as signerAccount for a token account", async () => {
    const tokenAccount = { type: "TokenAccount", id: "tok-1" } as never;
    const deps = buildDeps({
      currentAccount: tokenAccount,
      currentParentAccount: parentAccount as never,
    });
    await onDappMessage(deps, msg("eth_chainId"));

    expect(handleEthChainId).toHaveBeenCalledWith(
      expect.objectContaining({ signerAccount: parentAccount, currentAccount: tokenAccount }),
      expect.any(Object),
    );
  });
});
