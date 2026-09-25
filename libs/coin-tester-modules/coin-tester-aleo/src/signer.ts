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

/**
 * Stands in for the device app: decodes the backend's TLV, signs it, and
 * re-encodes, so the signature covers what the bridge actually built.
 *
 * `resolveRecord` looks up the plaintext behind a record input's commitment;
 * omit it for public transfers, which have no record inputs (`gammas: []`).
 */
export function buildMockAleoSigner(privateKey: string, resolveRecord?: ResolveRecord): AleoSigner {
  // Set once by signRootIntent, read by every signNestedCall in the same
  // request tree: the backend recomputes scm = Hash(signer || root_tvk) from
  // the root signature, so a nested signature over any other root_tvk fails
  // verification. Holds the Field's decimal string form, the shape
  // `Field.fromString` accepts back, the same convention `programChecksum`
  // already uses below.
  let rootTvkField: string | undefined;

  async function signIntent(
    intent: Buffer,
    overrides?: { isRoot: boolean; rootTvk: string | undefined },
  ): Promise<{ signatureTlv: string; tvkField: string }> {
    const decoded = await decodeRequestTlv(intent.toString("hex"), { resolveRecord });
    const wasm = await loadAleoWasm();
    const isRoot = overrides ? overrides.isRoot : decoded.isRoot;
    // root_tvk only matters for nested calls; a root or fee intent leaves it unset.
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

    // Read gammas off the signed request rather than computing them: this
    // wasm's Group has no scalar multiplication and PrivateKey exposes no sk_sig.
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

    // No device nonce to reuse: the backend never revisits the TVKs promised
    // here against the ones a signature actually carries (msw/prove.ts proves
    // nothing from these), so an arbitrary distinct field element per call
    // satisfies every consumer on the tester's path.
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

    signFeeIntent: async (feeIntent: Buffer): Promise<AleoFeeIntentSignature> => ({
      signature: (await signIntent(feeIntent)).signatureTlv,
    }),
  };
}
