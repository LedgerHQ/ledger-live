import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import {
  ERC20_CLEAR_SIGNED_SELECTORS,
  ERC721_CLEAR_SIGNED_SELECTORS,
  ERC1155_CLEAR_SIGNED_SELECTORS,
  DAPP_SELECTORS,
} from "@ledgerhq/evm-tools/selectors/index";
import { Account, AccountLike, ProtoNFT } from "@ledgerhq/types-live";
import { findTokenByAddress } from "@ledgerhq/cryptoassets/tokens";
import { validateDomain } from "@ledgerhq/domain-service/utils/index";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import type { CommonDeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Transaction as EvmTransaction, TransactionStatus } from "./types";

type DeviceTransactionField = CommonDeviceTransactionField;

const handleERC20Fields = (
  selector: string,
  argumentsBuffer: Buffer,
  token: TokenCurrency,
  transaction: EvmTransaction,
  hasValidDomain: boolean,
): DeviceTransactionField[] => {
  switch (selector) {
    case ERC20_CLEAR_SIGNED_SELECTORS.TRANSFER: {
      const [recipient, value] = ethers.utils.defaultAbiCoder.decode(
        ["address", "uint256"],
        argumentsBuffer,
      ) as [string, ethers.BigNumber];

      return [
        { type: "text", label: "Type", value: "Transfer" },
        {
          type: "text",
          label: "Amount",
          value: `${token.ticker} ${formatCurrencyUnit(
            token.units[0],
            new BigNumber(value.toString()),
          )}`,
        },
        transaction.recipientDomain?.type === "forward" && hasValidDomain
          ? {
              type: "text",
              label: "Domain",
              value: transaction.recipientDomain.domain,
            }
          : {
              type: "address",
              label: "Address",
              address: recipient,
            },
      ];
    }

    case ERC20_CLEAR_SIGNED_SELECTORS.APPROVE: {
      const [spender, value] = ethers.utils.defaultAbiCoder.decode(
        ["address", "uint256"],
        argumentsBuffer,
      ) as [string, ethers.BigNumber];

      const valueAsBN = new BigNumber(value.toString());
      return [
        { type: "text", label: "Type", value: "Approve" },
        {
          type: "text",
          label: "Amount",
          value: valueAsBN.eq("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
            ? `Unlimited ${token.ticker}`
            : `${token.ticker} ${formatCurrencyUnit(
                token.units[0],
                new BigNumber(value.toString()),
              )}`,
        },
        transaction.recipientDomain?.type === "forward" && hasValidDomain
          ? {
              type: "text",
              label: "Domain",
              value: transaction.recipientDomain.domain,
            }
          : {
              type: "address",
              label: "Address",
              address: spender,
            },
      ];
    }

    default:
      throw new Error(`Unknown ERC20 selector: ${selector}`);
  }
};

const handleDappSelectorFields = (selector: string): DeviceTransactionField[] => {
  const transactionType = DAPP_SELECTORS[selector];

  if (!transactionType || transactionType === "undefined") {
    throw new Error(`Unknown or undefined dapp selector: ${selector}`);
  }
  return [
    {
      type: "text",
      label: "Type",
      value: transactionType,
    },
  ];
};

const handleERC721Fields = (
  selector: string,
  argumentsBuffer: Buffer,
  knownNft: ProtoNFT,
  transaction: EvmTransaction,
): DeviceTransactionField[] => {
  const ERC721_METHODS_ARGUMENTS = {
    [ERC721_CLEAR_SIGNED_SELECTORS.SAFE_TRANSFER_FROM]: ["address", "address", "uint256"],
    [ERC721_CLEAR_SIGNED_SELECTORS.SAFE_TRANSFER_FROM_WITH_DATA]: [
      "address",
      "address",
      "uint256",
      "bytes",
    ],
    [ERC721_CLEAR_SIGNED_SELECTORS.TRANSFER_FROM]: ["address", "address", "uint256"],
    [ERC721_CLEAR_SIGNED_SELECTORS.APPROVE]: ["address", "uint256"],
    [ERC721_CLEAR_SIGNED_SELECTORS.SET_APPROVAL_FOR_ALL]: ["address", "bool"],
  };

  switch (selector) {
    case ERC721_CLEAR_SIGNED_SELECTORS.SAFE_TRANSFER_FROM:
    case ERC721_CLEAR_SIGNED_SELECTORS.SAFE_TRANSFER_FROM_WITH_DATA:
    case ERC721_CLEAR_SIGNED_SELECTORS.TRANSFER_FROM: {
      const [, recipient, tokenId] = ethers.utils.defaultAbiCoder.decode(
        ERC721_METHODS_ARGUMENTS[selector],
        argumentsBuffer,
      ) as [unknown, string, ethers.BigNumber];

      return [
        { type: "text", label: "NFT", value: "Transfer" },
        { type: "text", label: "To", value: recipient },
        {
          type: "text",
          label: "Collection Name",
          value: knownNft.metadata?.tokenName || "Collection Name",
        },
        { type: "address", label: "NFT Address", address: transaction.recipient },
        { type: "text", label: "NFT ID", value: tokenId.toString() },
      ];
    }

    case ERC721_CLEAR_SIGNED_SELECTORS.APPROVE: {
      const [spender, tokenId] = ethers.utils.defaultAbiCoder.decode(
        ERC721_METHODS_ARGUMENTS[selector],
        argumentsBuffer,
      ) as [string, ethers.BigNumber];

      return [
        { type: "text", label: "NFT", value: "Allowance" },
        { type: "text", label: "Allow", value: spender },
        {
          type: "text",
          label: "To Manage Your",
          value: knownNft.metadata?.tokenName || "Collection Name",
        },
        { type: "address", label: "NFT Address", address: transaction.recipient },
        { type: "text", label: "NFT ID", value: tokenId.toString() },
      ];
    }

    case ERC721_CLEAR_SIGNED_SELECTORS.SET_APPROVAL_FOR_ALL: {
      const [spender, canManageAll] = ethers.utils.defaultAbiCoder.decode(
        ERC721_METHODS_ARGUMENTS[selector],
        argumentsBuffer,
      ) as [string, boolean];

      return [
        { type: "text", label: "NFT", value: "Allowance" },
        { type: "text", label: canManageAll ? "Allow" : "Revoke", value: spender },
        {
          type: "text",
          label: "To Manage ALL",
          value: knownNft.metadata?.tokenName || "Collection Name",
        },
        { type: "address", label: "NFT Address", address: transaction.recipient },
      ];
    }

    default:
      throw new Error(`Unknown ERC721 selector: ${selector}`);
  }
};

const handleERC1155Fields = (
  selector: string,
  argumentsBuffer: Buffer,
  knownNft: ProtoNFT,
  transaction: EvmTransaction,
): DeviceTransactionField[] => {
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
    [ERC1155_CLEAR_SIGNED_SELECTORS.SET_APPROVAL_FOR_ALL]: ["address", "bool"],
  };

  switch (selector) {
    case ERC1155_CLEAR_SIGNED_SELECTORS.SAFE_TRANSFER_FROM: {
      const [, recipient, tokenId, quantity] = ethers.utils.defaultAbiCoder.decode(
        ERC1155_METHODS_ARGUMENTS[selector],
        argumentsBuffer,
      ) as [unknown, string, ethers.BigNumber, ethers.BigNumber];

      return [
        { type: "text", label: "NFT", value: "Transfer" },
        { type: "text", label: "To", value: recipient },
        {
          type: "text",
          label: "Collection Name",
          value: knownNft.metadata?.tokenName || "Collection Name",
        },
        { type: "address", label: "NFT Address", address: transaction.recipient },
        { type: "text", label: "NFT ID", value: tokenId.toString() },
        { type: "text", label: "Quantity", value: quantity.toString() },
      ];
    }

    case ERC1155_CLEAR_SIGNED_SELECTORS.SAFE_BATCH_TRANSFER_FROM: {
      const [, recipient, tokenIds, quantities] = ethers.utils.defaultAbiCoder.decode(
        ERC1155_METHODS_ARGUMENTS[selector],
        argumentsBuffer,
      ) as [unknown, string, ethers.BigNumber[], ethers.BigNumber[]];

      const totalQuantity = quantities.reduce(
        (acc, curr) => acc.plus(curr.toString()),
        new BigNumber(0),
      );

      return [
        { type: "text", label: "NFT", value: "Batch Transfer" },
        { type: "text", label: "To", value: recipient },
        {
          type: "text",
          label: "Collection Name",
          value: knownNft.metadata?.tokenName || "Collection Name",
        },
        { type: "address", label: "NFT Address", address: transaction.recipient },
        {
          type: "text",
          label: "Total Quantity",
          value: `${totalQuantity.toString()} from ${tokenIds.length} NFT IDs`,
        },
      ];
    }

    case ERC1155_CLEAR_SIGNED_SELECTORS.SET_APPROVAL_FOR_ALL: {
      const [spender, canManageAll] = ethers.utils.defaultAbiCoder.decode(
        ERC1155_METHODS_ARGUMENTS[selector],
        argumentsBuffer,
      ) as [string, boolean];

      return [
        { type: "text", label: "NFT", value: "Allowance" },
        { type: "text", label: canManageAll ? "Allow" : "Revoke", value: spender },
        {
          type: "text",
          label: "To Manage ALL",
          value: knownNft.metadata?.tokenName || "Collection Name",
        },
        { type: "address", label: "NFT Address", address: transaction.recipient },
      ];
    }

    default:
      throw new Error(`Unknown ERC1155 selector: ${selector}`);
  }
};

