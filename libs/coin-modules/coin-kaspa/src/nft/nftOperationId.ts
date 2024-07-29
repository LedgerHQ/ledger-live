export function encodeERC721OperationId(
  nftId: string,
  hash: string,
  type: string,
  index?: number,
): string {
  return typeof index === "number"
    ? `${nftId}-${hash}-${type}-i${index}`
    : `${nftId}-${hash}-${type}`;
}

export function decodeERC721OperationId(id: string): {
  nftId: string;
  hash: string;
  type: string;
  index: number;
} {
  const [nftId, hash, type, index] = id.split("-");
  return {
    nftId,
    hash,
    type,
    index: index ? parseInt(index.replace("-i", ""), 10) : 0,
  };
}

export function encodeERC1155OperationId(
  nftId: string,
  hash: string,
  type: string,
  i = 0,
  j = 0,
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
  const [nftId, hash, type, iAndJ] = id.split("-");
  const [i, j] = iAndJ.split("_");
  return {
    nftId,
    hash,
    type,
    i: parseInt(i.replace("-i", ""), 10),
    j: parseInt(j, 10),
  };
}
