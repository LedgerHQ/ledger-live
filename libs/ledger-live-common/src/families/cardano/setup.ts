// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import Ada, { Networks, AddressType } from "@cardano-foundation/ledgerjs-hw-app-cardano";
import { str_to_path } from "@cardano-foundation/ledgerjs-hw-app-cardano/dist/utils/address";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { createBridges } from "@ledgerhq/coin-cardano/bridge";
import makeCliTools from "@ledgerhq/coin-cardano/cli-transaction";
import cardanoResolver from "@ledgerhq/coin-cardano/hw-getAddress";
import type {
  CardanoAccount,
  CardanoLikeNetworkParameters,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/coin-cardano/types";
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
import signerSerializer from "./signerSerializer";

function findNetwork(networkParams: CardanoLikeNetworkParameters) {
  return networkParams.networkId === Networks.Mainnet.networkId
    ? Networks.Mainnet
    : Networks.Testnet;
}

const createSigner: CreateSigner<CardanoSigner> = (transport: Transport) => {
  const ada = new Ada(transport);
  return {
    getAddress: async ({
      path,
      stakingPathString,
      networkParams,
      verify,
    }: GetAddressRequest): Promise<CardanoAddress> => {
      const network = findNetwork(networkParams);

      const addr = await ada.deriveAddress({
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

      return addr;
    },
    getPublicKey: async (accountPath: string): Promise<CardanoExtendedPublicKey> => {
      return ada.getExtendedPublicKey({
        path: str_to_path(accountPath),
      });
    },
    sign: async ({ transaction, networkParams }: CardanoSignRequest): Promise<CardanoSignature> => {
      const network = findNetwork(networkParams);
      const trxOptions = signerSerializer(network, transaction);

      return ada.signTransaction(trxOptions);
    },
  };
};

const bridge: Bridge<Transaction, CardanoAccount, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
);

const resolver: Resolver = createResolver(createSigner, cardanoResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