const inferDeviceTransactionConfigWalletApi = (
  transaction: EvmTransaction,
  mainAccount: Account,
): Array<DeviceTransactionField> => {
  if (!transaction.data) throw new Error("Transaction data is required");

  const hasValidDomain = validateDomain(transaction.recipientDomain?.domain);
  const selector = `0x${transaction.data.toString("hex").substring(0, 8)}`;
  const argumentsBuffer = transaction.data.slice(4);
  const knownNft = mainAccount.nfts?.find(
    nft => nft.contract.toLowerCase() === transaction.recipient.toLowerCase(),
  );
  const token = findTokenByAddress(transaction.recipient);

  // ERC20 fields
  if (token && Object.values<string>(ERC20_CLEAR_SIGNED_SELECTORS).includes(selector)) {
    return handleERC20Fields(selector, argumentsBuffer, token, transaction, hasValidDomain);
  }

  // ERC721 fields
  if (knownNft && Object.values<string>(ERC721_CLEAR_SIGNED_SELECTORS).includes(selector)) {
    return handleERC721Fields(selector, argumentsBuffer, knownNft, transaction);
  }

  // ERC1155 fields
  if (knownNft && Object.values<string>(ERC1155_CLEAR_SIGNED_SELECTORS).includes(selector)) {
    return handleERC1155Fields(selector, argumentsBuffer, knownNft, transaction);
  }

  // Dapp fields from Dapp Selectors
  if (Object.keys(DAPP_SELECTORS).includes(selector)) {
    return handleDappSelectorFields(selector);
  }

  throw new Error("Fallback on Blind Signing");
};

