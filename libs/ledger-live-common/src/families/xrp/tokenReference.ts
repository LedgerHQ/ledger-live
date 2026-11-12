const IOU_HEX_CODE = /^[0-9A-F]{40}$/;
const MPT_ISSUANCE_ID = /^[0-9A-F]{48}$/;

export function isIouHexCode(assetReference: string): boolean {
  return IOU_HEX_CODE.test(assetReference);
}

export function getStandardFromReference(assetReference: string): string | undefined {
  if (assetReference.length === 3 || isIouHexCode(assetReference)) return "iou";
  if (MPT_ISSUANCE_ID.test(assetReference)) return "mpt";

  return undefined;
}
