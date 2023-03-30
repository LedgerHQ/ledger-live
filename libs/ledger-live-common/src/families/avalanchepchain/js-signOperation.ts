import { Observable } from "rxjs";
import { BigNumber } from "bignumber.js";
import type { Transaction } from "./types";
import type {
  Account,
  Operation,
  SignOperationEvent,
  OperationType,
} from "@ledgerhq/types-live";
import { withDevice } from "../../hw/deviceAccess";
import buildTransaction from "./js-buildTransaction";
import { encodeOperationId } from "../../operation";
import { binTools } from "./utils";
import { Buffer as AvalancheBuffer } from "avalanche";
import {
  TransferableOperation,
  UnsignedTx as AVMUnsignedTx,
} from "avalanche/dist/apis/avm";
import { OperationTx } from "avalanche/dist/apis/avm";
import { Credential, SigIdx, Signature } from "avalanche/dist/common";
import {
  Tx as PlatformTx,
  UnsignedTx as PlatformUnsignedTx,
  SelectCredentialClass as PlatformSelectCredentialClass,
} from "avalanche/dist/apis/platformvm";
import BIPPath from "bip32-path";
import { HDHelper } from "./hdhelper";
import { createHash } from "crypto";
import { AVAX_HRP } from "./utils";
import { AvalanchePChainAccount } from "./types";
import {
  getLedgerProvider,
  LedgerProvider,
  getTxOutputAddresses,
} from "@avalabs/avalanche-wallet-sdk";

const STAKEABLELOCKINID = 21;
const AVA_ACCOUNT_PATH = "m/44'/9000'/0'";

const signOperation = ({
  account,
  deviceId,
  transaction,
}: {
  account: Account;
  deviceId: any;
  transaction: Transaction;
}): Observable<SignOperationEvent> =>
  withDevice(deviceId)(
    (transport) =>
      new Observable<SignOperationEvent>((o) => {
        let cancelled;

        async function main() {
          const publicKey =
            (account as AvalanchePChainAccount).avalanchePChainResources
              ?.publicKey ?? "";
          const chainCode =
            (account as AvalanchePChainAccount).avalanchePChainResources
              ?.chainCode ?? "";

          const hdHelper = await HDHelper.instantiate(publicKey, chainCode);

          const unsignedTx = await buildTransaction(
            account,
            transaction,
            hdHelper
          );
          const chainId = "P";
          const extendedPAddresses = hdHelper.getExtendedAddresses();
          const { paths } = getTransactionPathsAndAddresses(
            unsignedTx,
            chainId,
            extendedPAddresses
          );

          const canLedgerParse = getCanLedgerParse(unsignedTx);

          o.next({ type: "device-signature-requested" });

          let signedTx: PlatformTx;

          if (canLedgerParse) {
            signedTx = await signTransactionParsable<
              PlatformUnsignedTx,
              PlatformTx
            >(unsignedTx, paths, transport, hdHelper);
          } else {
            signedTx = await signTransactionHash<
              PlatformUnsignedTx,
              PlatformTx
            >(unsignedTx, paths, transport);
          }

          if (cancelled) return;

          o.next({ type: "device-signature-granted" });

          const signature =
            "0x" + binTools.addChecksum(signedTx.toBuffer()).toString("hex");

          const operation = buildOptimisticOperation(account, transaction);

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature,
              expirationDate: null,
            },
          });
        }

        main().then(
          () => o.complete(),
          (e) => o.error(e)
        );
        return () => {
          cancelled = true;
        };
      })
  );

const signTransactionParsable = async <
  UnsignedTx extends PlatformUnsignedTx,
  SignedTx extends PlatformTx
