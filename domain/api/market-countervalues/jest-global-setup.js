module.exports = async () => {
  /**
   * The mock rate series is a function of wall-clock time, so the ported expectations in
   * loadCountervalues.mock.test.ts only reproduce under the timezone they were recorded in.
   * @ledgerhq/live-countervalues pinned it the same way; without this they drift by the UTC offset.
   */
  process.env.TZ = "America/New_York";
};
