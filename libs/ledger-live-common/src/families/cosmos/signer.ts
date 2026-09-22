import cosmosResolver from "@ledgerhq/coin-cosmos/hw-getAddress";
import { ExpertModeRequired } from "@ledgerhq/coin-cosmos/errors";
import { RETURN_CODES } from "@ledgerhq/coin-cosmos/types/index";
import type { CosmosSigner } from "@ledgerhq/coin-cosmos/types/signer";
import type Transport from "@ledgerhq/hw-transport";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { CoinFrameworkSigner } from "../../bridge/generic-coin-framework/types";
import { executeWithSigner, type CreateSigner } from "../../bridge/setup";
import { createSigner as createDeviceSigner } from "./setup";

export type CosmosDeviceSignOptions = {
  verify?: boolean;
  derivationMode?: string;
  hrp?: string;
  signWithPrefix?: boolean;
};

type CosmosGetAddressArg = boolean | string | CosmosDeviceSignOptions;

export type CosmosFrameworkSigner = {
  getAddress(
    path: string,
    options?: CosmosGetAddressArg,
    boolDisplay?: boolean,
  ): Promise<{ path: string; address: string; publicKey: string }>;
  signTransaction(
    path: string,
    message: string,
    options?: CosmosDeviceSignOptions,
  ): Promise<string>;
};

function toIndices(path: string): number[] {
  return path.split("/").map(p => parseInt(p.replace(/'/g, ""), 10));
}

function derSignatureToFixedHex(der: Buffer): string {
  if (der[0] !== 0x30) {
    throw new Error("Cosmos signer: expected a DER signature");
  }
  let i = der[1] & 0x80 ? 2 + (der[1] & 0x7f) : 2;
  const readInt = (): Buffer => {
    if (der[i] !== 0x02) {
      throw new Error("Cosmos signer: invalid DER integer");
    }
    const len = der[i + 1];
    i += 2;
    let bytes = der.subarray(i, i + len);
    i += len;
    while (bytes.length > 32 && bytes[0] === 0x00) {
      bytes = bytes.subarray(1);
    }
    if (bytes.length > 32) {
      throw new Error("Cosmos signer: DER integer too large");
    }
    if (bytes.length < 32) {
      bytes = Buffer.concat([Buffer.alloc(32 - bytes.length), bytes]);
    }
    return Buffer.from(bytes);
  };
  return Buffer.concat([readInt(), readInt()]).toString("hex");
}

function resolveGetAddressCall(
  options?: CosmosGetAddressArg,
  boolDisplay?: boolean,
): { hrp: string; verify: boolean; encodePubkeyBase64: boolean } {
  if (typeof options === "string") {
    return { hrp: options, verify: !!boolDisplay, encodePubkeyBase64: false };
  }
  const verify = typeof options === "boolean" ? options : !!options?.verify;
  const hrp = typeof options === "object" ? options?.hrp : undefined;
  if (!hrp) {
    throw new Error("Cosmos getAddress requires an HRP");
  }
  return { hrp, verify, encodePubkeyBase64: typeof options === "object" };
}

function signHrpFromOptions(options?: CosmosDeviceSignOptions): string | undefined {
  if (options?.signWithPrefix === false) return undefined;
  return options?.hrp;
}

function signableBytesFromCraftedTx(message: string): Buffer {
  const parsed: unknown = JSON.parse(message);
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("signable" in parsed) ||
    typeof parsed.signable !== "string"
  ) {
    throw new Error("Cosmos signer: crafted transaction is missing signable");
  }
  return Buffer.from(parsed.signable, "base64");
}

function throwOnDeviceReturnCode(returnCode: number | string | undefined): void {
  switch (returnCode) {
    case RETURN_CODES.EXPERT_MODE_REQUIRED:
      throw new ExpertModeRequired();
    case RETURN_CODES.REFUSED_OPERATION:
      throw new UserRefusedOnDevice();
  }
}

export const createSigner: CreateSigner<CosmosFrameworkSigner> = (transport: Transport) => {
  const device: CosmosSigner = createDeviceSigner(transport);
  return {
    async getAddress(path, options, boolDisplay) {
      const { hrp, verify, encodePubkeyBase64 } = resolveGetAddressCall(options, boolDisplay);
      const { address, publicKey } = await device.getAddress(path, hrp, verify);
      return {
        path,
        address,
        publicKey: encodePubkeyBase64
          ? Buffer.from(publicKey, "hex").toString("base64")
          : publicKey,
      };
    },
    async signTransaction(path, message, options) {
      const { signature, return_code } = await device.sign(
        toIndices(path),
        signableBytesFromCraftedTx(message),
        signHrpFromOptions(options),
      );
      throwOnDeviceReturnCode(return_code);
      if (!signature) {
        throw new Error(`Cosmos signer returned no signature (return_code ${return_code})`);
      }
      return derSignatureToFixedHex(signature);
    },
  };
};

export const cosmosGetAddress = (signerContext: SignerContext<CosmosSigner>): GetAddressFn =>
  cosmosResolver(signerContext);

const context = executeWithSigner(createSigner);
const getAddress = cosmosGetAddress(executeWithSigner(createDeviceSigner));

export default {
  context,
  getAddress,
} satisfies CoinFrameworkSigner<CosmosFrameworkSigner>;
