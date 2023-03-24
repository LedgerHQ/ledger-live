// handle send and erc20 send
import eip55 from "eip55";
import abi from "ethereumjs-abi";
import invariant from "invariant";
import {
  NotEnoughBalance,
  FeeTooHigh,
  NotEnoughBalanceInParentAccount,
  AmountRequired,
} from "@ledgerhq/errors";
import {
  ERC20_CLEAR_SIGNED_SELECTORS,
  ERC721_CLEAR_SIGNED_SELECTORS,
  ERC1155_CLEAR_SIGNED_SELECTORS,
} from "@ledgerhq/hw-app-eth";
import { BigNumber } from "bignumber.js";
import { findTokenByAddress } from "@ledgerhq/cryptoassets/tokens";
import { getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { validateDomain } from "@ledgerhq/domain-service/utils/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import {
  inferTokenAccount,
  getGasLimit,
  EIP1559ShouldBeUsed,
  toTransactionRaw,
} from "../transaction";
import type { ModeModule } from "../types";

export type Modes = "send";

const inferDeviceTransactionConfigWalletApi: ModeModule["fillDeviceTransactionConfig"] =
  ({ transaction, account, parentAccount }, fields) => {
    if (!transaction.data) throw new Error();

    const hasValidDomain = validateDomain(transaction.recipientDomain?.domain);

    const selector = `0x${transaction.data.toString("hex").substring(0, 8)}`;
    const argumentsBuffer = transaction.data.slice(4);
    const mainAccount = getMainAccount(account, parentAccount);
    const knownNft = mainAccount.nfts?.find(
      (nft) =>
        nft.contract.toLowerCase() === transaction.recipient.toLowerCase()
    );
    const token = findTokenByAddress(transaction.recipient);

    // ERC20 fields
    if (
      token &&
      Object.values<string>(ERC20_CLEAR_SIGNED_SELECTORS).includes(selector)
    ) {
      switch (selector) {
        case ERC20_CLEAR_SIGNED_SELECTORS.TRANSFER: {
          const [recipient, value] = abi.rawDecode(
            ["address", "uint256"],
            argumentsBuffer
          );

          fields.push(
            {
              type: "text",
              label: "Amount",
              value: `${token.ticker} ${formatCurrencyUnit(
                token.units[0],
                new BigNumber(value)
              )}`,
            },
            transaction.recipientDomain && hasValidDomain
              ? {
                  type: "text",
                  label: "Domain",
                  value: transaction.recipientDomain.domain,
                }
              : {
                  type: "address",
                  label: "Address",
                  address: eip55.encode(`0x${recipient}`),
                }
          );
          return;
        }
        case ERC20_CLEAR_SIGNED_SELECTORS.APPROVE: {
          const [spender, value] = abi.rawDecode(
            ["address", "uint256"],
            argumentsBuffer
          );

          const valueAsBN = new BigNumber(value.toString());
          fields.push(
            { type: "text", label: "Type", value: "Approve" },
            {
              type: "text",
              label: "Amount",
              value: valueAsBN.eq(
                "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff" // uint256 max value
              )
                ? `Unlimited ${token.ticker}`
                : `${token.ticker} ${formatCurrencyUnit(
                    token.units[0],
                    new BigNumber(value)
                  )}`,
            },
            transaction.recipientDomain && hasValidDomain
              ? {
                  type: "text",
                  label: "Domain",
                  value: transaction.recipientDomain.domain,
                }
              : {
                  type: "address",
                  label: "Address",
                  address: eip55.encode(`0x${spender}`),
                }
          );
          return;
        }
      }
    }

    // ERC721 fields
    if (
      knownNft &&
      Object.values<string>(ERC721_CLEAR_SIGNED_SELECTORS).includes(selector)
    ) {
      const ERC721_METHODS_ARGUMENTS = {
        [ERC721_CLEAR_SIGNED_SELECTORS.SAFE_TRANSFER_FROM]: [
          "address",
          "address",
          "uint256",
        ],
        [ERC721_CLEAR_SIGNED_SELECTORS.SAFE_TRANSFER_FROM_WITH_DATA]: [
          "address",
          "address",
          "uint256",
          "bytes",
        ],
        [ERC721_CLEAR_SIGNED_SELECTORS.TRANSFER_FROM]: [
          "address",
          "address",
          "uint256",
        ],
        [ERC721_CLEAR_SIGNED_SELECTORS.APPROVE]: ["address", "uint256"],
        [ERC721_CLEAR_SIGNED_SELECTORS.SET_APPROVAL_FOR_ALL]: [
          "address",
          "bool",
        ],
      };

      switch (selector) {
        case ERC721_CLEAR_SIGNED_SELECTORS.SAFE_TRANSFER_FROM:
        case ERC721_CLEAR_SIGNED_SELECTORS.SAFE_TRANSFER_FROM_WITH_DATA:
        case ERC721_CLEAR_SIGNED_SELECTORS.TRANSFER_FROM: {
          const [, recipient, tokenId] = abi.rawDecode(
            ERC721_METHODS_ARGUMENTS[selector],
            argumentsBuffer
          );

          fields.push(
            {
              type: "text",
              label: "NFT",
              value: "Transfer",
            },
            {
              type: "text",
              label: "To",
              value: eip55.encode(`0x${recipient}`),
            },
            {
              type: "text",
              label: "Collection Name",
              value: knownNft.metadata?.tokenName || "Collection Name",
            },
            {
              type: "address",
              label: "NFT Address",
              address: eip55.encode(transaction.recipient),
            },
            {
              type: "text",
              label: "NFT ID",
              value: tokenId.toString(),
            }
          );
          return;
        }

        case ERC721_CLEAR_SIGNED_SELECTORS.APPROVE: {
          const [spender, tokenId] = abi.rawDecode(
            ERC721_METHODS_ARGUMENTS[selector],
            argumentsBuffer
          );

          fields.push(
            {
              type: "text",
              label: "NFT",
              value: `Allowance`,
            },
            {
              type: "text",
              label: "Allow",
              value: eip55.encode(`0x${spender}`),
            },
            {
              type: "text",
              label: "To Manage Your",
              value: knownNft.metadata?.tokenName || "Collection Name",
            },
            {
              type: "address",
              label: "NFT Address",
              address: eip55.encode(transaction.recipient),
            },
            {
              type: "text",
              label: "NFT ID",
              value: tokenId.toString(),
            }
          );
          return;
        }

        case ERC721_CLEAR_SIGNED_SELECTORS.SET_APPROVAL_FOR_ALL: {
          const [spender, canManageAll] = abi.rawDecode(
            ERC721_METHODS_ARGUMENTS[selector],
            argumentsBuffer
          );

          fields.push(
            {
              type: "text",
              label: "NFT",
              value: `Allowance`,
            },
            {
              type: "text",
              label: canManageAll ? "Allow" : "Revoke",
              value: eip55.encode(`0x${spender}`),
            },
            {
              type: "text",
              label: "To Manage ALL",
              value: knownNft.metadata?.tokenName || "Collection Name",
            },
            {
              type: "address",
              label: "NFT Address",
              address: eip55.encode(transaction.recipient),
            }
          );
          return;
        }
      }
    }

    // ERC1155 fields
    if (
      knownNft &&
      Object.values<string>(ERC1155_CLEAR_SIGNED_SELECTORS).includes(selector)
    ) {
      const ERC1155_METHODS_ARGUMENTS = {
        [ERC1155_CLEAR_SIGNED_SELECTORS.SAFE_TRANSFER_FROM]: [
          "address",
          "address",
          "uint256",
          "uint256",
          "bytes",
        ],
        [ERC1155_CLEAR_SIGNED_SELECTORS.SAFE_BATCH_TRANSFER_FROM]: [
          "address",
          "address",
          "uint256[]",
          "uint256[]",
          "bytes",
        ],
        [ERC1155_CLEAR_SIGNED_SELECTORS.SET_APPROVAL_FOR_ALL]: [
          "address",
          "bool",
        ],
      };

      switch (selector) {
        case ERC1155_CLEAR_SIGNED_SELECTORS.SAFE_TRANSFER_FROM: {
          const [, recipient, tokenId, quantity] = abi.rawDecode(
            ERC1155_METHODS_ARGUMENTS[selector],
            argumentsBuffer
          );

          fields.push(
            {
              type: "text",
              label: "NFT",
              value: `Transfer`,
            },
            {
              type: "text",
              label: "To",
              value: eip55.encode(`0x${recipient}`),
            },
            {
              type: "text",
              label: "Collection Name",
              value: knownNft.metadata?.tokenName || "Collection Name",
            },
            {
              type: "address",
              label: "NFT Address",
              address: eip55.encode(transaction.recipient),
            },
            {
              type: "text",
              label: "NFT ID",
              value: tokenId.toString(),
            },
            {
              type: "text",
              label: "Quantity",
              value: quantity.toString(),
            }
          );
          return;
        }

        case ERC1155_CLEAR_SIGNED_SELECTORS.SAFE_BATCH_TRANSFER_FROM: {
          const [, recipient, tokenIds, quantities] = abi.rawDecode(
            ERC1155_METHODS_ARGUMENTS[selector],
            argumentsBuffer
          );

          const totalQuantity = quantities.reduce(
            (acc, curr) => acc.plus(curr),
            new BigNumber(0)
          );

          fields.push(
            {
              type: "text",
              label: "NFT",
              value: `Batch Transfer`,
            },
            {
              type: "text",
              label: "To",
              value: eip55.encode(`0x${recipient}`),
            },
            {
              type: "text",
              label: "Collection Name",
              value: knownNft.metadata?.tokenName || "Collection Name",
            },
            {
              type: "address",
              label: "NFT Address",
              address: eip55.encode(transaction.recipient),
            },
            {
              type: "text",
              label: "Total Quantity",
              value: `${totalQuantity.toString()} from ${
                tokenIds.length
              } NFT IDs`,
            }
          );
          return;
        }

        case ERC1155_CLEAR_SIGNED_SELECTORS.SET_APPROVAL_FOR_ALL: {
          const [spender, canManageAll] = abi.rawDecode(
            ERC1155_METHODS_ARGUMENTS[selector],
            argumentsBuffer
          );

          fields.push(
            {
              type: "text",
              label: "NFT",
              value: `Allowance`,
            },
            {
              type: "text",
              label: canManageAll ? "Allow" : "Revoke",
              value: eip55.encode(`0x${spender}`),
            },
            {
              type: "text",
              label: "To Manage ALL",
              value: knownNft.metadata?.tokenName || "Collection Name",
            },
            {
              type: "address",
              label: "NFT Address",
              address: eip55.encode(transaction.recipient),
            }
          );
          return;
        }
      }
    }

    throw new Error("Fallback on Blind Signing");
  };

