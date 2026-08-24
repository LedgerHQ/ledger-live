const DEFAULT_EDGE = 8;

export type AddressParts = Readonly<{
  start: string;
  middle: string;
  end: string;
}>;

export function splitAddress(address: string, edge: number = DEFAULT_EDGE): AddressParts {
  if (edge <= 0 || address.length <= edge * 2) {
    return { start: address, middle: "", end: "" };
  }

  return {
    start: address.slice(0, edge),
    middle: address.slice(edge, -edge),
    end: address.slice(-edge),
  };
}
