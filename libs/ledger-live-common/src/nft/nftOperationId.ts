export function encodeERC721OperationId(
  nftId: string,
  hash: string,
  type: string
): string {
  return `${nftId}-${hash}-${type}`;
}

export function decodeERC721OperationId(id: string): {
  nftId: string;
  hash: string;
  type: string;
} {
  const [nftId, hash, type] = id.split("-");
  return {
    nftId,
    hash,
    type,
  };
}

export function encodeERC1155OperationId(
  nftId: string,
  hash: string,
  type: string,
  i = 0,
  j = 0
): string {
  return `${nftId}-${hash}-${type}-i${i}_${j}`;
}

export function decodeERC1155OperationId(id: string): {
  nftId: string;
  hash: string;
  type: string;
  i: number;
  j: number;
} {
  const [nftId, hash, type, i, j] = id.split("-");
  return {
    nftId,
    hash,
    type,
    i: Number(i),
    j: Number(j),
  };
}
