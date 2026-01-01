import xrpGetAddress from "@ledgerhq/coin-xrp/signer/getAddress";
import stellarGetAddress from "@ledgerhq/coin-stellar/signer/getAddress";
import Stellar from "@ledgerhq/hw-app-str";
import { signTransaction, stellarSignTransaction, tezosSignTransaction } from "./signTransaction";
import { StrKey } from "@stellar/stellar-sdk";
import { CreateSigner, executeWithSigner } from "../../setup";
import Xrp from "@ledgerhq/hw-app-xrp";
import Transport from "@ledgerhq/hw-transport";
import { AlpacaSigner } from "./types";
import { DerivationType, LedgerSigner as TaquitoLedgerSigner } from "@taquito/ledger-signer";
import tezosGetAddress from "@ledgerhq/coin-tezos/signer/getAddress";
import Tezos from "@ledgerhq/hw-app-tezos";
import { context as evmContext, getAddress as evmGetAddress } from "./Eth";
import { AddressValidationCurrencyParameters } from "@ledgerhq/types-live";
import { validateAddress as tezosValidateAddress } from "@ledgerhq/coin-tezos/logic/validateAddress";
import { validateAddress as xrpValidateAddress } from "@ledgerhq/coin-xrp/logic/validateAddress";
import { validateAddress as stellarValidateAddress } from "@ledgerhq/coin-stellar/logic/validateAddress";
import { validateAddress as evmValidateAddress } from "@ledgerhq/coin-evm/logic/validateAddress";

const createSignerXrp: CreateSigner<Xrp> = (transport: Transport) => {
  return new Xrp(transport);
};
const signerContextXrp = executeWithSigner(createSignerXrp);

const createSignerStellar: CreateSigner<Stellar> = (transport: Transport) => {
  const stellar = new Stellar(transport);
  const originalSignTransaction = stellar.signTransaction;
  // Return the original Stellar instance with overridden methods
  return Object.assign(stellar, {
    signTransaction: async (path: string, transaction: string) => {
      const unsignedPayload: Buffer = Buffer.from(transaction, "base64");
      const { signature } = await originalSignTransaction(path, unsignedPayload);
      return signature.toString("base64");
    },
    getAddress: async (path: string, verify?: boolean) => {
      const { rawPublicKey } = await stellar.getPublicKey(path, verify);
      const publicKey = StrKey.encodeEd25519PublicKey(rawPublicKey);
      return {
        path,
        address: publicKey,
        publicKey: publicKey,
      };
    },
  });
};

const signerContextStellar = executeWithSigner(createSignerStellar);

const createSignerTezos: CreateSigner<
  Tezos & { createLedgerSigner: (path: string, prompt: boolean, derivationType: number) => any }
> = (transport: Transport) => {
  const tezos = new Tezos(transport);
  // align with genericSignOperation that calls signer.signTransaction
  return Object.assign(tezos, {
    async signTransaction(path: string, rawTxHex: string) {
      const { signature } = await tezos.signOperation(path, rawTxHex, {});
      return signature;
    },
    async getAddress(path: string, { verify }: { verify?: boolean } = {}) {
      // Use Taquito LedgerSigner to retrieve base58 public key and matching pkh (like oldbridge)
      const ledgerSigner = new TaquitoLedgerSigner(
        transport,
        path,
        !!verify,
        DerivationType.ED25519,
      );
      const address = await ledgerSigner.publicKeyHash();
      const publicKey = await ledgerSigner.publicKey();
      return { path, address, publicKey };
    },
    createLedgerSigner(path: string, prompt: boolean, derivationType: number) {
      // Map 0 -> ED25519, 1 -> SECP256K1, 2 -> P256 by convention
      let dt: DerivationType = DerivationType.ED25519;
      if (derivationType === 1) dt = DerivationType.SECP256K1;
      else if (derivationType === 2) dt = DerivationType.P256;
      return new TaquitoLedgerSigner(transport, path, prompt, dt);
    },
  });
};
const signerContextTezos = executeWithSigner(createSignerTezos);

export function getSigner(network: string): AlpacaSigner {
  switch (network) {
    case "ripple":
    case "xrp": {
      return {
        getAddress: xrpGetAddress(signerContextXrp),
        signTransaction: signTransaction(signerContextXrp),
        context: signerContextXrp,
      };
    }
    case "stellar": {
      return {
        getAddress: stellarGetAddress(signerContextStellar),
        signTransaction: stellarSignTransaction(signerContextStellar),
        context: signerContextStellar,
      };
    }
    case "tezos": {
      return {
        getAddress: tezosGetAddress(signerContextTezos),
        signTransaction: tezosSignTransaction(executeWithSigner(createSignerTezos)),
        context: signerContextTezos,
      };
    }
    case "evm": {
      return {
        getAddress: evmGetAddress,
        context: evmContext,
      };
    }
  }
  throw new Error(`signer for ${network} not implemented`);
}

type ValidateAddressFunction = (
  address: string,
  parameters: Partial<AddressValidationCurrencyParameters>,
) => Promise<boolean>;

const validateAddressByNetwork = new Map<string, ValidateAddressFunction>();
validateAddressByNetwork.set("stellar", stellarValidateAddress);
validateAddressByNetwork.set("xrp", xrpValidateAddress);
validateAddressByNetwork.set("tezos", tezosValidateAddress);
validateAddressByNetwork.set("evm", evmValidateAddress);
validateAddressByNetwork.set("ethereum", evmValidateAddress); // for the coin tester
validateAddressByNetwork.set("sonic", evmValidateAddress); // for the coin tester
validateAddressByNetwork.set("polygon", evmValidateAddress); // for the coin tester
validateAddressByNetwork.set("core", evmValidateAddress); // for the coin tester
validateAddressByNetwork.set("scroll", evmValidateAddress); // for the coin tester
validateAddressByNetwork.set("blast", evmValidateAddress); // for the coin tester

export function getValidateAddress(network: string): ValidateAddressFunction {
  const validateAddress = validateAddressByNetwork.get(network);
  if (!validateAddress) {
    throw new Error(`No validate address function for network ${network}`);
  }

  return validateAddress;
}
