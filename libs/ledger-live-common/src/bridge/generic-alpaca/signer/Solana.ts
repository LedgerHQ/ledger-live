import type { SolanaSigner } from "@ledgerhq/coin-solana/signer";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { CreateSigner, executeWithSigner } from "../../setup";
import Transport from "@ledgerhq/hw-transport";
import HwAppSolana from "@ledgerhq/hw-app-solana";
import bs58 from "bs58";
import resolver from "@ledgerhq/coin-solana/hw-getAddress";

export type Signer = {
  getAddress: (path: string, display?: boolean) => Promise<{ address: Buffer; publicKey: string }>;
  signTransaction: (path: string, txBase64: string) => Promise<string>;
};

const createHwSigner: CreateSigner<Signer> = (transport: Transport) => {
  const solana = new HwAppSolana(transport);
  return {
    getAddress: async (path: string, display?: boolean) => {
      const { address } = await solana.getAddress(path, display);
      return { address, publicKey: bs58.encode(address) };
    },
    signTransaction: async (path: string, txBase64: string) => {
      const txBuffer = Buffer.from(txBase64, "base64");
      const { signature } = await solana.signTransaction(path, txBuffer);
      return signature.toString("hex");
    },
  };
};

export const context = executeWithSigner(createHwSigner);
export const getAddress = resolver(context as unknown as SignerContext<SolanaSigner>);
