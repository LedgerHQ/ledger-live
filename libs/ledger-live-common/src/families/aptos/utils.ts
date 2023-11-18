const cleanHex = /^0x0*|^0+/;

export function compareAddress(addressA: string, addressB: string) {
  return (
    addressA.replace(cleanHex, "").toLowerCase() === addressB.replace(cleanHex, "").toLowerCase()
  );
}
