import { SuiTransactionBlockKind } from "@mysten/sui/client";
import { ProgrammableTransaction } from "../types/sdk";

export function isStaking(block?: SuiTransactionBlockKind): block is ProgrammableTransaction {
  return hasMoveCallWithFunction("request_add_stake", block);
}

export function isUnstaking(block?: SuiTransactionBlockKind): block is ProgrammableTransaction {
  return hasMoveCallWithFunction("request_withdraw_stake", block);
}

function hasMoveCallWithFunction(
  functionName: string,
  block?: SuiTransactionBlockKind,
): block is ProgrammableTransaction {
  if (block?.kind === "ProgrammableTransaction") {
    const move = block.transactions.find(
      item => "MoveCall" in item && item["MoveCall"].function === functionName,
    ) as any;
    return Boolean(move);
  } else {
    return false;
  }
}
