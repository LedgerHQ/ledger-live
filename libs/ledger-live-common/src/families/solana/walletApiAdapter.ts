import type {
  SolanaTransaction as WalletAPISolanaTransaction,
  TransactionModel as WalletAPISolanaTransactionModel,
} from "@ledgerhq/wallet-api-core";
import type BigNumber from "bignumber.js";
import { safeEncodeTokenId } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import type { AccountLike } from "@ledgerhq/types-live";
import type { GetWalletAPITransactionSignFlowInfos } from "../../wallet-api/types";
import {
  approveTransaction,
  createStakeAccountTransaction,
  delegateTransaction,
  optInTransaction,
  revokeTransaction,
  setTransactionMemo,
  splitStakeTransaction,
  undelegateTransaction,
  withdrawTransaction,
} from "./transactions";
import type { Transaction } from "./types";

const CAN_EDIT_FEES = false;

const HAS_FEES_PROVIDED = false;

function tokenAccountIdOf(account: AccountLike, tokenId: string): string {
  const mainAccountId = account.type === "TokenAccount" ? account.parentId : account.id;
  return `${mainAccountId}+${safeEncodeTokenId(tokenId)}`;
}

function fromWalletAPIModel(
  model: WalletAPISolanaTransactionModel,
  amount: BigNumber,
  recipient: string,
  account: AccountLike,
): Partial<Transaction> {
  switch (model.kind) {
    case "transfer":
    case "token.transfer":
      return {
        mode: "send",
        // An empty `subAccountId` is the wallet API's placeholder. Carrying it through would leave
        // a falsy sub-account on the transaction, which the generic bridge reads as a native send.
        ...("subAccountId" in model.uiState && model.uiState.subAccountId
          ? { subAccountId: model.uiState.subAccountId }
          : {}),
        ...(model.uiState.memo ? setTransactionMemo(model.uiState.memo) : {}),
      };
    case "stake.createAccount":
      return createStakeAccountTransaction(model.uiState.delegate.voteAccAddress, amount);
    case "stake.delegate":
      return delegateTransaction(model.uiState.stakeAccAddr, model.uiState.voteAccAddr);
    case "stake.undelegate":
      return undelegateTransaction(model.uiState.stakeAccAddr);
    case "stake.withdraw":
      return withdrawTransaction(model.uiState.stakeAccAddr, amount);
    case "stake.split":
      return splitStakeTransaction(model.uiState.stakeAccAddr, amount);
    case "token.createATA":
      return optInTransaction(tokenAccountIdOf(account, model.uiState.tokenId));
    case "token.approve":
      return approveTransaction(model.uiState.subAccountId, recipient, amount);
    case "token.revoke":
      return revokeTransaction(model.uiState.subAccountId);
    default:
      throw new Error(
        `Unsupported Solana wallet API transaction: ${(model as { kind: string }).kind}`,
      );
  }
}

const getWalletAPITransactionSignFlowInfos: GetWalletAPITransactionSignFlowInfos<
  WalletAPISolanaTransaction,
  Transaction
> = ({ walletApiTransaction, account }) => {
  const { model, ...common } = walletApiTransaction;

  const liveTx: Partial<Transaction> = {
    ...common,
    family: "solana",
    ...fromWalletAPIModel(
      model,
      walletApiTransaction.amount,
      walletApiTransaction.recipient,
      account,
    ),
  };

  if (!liveTx.subAccountId && account.type === "TokenAccount") {
    liveTx.subAccountId = account.id;
  }

  return {
    canEditFees: CAN_EDIT_FEES,
    liveTx,
    hasFeesProvided: HAS_FEES_PROVIDED,
  };
};

export default { getWalletAPITransactionSignFlowInfos };
