import BigNumber from "bignumber.js";
import type { Account, Operation, OperationType, TokenAccount } from "@ledgerhq/types-live";

export function findSubAccount(account: Account, tokenId: string): TokenAccount | undefined {
  return account.subAccounts?.find(sub => sub.token.id === tokenId);
}

export function getSubAccount(account: Account, tokenId: string): TokenAccount {
  const found = findSubAccount(account, tokenId);
  if (!found) throw new Error(`no sub-account for ${tokenId}`);

  return found;
}

export function getOperationIds(account: Account, tokenId: string): string[] {
  return getSubAccount(account, tokenId).operations.map(({ id }) => id);
}

/** The XRP that the base reserve and every owned entry lock */
export function getLockedReserve(account: Account): BigNumber {
  return account.balance.minus(account.spendableBalance);
}

export function expectParentRow(
  previous: Account,
  current: Account,
  type: OperationType,
): Operation {
  expect(current.operations.length - previous.operations.length).toBe(1);

  const [row] = current.operations;
  expect(row.type).toBe(type);
  expect(row.hasFailed).toBe(false);
  expect(row.fee.gt(0)).toBe(true);
  expect(current.balance).toStrictEqual(previous.balance.minus(row.fee));

  return row;
}

function expectTokenRow(
  previous: Account,
  current: Account,
  tokenId: string,
  { type, value, recipient }: { type: OperationType; value: BigNumber; recipient?: string },
): Operation {
  const previousSub = getSubAccount(previous, tokenId);
  const sub = getSubAccount(current, tokenId);
  expect(sub.operations.length - previousSub.operations.length).toBe(1);

  const [row] = sub.operations;
  expect(row.type).toBe(type);
  expect(row.value).toStrictEqual(value);
  if (recipient) expect(row.recipients).toStrictEqual([recipient]);

  return row;
}

export function expectTokenSend(
  previous: Account,
  current: Account,
  tokenId: string,
  { value, recipient }: { value: BigNumber; recipient: string },
): Operation {
  const parent = expectParentRow(previous, current, "FEES");
  const sent = expectTokenRow(previous, current, tokenId, { type: "OUT", value, recipient });
  expect(sent.hash).toBe(parent.hash);

  const previousBalance = getSubAccount(previous, tokenId).balance;
  expect(getSubAccount(current, tokenId).balance).toStrictEqual(previousBalance.minus(value));

  return sent;
}

/** Asserts the token account's last operation, one the account did not sign. */
export function expectLatestTokenOperation(
  account: Account,
  tokenId: string,
  { type, value }: { type: OperationType; value: BigNumber },
): void {
  const [latest] = getSubAccount(account, tokenId).operations;
  expect(latest.type).toBe(type);
  expect(latest.value).toStrictEqual(value);
}

/** The XRP the account spent on fees. An IN or a NONE row is a transaction another account paid for. */
export function getFeesPaid(account: Account): BigNumber {
  return account.operations
    .filter(op => op.type !== "IN" && op.type !== "NONE")
    .reduce((sum, op) => sum.plus(op.fee), new BigNumber(0));
}
