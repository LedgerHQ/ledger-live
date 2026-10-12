import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { log } from "@ledgerhq/logs";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { getAddressFormatDerivationMode } from "@ledgerhq/ledger-wallet-framework/derivation";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type {
  Account,
  SignOperationEvent,
  SignRawOperationFnSignature,
} from "@ledgerhq/types-live";
import { AccountNeedResync } from "@ledgerhq/wallet-btc/errors";
import { buildKnownAddressDerivations, feeFromPsbt, parsePsbt } from "@ledgerhq/coin-bitcoin/api";
import type { BitcoinAccount, BitcoinAccountAddress } from "./types";
import type { AddressFormat, BitcoinDeviceSigner } from "./signer";
import {
  CHANGE_CHAIN,
  RECEIVE_CHAIN,
  accountPathOf,
  addressDeriver,
  toWalletDerivationMode,
} from "./accountLayer/derivation";
import { readAccountState } from "./accountLayer/state";

// A PSBT sending to a fresh address — WalletConnect and live apps use the next ones — must still be
// recognized as the account's: the derivations cover two addresses ahead on each chain.
const LOOKAHEAD = 2;

async function accountAddresses(account: BitcoinAccount): Promise<BitcoinAccountAddress[]> {
  const state = readAccountState(account.bitcoinResources?.accountState);
  if (!state) throw new AccountNeedResync();
  const xpub = decodeAccountId(account.id).xpubOrAddress;
  const derive = addressDeriver(
    account.currency.id,
    toWalletDerivationMode(account.derivationMode),
    xpub,
  );
  const ahead = await Promise.all(
    [RECEIVE_CHAIN, CHANGE_CHAIN].flatMap(chain => {
      const next =
        state.addresses
          .filter(a => a.chain === chain)
          .reduce((max, a) => Math.max(max, a.index), -1) + 1;
      return Array.from({ length: LOOKAHEAD }, async (_, i) => ({
        address: await derive(chain, next + i),
        chain: chain as 0 | 1,
        index: next + i,
      }));
    }),
  );
  return [...state.addresses, ...ahead];
}

/** Signs a PSBT a live app built, with the account's known derivations (ported from coin-bitcoin). */
export const buildSignRawOperation =
  (signerContext: SignerContext<BitcoinDeviceSigner>): SignRawOperationFnSignature<Account> =>
  ({ account, deviceId, transaction: psbt, broadcast }) =>
    new Observable<SignOperationEvent>(o => {
      async function main() {
        const bitcoinAccount = account as BitcoinAccount;
        const { currency } = account;
        log("hw", `signRawTransaction ${currency.id} for account ${account.id}`);

        const psbtBuffer = parsePsbt(psbt);
        const accountPath = accountPathOf(account.freshAddressPath);
        const knownAddressDerivations = await buildKnownAddressDerivations(
          currency.id,
          decodeAccountId(account.id).xpubOrAddress,
          accountPath,
          await accountAddresses(bitcoinAccount),
        );

        const result = await signerContext(deviceId, signer =>
          signer.signPsbtBuffer(currency.id, psbtBuffer, {
            accountPath,
            addressFormat: getAddressFormatDerivationMode(account.derivationMode) as AddressFormat,
            finalizePsbt: broadcast ?? false,
            knownAddressDerivations,
            onDeviceSignatureRequested: () => o.next({ type: "device-signature-requested" }),
            onDeviceSignatureGranted: () => o.next({ type: "device-signature-granted" }),
            onDeviceStreaming: arg => o.next({ type: "device-streaming", ...arg }),
          }),
        );
        if (!result) {
          throw new Error(
            `PSBT signing failed: no result from device for account ${account.id} (${currency.id})`,
          );
        }

        const fee = feeFromPsbt(psbtBuffer);
        if (!fee) {
          log(
            "hw",
            `Failed to extract fee from PSBT for account ${account.id}; falling back to fee=0`,
          );
        }
        const base64Psbt = result.psbt.toString("base64");
        o.next({
          type: "signed",
          signedOperation: {
            // we know neither the recipients nor the amount of a PSBT
            operation: {
              id: encodeOperationId(account.id, "", "OUT"),
              hash: "",
              type: "OUT",
              value: fee ?? new BigNumber(0),
              fee: fee ?? new BigNumber(0),
              blockHash: null,
              blockHeight: null,
              senders: [],
              recipients: [],
              accountId: account.id,
              date: new Date(),
              extra: { psbt: true },
            },
            // finalized: the transaction, hex; otherwise the signed PSBT, base64
            signature: result.tx || base64Psbt,
            rawData: { psbtSigned: base64Psbt },
          },
        });
      }
      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });
