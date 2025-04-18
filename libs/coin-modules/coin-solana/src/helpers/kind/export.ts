import { mapper as TransferMapper } from "./mappers/transfer";
import { mapper as TokenTransferMapper } from "./mappers/tokenTransfer";
import { mapper as TokenCreateATAMapper } from "./mappers/tokenCreateATA";
import { mapper as StakeWithdrawMapper } from "./mappers/stakeWithdraw";
import { mapper as StakeUndelegateMapper } from "./mappers/stakeUndelegate";
import { mapper as StakeSplitMapper } from "./mappers/stakeSplit";
import { mapper as StakeDelegateMapper } from "./mappers/stakeDelegate";
import { mapper as StakeCreateAccountMapper } from "./mappers/stakeCreateAccount";

export default [
  TransferMapper,
  TokenTransferMapper,
  TokenCreateATAMapper,
  StakeWithdrawMapper,
  StakeUndelegateMapper,
  StakeSplitMapper,
  StakeDelegateMapper,
  StakeCreateAccountMapper,
];