const send: ModeModule = {
  fillTransactionStatus(a, t, result) {
    const tokenAccount = inferTokenAccount(a, t);
    const account = tokenAccount || a;

    if (!result.errors.recipient) {
      if (tokenAccount) {
        // SEND TOKEN
        result.totalSpent = t.useAllAmount
          ? account.spendableBalance
          : t.amount;
        result.amount = t.useAllAmount ? account.spendableBalance : t.amount;
      } else {
        // SEND ETHEREUM
        result.totalSpent = t.useAllAmount
          ? account.spendableBalance
          : t.amount.plus(result.estimatedFees);
        result.amount = BigNumber.max(
          t.useAllAmount
            ? account.spendableBalance.minus(result.estimatedFees)
            : t.amount,
          0
        );

        if (
          result.amount.gt(0) &&
          result.estimatedFees.times(10).gt(result.amount)
        ) {
          result.warnings.feeTooHigh = new FeeTooHigh();
        }

        if (result.estimatedFees.gt(a.spendableBalance)) {
          result.errors.amount = new NotEnoughBalanceInParentAccount();
        }
      }

      if (!t.data) {
        if (
          !t.allowZeroAmount &&
          !result.errors.amount &&
          result.amount.eq(0)
        ) {
          result.errors.amount = new AmountRequired();
        } else if (
          !result.totalSpent.gt(0) ||
          result.totalSpent.gt(account.spendableBalance)
        ) {
          result.errors.amount = new NotEnoughBalance();
        }
      }
    }
  },

  fillTransactionData(a, t, tx) {
    const subAccount = inferTokenAccount(a, t);

    if (subAccount) {
      const { token } = subAccount;
      const data = serializeTransactionData(a, t);
      invariant(data, "serializeTransactionData provided no data");
      tx.data = "0x" + (data as Buffer).toString("hex");
      tx.to = token.contractAddress;
      tx.value = "0x00";
    } else {
      let amount;

      if (t.useAllAmount) {
        const gasLimit = getGasLimit(t);
        const feePerGas = EIP1559ShouldBeUsed(a.currency)
          ? t.maxFeePerGas
          : t.gasPrice;
        // Prevents a send max with a negative amount
        amount = BigNumber.maximum(
          a.spendableBalance.minus(gasLimit.times(feePerGas || 0)),
          0
        );
      } else {
        invariant(t.amount, "amount is missing");
        amount = t.amount;
      }

      if (t.data) {
        tx.data = "0x" + t.data.toString("hex");
      }

      tx.value = `0x${new BigNumber(amount).toString(16)}`;
      tx.to = t.recipient;
    }
  },

  fillDeviceTransactionConfig(
    { transaction, account, parentAccount, status },
    fields
  ) {
    const hasValidDomain = validateDomain(transaction.recipientDomain?.domain);

    // For contract interactions
    if (transaction.data) {
      try {
        return inferDeviceTransactionConfigWalletApi(
          { transaction, account, parentAccount, status },
          fields
        );
      } catch (e) {
        fields.push({
          type: "text",
          label: "Data",
          value: "Present",
        });
        if (!transaction.amount.isZero()) {
          fields.push({
            type: "amount",
            label: "Amount",
          });
        }
        return;
      }
    }

    fields.push(
      {
        type: "amount",
        label: "Amount",
      },
      transaction.recipientDomain && hasValidDomain
        ? {
            type: "text",
            label: "Domain",
            value: transaction.recipientDomain.domain,
          }
        : {
            type: "address",
            label: "Address",
            address: transaction.recipient,
          }
    );
  },

  fillOptimisticOperation(a, t, op) {
    const subAccount = inferTokenAccount(a, t);

    if (subAccount) {
      // ERC20 transfer
      op.type = "FEES";
      op.subOperations = [
        {
          id: `${subAccount.id}-${op.hash}-OUT`,
          hash: op.hash,
          transactionSequenceNumber: op.transactionSequenceNumber,
          type: "OUT",
          value: t.useAllAmount
            ? subAccount.spendableBalance
            : new BigNumber(t.amount || 0),
          fee: op.fee,
          blockHash: null,
          blockHeight: null,
          senders: op.senders,
          recipients: [t.recipient],
          accountId: subAccount.id,
          date: new Date(),
          extra: {},
          transactionRaw: toTransactionRaw(t),
        },
      ];
    }
  },

  // This is resolution config is necessary for plugins like Lido and stuff cause they use the send mode
  getResolutionConfig: () => ({
    erc20: true,
    externalPlugins: true,
    nft: true,
  }),
};

function serializeTransactionData(
  account,
  transaction
): Buffer | null | undefined {
  const tokenAccount = inferTokenAccount(account, transaction);
  if (!tokenAccount) return;
  const recipient = eip55.encode(transaction.recipient);
  const { spendableBalance } = tokenAccount;
  let amount;

  if (transaction.useAllAmount) {
    amount = spendableBalance;
  } else {
    if (!transaction.amount) return;
    amount = new BigNumber(transaction.amount);

    if (amount.gt(tokenAccount.spendableBalance)) {
      throw new NotEnoughBalance();
    }
  }

  return abi.simpleEncode(
    "transfer(address,uint256)",
    recipient,
    amount.toString(10)
  );
}

export const modes: Record<Modes, ModeModule> = {
  send,
};
