// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import Ada, {
  Networks,
  AddressType,
  SignTransactionRequest,
  TransactionSigningMode,
  TxAuxiliaryDataType,
} from "@cardano-foundation/ledgerjs-hw-app-cardano";
import { str_to_path } from "@cardano-foundation/ledgerjs-hw-app-cardano/dist/utils/address";
import { utils as TyphonUtils } from "@stricahq/typhonjs";
import { address as TyphonAddress } from "@stricahq/typhonjs";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { createBridges } from "@ledgerhq/coin-cardano/bridge";
import makeCliTools from "@ledgerhq/coin-cardano/cli-transaction";
import cardanoResolver from "@ledgerhq/coin-cardano/hw-getAddress";
import type { Transaction } from "@ledgerhq/coin-cardano/types";
import type {
  CardanoAddress,
  CardanoExtendedPublicKey,
  CardanoSignRequest,
  CardanoSignature,
  CardanoSigner,
  GetAddressRequest,
} from "@ledgerhq/coin-cardano/signer";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";
import {
  prepareCertificate,
  prepareLedgerInput,
  prepareLedgerOutput,
  prepareWithdrawal,
  signTx,
} from "./tx-helpers";

const createSigner: CreateSigner<CardanoSigner> = (transport: Transport) => {
  const ada = new Ada(transport);
  return {
    getAddress: async ({
      path,
      stakingPathString,
      networkParams,
      verify,
    }: GetAddressRequest): Promise<CardanoAddress> => {
      const network =
        networkParams.networkId === Networks.Mainnet.networkId
          ? Networks.Mainnet
          : Networks.Testnet;

      const r = await ada.deriveAddress({
        network,
        address: {
          type: AddressType.BASE_PAYMENT_KEY_STAKE_KEY,
          params: {
            spendingPath: str_to_path(path),
            stakingPath: str_to_path(stakingPathString),
          },
        },
      });
      if (verify) {
        await ada.showAddress({
          network,
          address: {
            type: AddressType.BASE_PAYMENT_KEY_STAKE_KEY,
            params: {
              spendingPath: str_to_path(path),
              stakingPath: str_to_path(stakingPathString),
            },
          },
        });
      }
      const address = TyphonUtils.getAddressFromHex(r.addressHex) as TyphonAddress.BaseAddress;
      return {
        address: address.getBech32(),
        // Here, we use publicKey hash, as cardano app doesn't export the public key
        publicKey: address.paymentCredential.hash,
      };
    },
    getPublicKey: async (accountPath: string): Promise<CardanoExtendedPublicKey> => {
      return ada.getExtendedPublicKey({
        path: str_to_path(accountPath),
      });
    },
    sign: async ({
      unsignedTransaction,
      accountPubKey,
      accountIndex,
      networkParams,
    }: CardanoSignRequest): Promise<CardanoSignature> => {
      const rawInputs = unsignedTransaction.getInputs();
      const ledgerAppInputs = rawInputs.map(i => prepareLedgerInput(i, accountIndex));

      const rawOutptus = unsignedTransaction.getOutputs();
      const ledgerAppOutputs = rawOutptus.map(o => prepareLedgerOutput(o, accountIndex));

      const rawCertificates = unsignedTransaction.getCertificates();
      const ledgerCertificates = rawCertificates.map(prepareCertificate);

      const rawWithdrawals = unsignedTransaction.getWithdrawals();
      const ledgerWithdrawals = rawWithdrawals.map(prepareWithdrawal);

      const auxiliaryDataHashHex = unsignedTransaction.getAuxiliaryDataHashHex();

      const network =
        networkParams.networkId === Networks.Mainnet.networkId
          ? Networks.Mainnet
          : Networks.Testnet;

      const trxOptions: SignTransactionRequest = {
        signingMode: TransactionSigningMode.ORDINARY_TRANSACTION,
        tx: {
          network,
          inputs: ledgerAppInputs,
          outputs: ledgerAppOutputs,
          certificates: ledgerCertificates,
          withdrawals: ledgerWithdrawals,
          fee: unsignedTransaction.getFee().toString(),
          ttl: unsignedTransaction.getTTL()?.toString(),
          validityIntervalStart: null,
          auxiliaryData: auxiliaryDataHashHex
            ? {
                type: TxAuxiliaryDataType.ARBITRARY_HASH,
                params: {
                  hashHex: auxiliaryDataHashHex,
                },
              }
            : null,
        },
        additionalWitnessPaths: [],
      };

      const r = await ada.signTransaction(trxOptions);
      return signTx(unsignedTransaction, accountPubKey, r.witnesses);
    },
  };
};

const bridge: Bridge<Transaction> = createBridges(executeWithSigner(createSigner));

const resolver: Resolver = createResolver(createSigner, cardanoResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