const getDeviceTransactionConfig = ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: EvmTransaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> => {
  const mainAccount = getMainAccount(account, parentAccount);
  const { mode } = transaction;
  const fields: Array<DeviceTransactionField> = [];
  const hasValidDomain = validateDomain(transaction.recipientDomain?.domain);

  switch (mode) {
    default:
    case "send":
      if (transaction.data) {
        try {
          fields.push(...inferDeviceTransactionConfigWalletApi(transaction, mainAccount));
        } catch (e) {
          fields.push(
            { type: "text", label: "Data", value: "Present" },
            { type: "amount", label: "Amount" },
            { type: "text", label: "Address", value: transaction.recipient },
          );
        }
      } else {
        fields.push(
          { type: "amount", label: "Amount" },
          transaction.recipientDomain && hasValidDomain
            ? { type: "text", label: "Domain", value: transaction.recipientDomain.domain }
            : { type: "address", label: "Address", address: transaction.recipient },
        );
      }
      break;

    case "erc721":
      fields.push(
        { type: "text", label: "Type", value: "NFT Transfer" },
        { type: "text", label: "To", value: transaction.recipient },
        { type: "text", label: "Collection Name", value: transaction.nft.collectionName },
        { type: "address", label: "NFT Address", address: transaction.nft.contract },
        { type: "text", label: "NFT ID", value: transaction.nft.tokenId },
      );
      break;

    case "erc1155":
      fields.push(
        { type: "text", label: "Type", value: "NFT Transfer" },
        { type: "text", label: "To", value: transaction.recipient },
        { type: "text", label: "Collection Name", value: transaction.nft.collectionName },
        { type: "text", label: "Quantity", value: transaction.nft.quantity.toFixed() },
        { type: "address", label: "NFT Address", address: transaction.nft.contract },
        { type: "text", label: "NFT ID", value: transaction.nft.tokenId },
      );
      break;
  }

  fields.push(
    { type: "text", label: "Network", value: mainAccount.currency.name },
    { type: "fees", label: "Max fees" },
  );

  return fields;
};

export default getDeviceTransactionConfig;
