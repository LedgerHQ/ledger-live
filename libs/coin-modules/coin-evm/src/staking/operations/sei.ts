import { RedelegateDstValAddressRequired } from "@ledgerhq/errors";
import { seiEvmAmountToUsei } from "../../utils";
import type { OperationParamsWithValAddress, StakingProtocol } from "./types";

const seiProtocol: StakingProtocol<OperationParamsWithValAddress> = {
  // `delegate` is payable: the amount is carried by msg.value (wei, 18 decimals)
  // and converted by the precompile, so no amount goes into the calldata.
  delegate: ({ valAddress }) => [valAddress],
  // `undelegate` and `redelegate` take the amount in usei (6 decimals) in the
  // calldata. The intent's `amount` is expressed in the 18-decimal EVM unit,
  // so we scale it down here. See `seiEvmAmountToUsei` for details.
  undelegate: ({ valAddress, amount }) => [valAddress, seiEvmAmountToUsei(amount)],
  redelegate: ({ valAddress, amount, dstValAddress }) => {
    if (!dstValAddress) throw new RedelegateDstValAddressRequired();
    return [valAddress, dstValAddress, seiEvmAmountToUsei(amount)];
  },
  getStakedBalance: ({ dstValAddress, delegator }) => {
    if (!delegator || !dstValAddress) {
      throw new Error("Sei getStakedBalance requires delegator and dstValAddress");
    }
    return [delegator, dstValAddress];
  },
  claimReward: ({ valAddress }) => [valAddress],
};

export default seiProtocol;
