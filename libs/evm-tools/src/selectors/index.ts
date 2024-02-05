/**
 * List of selectors (hexadecimal representation of the used method's signature) related to
 * ERC20 (Tokens), ERC721/ERC1155 (NFT).
 * You can verify and/or get more info about them on http://4byte.directory
 */

export enum ERC20_CLEAR_SIGNED_SELECTORS {
  APPROVE = "0x095ea7b3",
  TRANSFER = "0xa9059cbb",
}

export enum ERC721_CLEAR_SIGNED_SELECTORS {
  APPROVE = "0x095ea7b3",
  SET_APPROVAL_FOR_ALL = "0xa22cb465",
  TRANSFER_FROM = "0x23b872dd",
  SAFE_TRANSFER_FROM = "0x42842e0e",
  SAFE_TRANSFER_FROM_WITH_DATA = "0xb88d4fde",
}

export enum ERC1155_CLEAR_SIGNED_SELECTORS {
  SET_APPROVAL_FOR_ALL = "0xa22cb465",
  SAFE_TRANSFER_FROM = "0xf242432a",
  SAFE_BATCH_TRANSFER_FROM = "0x2eb2c2d6",
}

export default {
  ERC20_CLEAR_SIGNED_SELECTORS,
  ERC721_CLEAR_SIGNED_SELECTORS,
  ERC1155_CLEAR_SIGNED_SELECTORS,
};
