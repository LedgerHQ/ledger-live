import { CounterValuesStateRaw, CounterValuesStatus } from "@ledgerhq/live-countervalues/types";

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const initialCountervaluesMock = {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  status: {
    "USD ethereum": {
      oldestDateRequested: "2020-04-22T11:51:36.000Z",
      timestamp: 1749558512861,
    },
    "USD bitcoin": {
      oldestDateRequested: "2020-04-22T11:51:36.000Z",
      timestamp: 1749558512861,
    },
    "USD scroll": {
      oldestDateRequested: "2020-04-22T11:51:36.000Z",
      timestamp: 1749558512861,
    },
    "USD base": {
      oldestDateRequested: "2020-04-22T11:51:36.000Z",
      timestamp: 1749558512861,
    },
    "USD arbitrum": {
      oldestDateRequested: "2020-04-22T11:51:36.000Z",
      timestamp: 1749558512861,
    },
  } as CounterValuesStatus,
  "USD ethereum": {
    latest: 2773.41,
    "2023-07-10": 1866.0360578521072,
    "2022-07-10": 1180.9052284255263,
    "2023-08-20": 1671.2576000814242,
    "2024-02-23": 2941.9404144517216,
    "2023-10-01": 1680.4357216898898,
  },
  "USD bitcoin": {
    latest: 30257.429159126357,
    "2023-07-10": 30257.429159126357,
    "2022-07-10": 21228.103783041395,
    "2023-08-20": 26122.52806509709,
    "2024-02-23": 51053.27128889675,
    "2023-10-01": 27137.104783461087,
  },
  "USD scroll": {
    latest: 2773.41,
    "2023-07-10": 1866.0360578521072,
    "2022-07-10": 1180.9052284255263,
    "2023-08-20": 1671.2576000814242,
    "2024-02-23": 2941.9404144517216,
    "2023-10-01": 1680.4357216898898,
  },
  "USD base": {
    latest: 2773.41,
    "2023-07-10": 1866.0360578521072,
    "2022-07-10": 1180.9052284255263,
    "2023-08-20": 1671.2576000814242,
    "2024-02-23": 2941.9404144517216,
    "2023-10-01": 1680.4357216898898,
  },
  "USD arbitrum": {
    latest: 2773.41,
    "2023-07-10": 1866.0360578521072,
    "2022-07-10": 1180.9052284255263,
    "2023-08-20": 1671.2576000814242,
    "2024-02-23": 2941.9404144517216,
    "2023-10-01": 1680.4357216898898,
  },
} as unknown as CounterValuesStateRaw;
