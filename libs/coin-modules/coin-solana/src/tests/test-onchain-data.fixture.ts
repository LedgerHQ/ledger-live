import BigNumber from "bignumber.js";

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
    // SIMD-0437 progressively reduces stake account rent (328 bytes = 200 data + 128 overhead):
    // Step 0 (pre-SIMD-0437): 6,960 × 328 = 2,282,880
    // Step 1 (Sep 2026):      6,333 × 328 = 2,077,224
    // Step 2 (mid-Sep 2026):  5,080 × 328 = 1,666,240
    // Step 3 (Nov 2026):      2,575 × 328 =   844,600
    // Step 4 (Nov 2026):      1,322 × 328 =   433,616
    // Step 5 (Nov 2026):        696 × 328 =   228,288
    stakeAccountRentExempt: 2_077_224, // Step 1 active on mainnet; update to current step when SIMD-0437 advances
    // SIMD-0437 progressively reduces system account rent (128 bytes overhead only):
    // Step 0 (pre-SIMD-0437): 6,960 × 128 = 890,880
    // Step 1 (Sep 2026):      6,333 × 128 = 810,624
    // Step 2 (mid-Sep 2026):  5,080 × 128 = 650,240
    // Step 3 (Nov 2026):      2,575 × 128 = 329,600
    // Step 4 (Nov 2026):      1,322 × 128 = 169,216
    // Step 5 (Nov 2026):        696 × 128 =  89,088
    systemAccountRentExempt: 810_624, // Step 1 active on mainnet; update to current step when SIMD-0437 advances
    lamportsPerSignature: 5000,
  },
  // ---  maybe outdated or not real, fine for tests ---
  offEd25519Address: "6D8GtWkKJgToM5UoiByHqjQCCC9Dq1Hh7iNmU4jKSs14",
  offEd25519Address2: "12rqwuEgBYiGhBrDJStCiqEtzQpTTiZbh7teNVLuYcFA",
};
