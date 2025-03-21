import { Operation } from "@ledgerhq/coin-framework/api/types";
import network from "../network";
import { PolkadotOperation } from "../types";

export async function listOperations(
  addr: string,
  { limit, startAt }: { limit: number; startAt?: number | undefined },
): Promise<[Operation<void>[], number]> {
  //The accountId is used to map Operations to Live types.
  const fakeAccountId = "";
  const operations = await network.getOperations(fakeAccountId, addr, startAt, limit);
  const blockHeight = operations.length > 0 ? operations.slice(-1)[0].blockHeight ?? 0 : 0;
  return [operations.map(convertToCoreOperation), blockHeight];
}

const convertToCoreOperation = (operation: PolkadotOperation) => {
  const { hash, type, value, fee, blockHeight, senders, recipients, date } = operation;
  return {
    operationIndex: 0,
    tx: {
      hash,
      fees: BigInt(fee.toString()),
      block: {
        height: blockHeight ?? 0,
        time: date,
      },
      date: date,
    },
    type,
    value: BigInt(value.toString()),
    senders,
    recipients,
  };
};
