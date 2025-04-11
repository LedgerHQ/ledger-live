// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import semver from "semver";
import Solana from "@ledgerhq/hw-app-solana";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { SolanaSigner } from "@ledgerhq/coin-solana/signer";
import { createBridges } from "@ledgerhq/coin-solana/bridge/js";
import makeCliTools from "@ledgerhq/coin-solana/cli-transaction";
import solanaResolver from "@ledgerhq/coin-solana/hw-getAddress";
import { SolanaAccount, Transaction, TransactionStatus } from "@ledgerhq/coin-solana/types";
import { DeviceModelId } from "@ledgerhq/devices";
import { loadPKI } from "@ledgerhq/hw-bolos";
import calService from "@ledgerhq/ledger-cal-service";
import trustService from "@ledgerhq/ledger-trust-service";
import { TransportStatusError, UpdateYourApp } from "@ledgerhq/errors";
import {
  CreateSigner,
  createMessageSigner,
  createResolver,
  executeWithSigner,
} from "../../bridge/setup";
import { LatestFirmwareVersionRequired } from "../../errors";
import type { Resolver } from "../../hw/getAddress/types";
import { getCurrencyConfiguration } from "../../config";
import { SolanaCoinConfig } from "@ledgerhq/coin-solana/lib/config";
import { getCryptoCurrencyById } from "../../currencies";
import { signMessage } from "@ledgerhq/coin-solana/hw-signMessage";
import { isValidUTF8 } from "utf-8-validate";
import { log } from "console";

const TRUSTED_NAME_MIN_VERSION = "1.7.1";
const MANAGER_APP_NAME = "Solana";

async function checkVersion(app: Solana) {
  const { version } = await app.getAppConfiguration();
  if (semver.lt(version, TRUSTED_NAME_MIN_VERSION)) {
    throw new UpdateYourApp(undefined, {
      managerAppName: MANAGER_APP_NAME,
    });
  }
}

function isPKIUnsupportedError(err: unknown): err is TransportStatusError {
  return err instanceof TransportStatusError && err.message.includes("0x6a81");
}

function isPrintableASCII(buffer) {
  return (
    buffer &&
    buffer.every(element => {
      return element >= 0x20 && element <= 0x7e;
    })
  );
}

function isUTF8(buffer) {
  return buffer && isValidUTF8(buffer);
}

// Max off-chain message length supported by Ledger
const OFFCM_MAX_LEDGER_LEN = 1212;
// Max length of version 0 off-chain message
const OFFCM_MAX_V0_LEN = 65515;

function guessMessageFormat(message: string) {
  if (Object.prototype.toString.call(message) !== "[object Uint8Array]") {
    return undefined;
  }
  if (message.length <= OFFCM_MAX_LEDGER_LEN) {
    if (isPrintableASCII(message)) {
      return 0;
    } else if (isUTF8(message)) {
      return 1;
    }
  } else if (message.length <= OFFCM_MAX_V0_LEN) {
    if (isUTF8(message)) {
      return 2;
    }
  }
  return undefined;
}

function addHeaderToSignOffChainMessage(message: string): Buffer {
  const buffer = Buffer.alloc(4);
  let offset = buffer.writeUInt8(0);
  const messageFormat = 0; //guessMessageFormat(message) ?? 2;
  offset = buffer.writeUInt8(messageFormat, offset);
  buffer.writeUInt16LE(message.length, offset);
  const result = Buffer.concat([
    Buffer.from([255]),
    Buffer.from("solana offchain"),
    buffer,
    Buffer.from(message),
  ]);

  return result;
  /*return Buffer.concat([
    Buffer.from([0xff]),
    Buffer.from("solana offchain"),
    Buffer.from([0x00, 0x00]),
    message,
  ]);*/
}

const createSigner: CreateSigner<SolanaSigner> = (transport: Transport) => {
  const app = new Solana(transport);
  return {
    getAddress: app.getAddress,
    signTransaction: async (path, tx, resolution) => {
      if (resolution) {
        if (!resolution.deviceModelId) {
          throw new Error("Resolution provided without a deviceModelId");
        }

        if (resolution.deviceModelId !== DeviceModelId.nanoS) {
          const { descriptor, signature } = await calService.getCertificate(
            resolution.deviceModelId,
          );

          try {
            await loadPKI(transport, "TRUSTED_NAME", descriptor, signature);
          } catch (err) {
            if (isPKIUnsupportedError(err)) {
              throw new LatestFirmwareVersionRequired("LatestFirmwareVersionRequired");
            }
          }

          if (resolution.tokenAddress) {
            await checkVersion(app);

            const challenge = await app.getChallenge();
            const { signedDescriptor } = await trustService.getOwnerAddress(
              resolution.tokenAddress,
              challenge,
            );

            if (signedDescriptor) {
              await app.provideTrustedName(signedDescriptor);
            }
          }
          if (resolution.createATA) {
            await checkVersion(app);

            const challenge = await app.getChallenge();
            const { signedDescriptor } = await trustService.computedTokenAddress(
              resolution.createATA.address,
              resolution.createATA.mintAddress,
              challenge,
            );

            if (signedDescriptor) {
              await app.provideTrustedName(signedDescriptor);
            }
          }
        }
      }

      return app.signTransaction(path, tx);
    },
    signMessage: (path: string, message: string) => {
      const messageBuffer = addHeaderToSignOffChainMessage(message);
      return app
        .signOffchainMessage(path, messageBuffer)
        .then(response => ({ signature: Buffer.from(response.signature.toString("hex")) }));
    },
  };
};

const getCurrencyConfig = () => {
  return getCurrencyConfiguration<SolanaCoinConfig>(getCryptoCurrencyById("solana"));
};

const bridge: Bridge<Transaction, SolanaAccount, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
  getCurrencyConfig,
);

const messageSigner = {
  signMessage: createMessageSigner(createSigner, signMessage),
};

const resolver: Resolver = createResolver(createSigner, solanaResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, messageSigner, resolver };