>(
  unsignedTx: UnsignedTx,
  paths: string[],
  transport, //FIXME: check why transport is not align package
  hdHelper: HDHelper
): Promise<SignedTx> => {
  const accountPath = BIPPath.fromString(AVA_ACCOUNT_PATH);
  const bip32Paths = pathsToUniqueBipPaths(paths);
  const txbuff = unsignedTx.toBuffer();
  const outputAddrs = getTxOutputAddresses<UnsignedTx>(unsignedTx);
  const changePaths = getAddressPaths(outputAddrs, hdHelper);

  const provider: LedgerProvider = await getLedgerProvider(transport);

  const ledgerSignedTx = await provider.signTx(
    transport,
    Buffer.from(txbuff),
    accountPath,
    bip32Paths,
    changePaths
  );

  const sigMap = ledgerSignedTx.signatures;
  const credentials = getCredentials<UnsignedTx>(unsignedTx, paths, sigMap);
  const signedTx = new PlatformTx(
    unsignedTx as PlatformUnsignedTx,
    credentials
  );

  return signedTx as SignedTx;
};

const signTransactionHash = async <
  UnsignedTx extends PlatformUnsignedTx,
  SignedTx extends PlatformTx
>(
  unsignedTx: UnsignedTx,
  paths: string[],
  transport //FIXME: check why transport is not align package
): Promise<SignedTx> => {
  const txbuff = unsignedTx.toBuffer();
  const msg = Buffer.from(createHash("sha256").update(txbuff).digest());
  const bip32Paths = pathsToUniqueBipPaths(paths);
  const accountPath = BIPPath.fromString(AVA_ACCOUNT_PATH);

  const provider: LedgerProvider = await getLedgerProvider(transport);

  const sigMap = await provider.signHash(
    transport,
    Buffer.from(msg),
    accountPath,
    bip32Paths
  );

  const creds: Credential[] = getCredentials<UnsignedTx>(
    unsignedTx,
    paths,
    sigMap
  );
  const signedTx = new PlatformTx(unsignedTx as PlatformUnsignedTx, creds);

  return signedTx as SignedTx;
};

const getCanLedgerParse = (unsignedTx: PlatformUnsignedTx) => {
  let canLedgerParse = true;

  const txIns = unsignedTx.getTransaction().getIns();

  for (let i = 0; i < txIns.length; i++) {
    const typeID = txIns[i].getInput().getTypeID();
    if (typeID === STAKEABLELOCKINID) {
      canLedgerParse = false;
      break;
    }
  }

  return canLedgerParse;
};

const pathsToUniqueBipPaths = (paths: string[]) => {
  const uniquePaths = paths.filter((val: any, i: number) => {
    return paths.indexOf(val) === i;
  });

  const bip32Paths = uniquePaths.map((path) => {
    return BIPPath.fromString(path, false);
  });

  return bip32Paths;
};

const getTransactionPathsAndAddresses = (
  unsignedTx: PlatformUnsignedTx,
  chainId: string,
  pAddresses: string[]
): { paths: string[]; addresses: string[] } => {
  unsignedTx.toBuffer();
  const tx = unsignedTx.getTransaction();

  const items = tx.getIns();
  let operations: TransferableOperation[] = [];

  // Try to get operations, it will fail if there are none, ignore and continue
  try {
    operations = (tx as unknown as OperationTx).getOperations();
    // eslint-disable-next-line no-empty
  } catch (e) {}

  const hrp = AVAX_HRP;
  const paths: string[] = [];
  const addresses: string[] = [];

  // Collect derivation paths for source addresses
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const sigidxs: SigIdx[] = item.getInput().getSigIdxs();
    const sources = sigidxs.map((sigidx) => sigidx.getSource());
    const addrs: string[] = sources.map((source) => {
      return binTools.addressToString(hrp, chainId, source);
    });

    for (let j = 0; j < addrs.length; j++) {
      const srcAddr = addrs[j];
      const pathStr = getPathFromAddress(srcAddr, pAddresses);

      paths.push(pathStr);
      addresses.push(srcAddr);
    }
  }

  // Do the Same for operational inputs, if there are any...
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    const sigidxs: SigIdx[] = op.getOperation().getSigIdxs();
    const sources = sigidxs.map((sigidx) => sigidx.getSource());
    const addrs: string[] = sources.map((source) => {
      return binTools.addressToString(hrp, chainId, source);
    });

    for (let j = 0; j < addrs.length; j++) {
      const srcAddr = addrs[j];
      const pathStr = getPathFromAddress(srcAddr, pAddresses);

      paths.push(pathStr);
      addresses.push(srcAddr);
    }
  }

  return { paths, addresses };
};

