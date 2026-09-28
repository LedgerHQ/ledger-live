import { Observable, type Subscriber } from "rxjs";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { Account, DeviceId, SignOperationEvent, AccountBridge } from "@ledgerhq/types-live";
import { getCoinModuleApi } from "./api";
import { buildContext } from "./api/context";
import { getBridgeApi } from "./bridge";
import { buildOptimisticOperation } from "./utils";
import { type GetAddressResult } from "@ledgerhq/ledger-wallet-framework/derivation";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import type { GenericTransaction } from "./types";

// The signer type stays `any` here, as the pre-existing bridge signature did — the raw-sign path is
// signer-agnostic. Aliased so the one `any` isn't repeated across the deps type and the factory.
type RawSignerContext = SignerContext<any>;

type SignRawDeps = {
  network: string;
  kind: string;
  signerContext: RawSignerContext;
  account: Account;
  transaction: string;
  deviceId: DeviceId;
};

// Hoisted out of the Observable/curried closures so the on-device signing callback stays a shallow
// nesting level (keeps the whole flow under the max-nesting bound); the subscriber `o` and everything
// the closures used are threaded in as `deps`.
async function signRawAndEmit(o: Subscriber<SignOperationEvent>, deps: SignRawDeps): Promise<void> {
  const { network, kind, signerContext, account, transaction, deviceId } = deps;
  // Resolve the coin-module and context from `account.currency.id`, mirroring genericSignOperation:
  // `network` here is the family string (buildAccountBridgeForFamily passes it), so for a multi-currency
  // family it isn't a currency id — buildContext/getCoinModuleApi would fail to resolve a config (e.g.
  // "evm" ≠ "ethereum"). `network` is only for getBridgeApi, whose lookup is family-keyed.
  const coinModuleApi = await getCoinModuleApi(account.currency.id, kind);
  const context = buildContext(account.currency.id);
  const bridgeApi = await getBridgeApi(account.currency, network);
  const signedInfo = await signerContext(deviceId, async signer => {
    const derivationPath = account.freshAddressPath;
    const deviceSignOptions = bridgeApi.getDeviceSignOptions?.({}, account);
    const { publicKey } = (await signer.getAddress(
      derivationPath,
      deviceSignOptions,
    )) as GetAddressResult;

    const sender = account.freshAddress;

    // TODO: should compute it and pass it down to craftTransaction (duplicate call right now)
    const sequenceNumber = await coinModuleApi.getNextSequence(context, sender);

    /* Craft unsigned blob via coin-framework */
    const { transaction: unsigned } = await coinModuleApi.craftRawTransaction(
      context,
      transaction,
      sender,
      publicKey,
      sequenceNumber,
    );

    /* Notify UI that the device is now showing the tx */
    o.next({ type: "device-signature-requested" });
    /* Sign on Ledger device */
    const txnSig = await signer.signTransaction(derivationPath, unsigned, deviceSignOptions);
    return { unsigned, txnSig, publicKey, sequence: sequenceNumber };
  });

  /* If the user cancelled inside signerContext */
  if (!signedInfo) return;
  o.next({ type: "device-signature-granted" });

  /* Combine payload + signature for broadcast */
  const combined = await coinModuleApi.combine(context, signedInfo.unsigned, [signedInfo.txnSig], {
    pubkey: signedInfo.publicKey,
  });
  const operation = buildOptimisticOperation(
    account,
    { family: account.currency.family, amount: new BigNumber(0), recipient: "" },
    signedInfo.sequence,
  );
  if (!operation.id) {
    log("Generic coin-framework", "buildOptimisticOperation", operation);
  }
  // NOTE: we set the transactionSequenceNumber before on the operation
  // now that we create it in craftTransaction, we might need to return it back from craftTransaction also
  o.next({
    type: "signed",
    signedOperation: {
      operation,
      signature: combined,
    },
  });
}

/**
 * Sign Transaction with Ledger hardware
 */
export const genericSignRawOperation =
  (network: string, kind: string) =>
  (signerContext: RawSignerContext): AccountBridge<GenericTransaction>["signRawOperation"] =>
  ({
    account,
    transaction,
    deviceId,
  }: {
    account: Account;
    transaction: string;
    deviceId: DeviceId;
  }): Observable<SignOperationEvent> =>
    new Observable(o => {
      signRawAndEmit(o, { network, kind, signerContext, account, transaction, deviceId }).then(
        () => o.complete(),
        e => o.error(e),
      );
    });
