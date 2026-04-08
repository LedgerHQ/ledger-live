pragma circom 2.1.0;

include "circomlib/circuits/comparators.circom";

/**
 * Age verification circuit.
 *
 * Proves that the holder's date of birth satisfies a minimum age
 * requirement without revealing the actual date of birth.
 *
 * Dates are encoded as YYYYMMDD integers (e.g. 19900115 = Jan 15 1990).
 * The age check uses integer subtraction: if currentDate - dateOfBirth
 * >= minimumAge * 10000, the holder is at least minimumAge years old.
 *
 * Private inputs:
 *   dateOfBirth  - holder's DOB as YYYYMMDD integer
 *
 * Public inputs:
 *   currentDate  - today's date as YYYYMMDD integer
 *   minimumAge   - minimum age to prove (e.g. 18)
 */
template AgeVerification() {
    signal input dateOfBirth;
    signal input currentDate;
    signal input minimumAge;

    signal threshold;
    threshold <== minimumAge * 10000;

    signal diff;
    diff <== currentDate - dateOfBirth;

    // GreaterEqThan(n) checks that in[0] >= in[1] using n-bit decomposition.
    // 32 bits is sufficient for YYYYMMDD values (max ~20261231 < 2^25).
    component gte = GreaterEqThan(32);
    gte.in[0] <== diff;
    gte.in[1] <== threshold;
    gte.out === 1;
}

component main {public [currentDate, minimumAge]} = AgeVerification();