const getCredentials = <UnsignedTx extends AVMUnsignedTx | PlatformUnsignedTx>(
  unsignedTx: UnsignedTx,
  paths: string[],
  sigMap: any
): Credential[] => {
  const creds: Credential[] = [];
  const tx = unsignedTx.getTransaction();
  const ins = tx.getIns ? tx.getIns() : [];
  let operations: TransferableOperation[] = [];

  const items = ins;

  // Try to get operations, it will fail if there are none, ignore and continue
  try {
    operations = (tx as OperationTx).getOperations();
    // eslint-disable-next-line no-empty
  } catch (e) {}

  const CredentialClass = PlatformSelectCredentialClass;

  for (let i = 0; i < items.length; i++) {
    const sigidxs: SigIdx[] = items[i].getInput().getSigIdxs();
    const cred: Credential = CredentialClass(
      items[i].getInput().getCredentialID()
    );

    for (let j = 0; j < sigidxs.length; j++) {
      const pathIndex = i + j;
      const pathStr = paths[pathIndex];

      const sigRaw = sigMap.get(pathStr);
      const sigBuff = AvalancheBuffer.from(sigRaw);
      const sig: Signature = new Signature();
      sig.fromBuffer(sigBuff);
      cred.addSignature(sig);
    }
    creds.push(cred);
  }

  for (let i = 0; i < operations.length; i++) {
    const op = operations[i].getOperation();
    const sigidxs: SigIdx[] = op.getSigIdxs();
    const cred: Credential = CredentialClass(op.getCredentialID());

    for (let j = 0; j < sigidxs.length; j++) {
      const pathIndex = items.length + i + j;
      const pathStr = paths[pathIndex];

      const sigRaw = sigMap.get(pathStr);
      const sigBuff = AvalancheBuffer.from(sigRaw);
      const sig: Signature = new Signature();
      sig.fromBuffer(sigBuff);
      cred.addSignature(sig);
    }
    creds.push(cred);
  }

  return creds;
};

const getAddressPaths = (
  addresses: string[],
  hdHelper: HDHelper
): BIPPath.Bip32Path[] => {
  const platformAddrs = hdHelper.getAllDerivedAddresses();

  const paths: Set<string> = new Set();

  addresses.forEach((address) => {
    const platformIndex = platformAddrs.indexOf(address);

    if (platformIndex >= 0) {
      paths.add(`0/${platformIndex}`);
    }
  });
  return [...paths].map((path) => BIPPath.fromString(path));
};

const getPathFromAddress = (address: string, pAddresses: string[]) => {
  const platformIndex = pAddresses.indexOf(address);

  if (platformIndex >= 0) {
    return `0/${platformIndex}`;
  }

  throw "Unable to find source address.";
};

const buildOptimisticOperation = (
  account: Account,
  transaction: Transaction
): Operation => {
  let type: OperationType;

  switch (transaction.mode) {
    case "delegate":
      type = "DELEGATE";
      break;
    default:
      type = "OUT";
  }

  const fee = transaction.fees ?? new BigNumber(0);
  const value = new BigNumber(transaction.amount).plus(fee);

  const operation: Operation = {
    id: encodeOperationId(account.id, "", type),
    hash: "",
    type,
    value: new BigNumber(0),
    fee,
    blockHash: null,
    blockHeight: null,
    senders: [],
    recipients: [],
    accountId: account.id,
    date: new Date(),
    extra: {
      validator: transaction.recipient,
      stakeValue: value,
    },
  };

  return operation;
};

export default signOperation;
