const Ordiscan_BASE_URL = "https://ordinals.com/inscription/";

export function createOrdinalExplorerUrl(inscriptionNumber?: number) {
  return Ordiscan_BASE_URL + inscriptionNumber;
}
