import { defer, Observable, switchMap, type Subscriber } from "rxjs";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type {
  Account,
  DeviceId,
  SignOperationEvent,
  SignRawOperationArg0,
  AccountBridge,
} from "@ledgerhq/types-live";
import { getCoinModuleApi } from "./api";
import { getBridgeApi } from "./bridge";
import { rawWriteApi } from "./portfolio/raw";
import { buildOptimisticOperation } from "./utils";
import { type GetAddressResult } from "@ledgerhq/ledger-wallet-framework/derivation";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import type { GenericTransaction } from "./types";

type RawSignerContext = SignerContext<any>;

type SignRawDeps = {
  network: string;
  kind: string;
  signerContext: RawSignerContext;
  account: Account;
  transaction: string;
  deviceId: DeviceId;
};

async function signRawAndEmit(o: Subscriber<SignOperationEvent>, deps: SignRawDeps): Promise<void> {
  const { network, kind, signerContext, account, transaction, deviceId } = deps;
  // The coin module resolves by account.currency.id; getBridgeApi (network) is family-keyed.
  const coinModuleApi = await getCoinModuleApi(account.currency.id, kind);
  const bridgeApi = await getBridgeApi(account.currency, network);
  const raw = rawWriteApi(coinModuleApi, account, bridgeApi);
  const signedInfo = await signerContext(deviceId, async signer => {
    const derivationPath = account.freshAddressPath;
    const deviceSignOptions = bridgeApi.getDeviceSignOptions?.({ raw: transaction }, account);
    const { publicKey } = (await signer.getAddress(
      derivationPath,
      deviceSignOptions,
    )) as GetAddressResult;

    const sender = account.freshAddress;

    // TODO: should compute it and pass it down to craftTransaction (duplicate call right now)
    const sequenceNumber = await raw.getNextSequence(sender);

    /* Craft unsigned blob via coin-framework */
    const unsigned = await raw.craftRawTransaction(transaction, sender, publicKey, sequenceNumber);

    /* Notify UI that the device is now showing the tx */
    o.next({ type: "device-signature-requested" });
    /* Sign on Ledger device */
    const txnSig = await signer.signTransaction(derivationPath, unsigned, deviceSignOptions);
    return {
      unsigned: bridgeApi.applyDeviceSignResult?.(unsigned, deviceSignOptions) ?? unsigned,
      txnSig,
      publicKey,
      sequence: sequenceNumber,
    };
  });

  /* If the user cancelled inside signerContext */
  if (!signedInfo) return;
  o.next({ type: "device-signature-granted" });

  /* Combine payload + signature for broadcast */
  const combined = await raw.combine(signedInfo.unsigned, signedInfo.txnSig, signedInfo.publicKey);
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
  (arg: SignRawOperationArg0<Account>): Observable<SignOperationEvent> => {
    const { account, transaction, deviceId } = arg;
    return defer(() => getBridgeApi(account.currency, network)).pipe(
      switchMap(
        bridgeApi =>
          // The whole argument: a family signing a PSBT needs `broadcast` (whether to finalize it).
          bridgeApi.signRawOperation?.(arg) ??
          new Observable<SignOperationEvent>(o => {
            signRawAndEmit(o, {
              network,
              kind,
              signerContext,
              account,
              transaction,
              deviceId,
            }).then(
              () => o.complete(),
              e => o.error(e),
            );
          }),
      ),
    );
  };
