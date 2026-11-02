import type { IcpCurrencyConfig } from "../config";
import { createBridges } from "./index";

jest.mock("../network/api");
jest.mock("../logic/crypto");

import * as api from "../network/api";
import { derivePrincipalFromPubkey } from "../logic/crypto";

const configFor = (url: string): IcpCurrencyConfig => ({
  status: { type: "active" },
  name: "Internet Computer",
  unit: { name: "ICP", code: "ICP", magnitude: 8 },
  node: { url },
});

const signed = (rawData: Record<string, string>) =>
  ({
    account: { xpub: "04abcd" },
    signedOperation: { operation: { extra: {} }, signature: "", rawData },
  }) as unknown as Parameters<ReturnType<typeof createBridges>["accountBridge"]["broadcast"]>[0];

const stakeTransfer = signed({
  encodedSignedCallBlob: "aa",
  transferRequestIdHex: "bb",
  methodName: "create_neuron",
  stakeNonce: "42",
});

const neuronCommand = signed({
  encodedSignedCallBlob: "aa",
  encodedSignedReadStateBlob: "cc",
  requestId: "dd",
  methodName: "manage_neuron",
});

/** The host each network call of the module was handed. */
const hostsCalled = (): string[] =>
  [
    api.broadcastTxn,
    api.readTransferOutcome,
    api.claimOrRefreshNeuronFromAccount,
    api.readReplyFromCanister,
  ].flatMap(fn => jest.mocked(fn).mock.calls.map(([host]) => host));

describe("account bridge broadcast node", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(derivePrincipalFromPubkey).mockReturnValue({} as never);
    jest.mocked(api.broadcastTxn).mockResolvedValue(new Uint8Array());
    jest.mocked(api.readTransferOutcome).mockResolvedValue({ Ok: 1n });
    jest.mocked(api.claimOrRefreshNeuronFromAccount).mockResolvedValue(7n);
    jest.mocked(api.readReplyFromCanister).mockResolvedValue(new Uint8Array());
  });

  it("submits and claims a stake transfer on the configured node", async () => {
    const { accountBridge } = createBridges(jest.fn(), () => configFor("http://127.0.0.1:4943"));

    await accountBridge.broadcast(stakeTransfer);

    expect(api.claimOrRefreshNeuronFromAccount).toHaveBeenCalled();
    expect(new Set(hostsCalled())).toEqual(new Set(["http://127.0.0.1:4943"]));
  });

  it("sends a neuron command, read_state poll included, to the configured node", async () => {
    const { accountBridge } = createBridges(jest.fn(), () => configFor("http://127.0.0.1:4943"));

    await accountBridge.broadcast(neuronCommand);

    expect(api.readReplyFromCanister).toHaveBeenCalledWith(
      "http://127.0.0.1:4943",
      Buffer.from("aa", "hex"),
      Buffer.from("cc", "hex"),
      expect.any(String),
      "dd",
    );
  });

  // Read once per broadcast, not once per bridge: a changed config reaches the next broadcast, and
  // one broadcast never splits across two nodes.
  it("reads the config once per broadcast", async () => {
    const urls = ["http://127.0.0.1:1111", "http://127.0.0.1:2222"];
    let reads = 0;
    const { accountBridge } = createBridges(jest.fn(), () => configFor(urls[reads++]));

    await accountBridge.broadcast(stakeTransfer);
    expect(reads).toBe(1);
    expect(new Set(hostsCalled())).toEqual(new Set([urls[0]]));

    jest.clearAllMocks();
    await accountBridge.broadcast(stakeTransfer);
    expect(reads).toBe(2);
    expect(new Set(hostsCalled())).toEqual(new Set([urls[1]]));
  });
});
