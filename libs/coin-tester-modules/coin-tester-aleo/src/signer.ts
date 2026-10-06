import type {
  AleoAddress,
  AleoAppConfig,
  AleoFeeIntentSignature,
  AleoNestedCallSignature,
  AleoRootIntentSignature,
  AleoSigner,
  AleoTvk,
  AleoViewKey,
} from "@ledgerhq/coin-aleo/types";
import { decodeRequestTlv, type ResolveRecord } from "./tlv/decodeRequest";
import { encodeSignatureTlv } from "./tlv/encodeSignature";
import { isRecordInputId } from "./recordInputId";
import { loadAleoWasm } from "./wasm";

/** `resolveRecord` is only needed for transfers spending private records. */
export function buildMockAleoSigner(privateKey: string, resolveRecord?: ResolveRecord): AleoSigner {
  // Nested calls must sign over the root's tvk: the backend recomputes scm = Hash(signer || root_tvk).
  let rootTvkField: string | undefined;

  async function signIntent(
    intent: Buffer,
    overrides?: { isRoot: boolean; rootTvk: string | undefined },
  ): Promise<{ signatureTlv: string; tvkField: string }> {
    const decoded = await decodeRequestTlv(intent.toString("hex"), { resolveRecord });
    const wasm = await loadAleoWasm();
    const isRoot = overrides ? overrides.isRoot : decoded.isRoot;
    const rootTvk = overrides?.rootTvk;

    const request = wasm.ExecutionRequest.sign(
      wasm.PrivateKey.from_string(privateKey),
      decoded.programId,
      decoded.functionName,
      decoded.inputs,
      decoded.inputTypes,
      rootTvk !== undefined ? wasm.Field.fromString(rootTvk) : undefined,
      decoded.programChecksum != null ? wasm.Field.fromString(decoded.programChecksum) : undefined,
      isRoot,
      decoded.programChecksum !== null,
    );

    // This wasm exposes neither Group scalar multiplication nor sk_sig to compute gammas directly.
    const gammas = request
      .input_ids()
      .filter(isRecordInputId)
      .map(([, gamma]) => gamma.toBytesLe());

    const tvk = request.tvk();
    return {
      signatureTlv: encodeSignatureTlv({
        signature: request.signature().toBytesLe(),
        tvk: tvk.toBytesLe(),
        tpk: request.to_tpk().toBytesLe(),
        gammas,
      }),
      tvkField: tvk.toString(),
    };
  }

  return {
    getAppConfig: async (): Promise<AleoAppConfig> => ({ version: "0.0.0" }),

    getAddress: async (): Promise<AleoAddress> => {
      const wasm = await loadAleoWasm();
      return { address: wasm.PrivateKey.from_string(privateKey).to_address().to_string() };
    },

    getViewKey: async (): Promise<AleoViewKey> => {
      const wasm = await loadAleoWasm();
      return { viewKey: wasm.PrivateKey.from_string(privateKey).to_view_key().to_string() };
    },

    // Never checked against the signature's tvk on the tester's path, so any field element works.
    getTvk: async (): Promise<AleoTvk> => {
      const wasm = await loadAleoWasm();
      return { tvk: wasm.Field.random().toBytesLe() };
    },

    signNestedCall: async (nestedCallRequest: Buffer): Promise<AleoNestedCallSignature> => {
      if (rootTvkField === undefined) {
        throw new Error(
          "aleo coin-tester: signNestedCall ran before signRootIntent recorded a root tvk",
        );
      }
      const { signatureTlv } = await signIntent(nestedCallRequest, {
        isRoot: false,
        rootTvk: rootTvkField,
      });
      return { signature: signatureTlv };
    },

    signRootIntent: async (_path: string, rootIntent: Buffer): Promise<AleoRootIntentSignature> => {
      const { signatureTlv, tvkField } = await signIntent(rootIntent);
      rootTvkField = tvkField;
      return { signature: signatureTlv };
    },

    signFeeIntent: async (): Promise<AleoFeeIntentSignature> => {
      throw new Error("aleo coin-tester: fee intents are never signed under sponsorship");
    },
  };
}
