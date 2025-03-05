import BigNumber from "bignumber.js";
import { SYSTEM_ACCOUNT_RENT_EXEMPT } from "../utils";

// do not change real properties or the test will break
export const testOnChainData = {
  //  --- real props ---
  unfundedAddress: "7b6Q3ap8qRzfyvDw1Qce3fUV8C7WgFNzJQwYNTJm3KQo",
  // 0/0
  fundedSenderAddress: "AQbkEagmPgmsdAfS4X8V8UyJnXXjVPMvjeD15etqQ3Jh",
  fundedSenderBalance: new BigNumber(83389840),
  // 1000/0
  fundedAddress: "ARRKL4FT4LMwpkhUw4xNbfiHqR7UdePtzGLvkszgydqZ",
  wSolSenderAssocTokenAccAddress: "8RtwWeqdFz4EFuZU3MAadfYMWSdRMamjFrfq6BXkHuNN",
  wSolSenderAssocTokenAccBalance: new BigNumber(7960720),
  // 1000/0, mint - wrapped sol
  wSolFundedAccountAssocTokenAccAddress: "Ax69sAxqBSdT3gMAUqXb8pUvgxSLCiXfTitMALEnFZTS",
  // 0/0
  notWSolTokenAccAddress: "Hsm3S2rhX4HwxYBaCyqgJ1cCtFyFSBu6HLy1bdvh7fKs",
  validatorAddress: "9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF",
  fees: {
    stakeAccountRentExempt: 2282880,
    systemAccountRentExempt: SYSTEM_ACCOUNT_RENT_EXEMPT,
    lamportsPerSignature: 5000,
  },
  // ---  maybe outdated or not real, fine for tests ---
  offEd25519Address: "6D8GtWkKJgToM5UoiByHqjQCCC9Dq1Hh7iNmU4jKSs14",
  offEd25519Address2: "12rqwuEgBYiGhBrDJStCiqEtzQpTTiZbh7teNVLuYcFA",
};
