import { MAINNET_GOVERNANCE_CANISTER_ID, MAINNET_LEDGER_CANISTER_ID } from "../consts";
import { ICPCallUnconfirmed, ICPNeuronsNotRead } from "../errors";
import { broadcast } from "./broadcast";

jest.mock("../api");
jest.mock("../logic/crypto");
jest.mock("../common-logic/neuron");

import * as api from "../api";
import { derivePrincipalFromPubkey } from "../logic/crypto";
import { toNeuronsData } from "../common-logic/neuron";

const account = { xpub: "04abcd" } as any;
const signed = (rawData: any) => ({
  account,
  signedOperation: { operation: { extra: {} } as any, signature: "", rawData },
});

describe("broadcast routing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (derivePrincipalFromPubkey as jest.Mock).mockReturnValue({ __principal: true });
    (api.broadcastTxn as jest.Mock).mockResolvedValue(new Uint8Array());
    (api.ensureTransferCallAccepted as jest.Mock).mockResolvedValue(undefined);
    (api.readReplyFromCanister as jest.Mock).mockResolvedValue(new ArrayBuffer(0));
  });

  it("submits a create_neuron transfer to the ledger canister and claims the neuron", async () => {
    (api.claimOrRefreshNeuronFromAccount as jest.Mock).mockResolvedValue(123n);

    const op = await broadcast(
      signed({
        encodedSignedCallBlob: "aa",
        transferRequestIdHex: "bb",
        methodName: "create_neuron",
        stakeNonce: "42",
      }),
    );

    expect(api.broadcastTxn).toHaveBeenCalledWith(
      expect.anything(),
      MAINNET_LEDGER_CANISTER_ID,
      "call",
    );
    expect(api.claimOrRefreshNeuronFromAccount).toHaveBeenCalledWith({ __principal: true }, 42n);
    expect((op.extra as any).createdNeuronId).toBe("123");
  });

  it("throws unconfirmed when the neuron claim can't be confirmed after the transfer", async () => {
    (api.claimOrRefreshNeuronFromAccount as jest.Mock).mockResolvedValue(undefined);

    await expect(
      broadcast(
        signed({
          encodedSignedCallBlob: "aa",
          transferRequestIdHex: "bb",
          methodName: "create_neuron",
          stakeNonce: "42",
        }),
      ),
    ).rejects.toThrow(ICPCallUnconfirmed);
  });

  it("submits a governance command to the governance canister and decodes the reply", async () => {
    await broadcast(
      signed({
        encodedSignedCallBlob: "aa",
        encodedSignedReadStateBlob: "cc",
        requestId: "dd",
        methodName: "start_dissolving",
      }),
    );

    expect(api.readReplyFromCanister).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      MAINNET_GOVERNANCE_CANISTER_ID,
      "dd",
    );
    expect(api.decodeManageNeuronReply).toHaveBeenCalled();
  });

  it("throws unconfirmed on an indeterminate manage_neuron reply (no false success / double-execute)", async () => {
    (api.readReplyFromCanister as jest.Mock).mockResolvedValue(null);

    await expect(
      broadcast(
        signed({
          encodedSignedCallBlob: "aa",
          encodedSignedReadStateBlob: "cc",
          requestId: "dd",
          methodName: "start_dissolving",
        }),
      ),
    ).rejects.toThrow(ICPCallUnconfirmed);
    expect(api.decodeManageNeuronReply).not.toHaveBeenCalled();
  });

  // Reporting this as a successful broadcast spent a signature and then told the user their neurons
  // were up to date, with the snapshot untouched. Nothing was read, so say so.
  it("reports an indeterminate list_neurons reply rather than an unchanged snapshot", async () => {
    (api.readReplyFromCanister as jest.Mock).mockResolvedValue(null);

    await expect(
      broadcast(
        signed({
          encodedSignedCallBlob: "aa",
          encodedSignedReadStateBlob: "cc",
          requestId: "dd",
          methodName: "list_neurons",
        }),
      ),
    ).rejects.toThrow(ICPNeuronsNotRead);
    expect(api.decodeListNeuronsReply).not.toHaveBeenCalled();
  });

  it("decodes a list_neurons reply into the operation's neuron snapshot", async () => {
    (toNeuronsData as jest.Mock).mockReturnValue({ fullNeurons: [{ id: 7n }] });

    const op = await broadcast(
      signed({
        encodedSignedCallBlob: "aa",
        encodedSignedReadStateBlob: "cc",
        requestId: "dd",
        methodName: "list_neurons",
      }),
    );

    expect(api.decodeListNeuronsReply).toHaveBeenCalled();
    expect((op.extra as any).neurons).toEqual([{ id: 7n }]);
  });
});
