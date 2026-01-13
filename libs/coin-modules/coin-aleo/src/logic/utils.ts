import invariant from "invariant";

export function parseMicrocredits(microcreditsU64: string) {
  invariant(microcreditsU64.endsWith("u64"), `aleo: invalid balance format (${microcreditsU64})`);
  return microcreditsU64.slice(0, -3);
}
