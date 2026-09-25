import { pickNumericRates } from "./rates";

test("keeps numeric entries", () => {
  expect(pickNumericRates({ "2018-03-01": 9000, "2018-03-02": 9100 })).toEqual({
    "2018-03-01": 9000,
    "2018-03-02": 9100,
  });
});

test("drops a bad entry instead of rejecting the whole payload", () => {
  expect(pickNumericRates({ btc: 9000, eth: null, xrp: "1", ltc: 50 })).toEqual({
    btc: 9000,
    ltc: 50,
  });
});

test("handles an empty payload", () => {
  expect(pickNumericRates({})).toEqual({});
});
