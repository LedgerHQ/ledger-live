// import { AccountLike } from "@ledgerhq/types-live";
// import { Transaction } from "../types";

type Options =
  | { name: string; type: StringConstructor; desc: string }
  | { name: string; type: StringConstructor; desc: string; multiple: boolean };

const options: Array<Options> = [
  {
    name: "mode",
    type: String,
    desc: "mode of transaction: send, nominate, bond, claimReward, withdrawUnbonded",
  },
];

export type CliTools = {
  options: Array<Options>;
  // inferTransactions: (
  //   transactions: Array<{
  //     account: AccountLike;
  //     transaction: Transaction;
  //   }>,
  //   opts: Record<string, any>,
  //   { inferAmount }: any,
  // ) => Transaction[];
  // commands: { suiValidators: Validators };
};

export default function makeCliTools(): CliTools {
  return {
    options,
    // inferTransactions,
    // commands: {
    //   suiValidators: createValidators(),
    // },
  };
}
