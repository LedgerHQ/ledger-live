import { calcComputeMass, calcStorageMass, calcTotalMass } from "../massCalcluation";
import { BigNumber } from "bignumber.js";

const DEFAULT_MASS_2_OUTPUTS = 918;
const ADDITIONAL_MASS_PER_INPUT = 1118;
const MAX_MASS = 100_000;
const THROWAWAY_CHANGE_THRESHOLD: BigNumber = BigNumber(1000_0000);

export function calculateChangeAmount(
  inputs: BigNumber[],
  amount: BigNumber,
  fee_rate: number,
): { changeAmount: BigNumber; mass: number; fee: BigNumber } {
  // start with default compute mass and let it grow
  let mass = DEFAULT_MASS_2_OUTPUTS + ADDITIONAL_MASS_PER_INPUT * inputs.length;
  let fee = BigNumber(Math.ceil(mass * fee_rate));
  let changeAmount = sumBigNumber(inputs).minus(amount).minus(fee);
  let prev_fee: BigNumber | null = null;
  let discard_change = changeAmount.lt(0);

  while (prev_fee === null || !fee.eq(prev_fee)) {
    prev_fee = fee;
    // TX with two outputs
    if (!discard_change) {
      mass = calcTotalMass(inputs, [amount, changeAmount]);
      fee = BigNumber(Math.ceil(mass * fee_rate));
    } else {
      // trying with one output
      mass = calcStorageMass(inputs, [amount]);
      mass = Math.max(mass, calcComputeMass(inputs.length, false, false)); // TODO: recognize ECDSA
      // change is zero, so diff is prev_fee
      fee = sumBigNumber(inputs).minus(amount);

      if (fee.lt(BigNumber(Math.ceil(mass * fee_rate)))) {
        throw new Error(
          `Insufficient fee: calculated fee ${fee} is less than the minimum fee ( with fee_rate ) ${mass * fee_rate}.`,
        );
      }
    }

    // calculate change amount with current fee
    changeAmount = sumBigNumber(inputs).minus(amount).minus(fee);

    // if
    //    1. mass exceeds 100_000g
    // or 2. change_amount is lower than 0 ( can't pay desired fee )
    // try to discard the change and try again
    if (mass > MAX_MASS || changeAmount.lt(BigNumber(0))) {
      // try without change
      if (!discard_change && changeAmount <= THROWAWAY_CHANGE_THRESHOLD) {
        // try once again with discarding change address
        discard_change = true;
        continue;
      }

      // tried everything. Mass is too high
      throw new Error(
        `Mass too high. This TX is not working with mass ${mass}g and fee ${fee} Sompis.`,
      );
    }
  }

  return {
    changeAmount,
    fee,
    mass,
  };
}

export const sumBigNumber = (values: BigNumber[]): BigNumber => {
  return values.reduce((acc, v) => acc.plus(v), BigNumber(0));
};
