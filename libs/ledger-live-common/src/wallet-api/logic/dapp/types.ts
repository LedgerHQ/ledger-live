import type { Account, AccountLike, AnyMessage } from "@ledgerhq/types-live";
import type { Transaction } from "../../../coin-modules/transaction-types";
import type { LiveAppManifestParamsNetwork } from "../../../platform/types";
import type { AppManifest } from "../../types";
import type { TrackingAPI } from "../../tracking";

// TODO remove any usage
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EthTransaction = any;

export type DappNetwork = LiveAppManifestParamsNetwork;

export type DappSignOptions = { hwAppId: string; dependencies?: string[] } | undefined;

export type SignFlowInfos = {
  canEditFees: boolean;
  hasFeesProvided: boolean;
  liveTx: Partial<Transaction>;
};

export type DappSignMessageContext = {
  manifest: AppManifest;
  /** The account the sign UI is opened for (may be a token account). */
  account: AccountLike;
  /** The account whose signer is used to prepare the message (parent for token accounts). */
  signerAccount: Account;
  tracking: TrackingAPI;
};

export type DappSignMessage = (params: {
  account: AccountLike;
  message: AnyMessage;
  options: DappSignOptions;
}) => Promise<string>;
