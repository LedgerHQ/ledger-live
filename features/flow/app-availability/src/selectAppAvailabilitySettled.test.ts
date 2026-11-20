import { selectAppAvailabilitySettled } from "./selectAppAvailabilitySettled";

type CheckSubState = {
  status: "uninitialized" | "pending" | "fulfilled" | "rejected";
  data?: boolean;
  error?: unknown;
};

let mockCheck: CheckSubState = { status: "uninitialized" };

// The store keeps the check's data and error; RTK Query derives the flags from the status alone.
jest.mock("@domain/api-ofac", () => ({
  ofacApi: {
    endpoints: {
      checkOfacGeoBlock: {
        select: () => () => ({
          ...mockCheck,
          isUninitialized: mockCheck.status === "uninitialized",
          isLoading: mockCheck.status === "pending",
          isSuccess: mockCheck.status === "fulfilled",
          isError: mockCheck.status === "rejected",
        }),
      },
    },
  },
}));

const ROOT_STATE = {};
const SERVER_ERROR = { status: 500, data: "" };

describe("selectAppAvailabilitySettled", () => {
  it("should not be settled before the check starts", () => {
    mockCheck = { status: "uninitialized" };

    expect(selectAppAvailabilitySettled(ROOT_STATE)).toBe(false);
  });

  it("should not be settled while the first check is pending", () => {
    mockCheck = { status: "pending" };

    expect(selectAppAvailabilitySettled(ROOT_STATE)).toBe(false);
  });

  it("should be settled when the check answers", () => {
    mockCheck = { status: "fulfilled", data: false };

    expect(selectAppAvailabilitySettled(ROOT_STATE)).toBe(true);
  });

  it("should be settled when the check fails", () => {
    mockCheck = { status: "rejected", error: SERVER_ERROR };

    expect(selectAppAvailabilitySettled(ROOT_STATE)).toBe(true);
  });

  it("should stay settled while a failed check is fetched again", () => {
    mockCheck = { status: "pending", error: SERVER_ERROR };

    expect(selectAppAvailabilitySettled(ROOT_STATE)).toBe(true);
  });

  it("should stay settled while an answered check is fetched again", () => {
    mockCheck = { status: "pending", data: true };

    expect(selectAppAvailabilitySettled(ROOT_STATE)).toBe(true);
  });
});
