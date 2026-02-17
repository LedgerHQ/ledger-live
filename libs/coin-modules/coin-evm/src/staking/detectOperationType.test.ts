import { ethers } from "ethers";
import { StakingOperation } from "./../types/staking";
import { detectEvmStakingOperationType, isStakingOperation } from "./detectOperationType";

describe("isStakingOperation", () => {
  const validOperations: StakingOperation[] = [
    "delegate",
    "undelegate",
    "redelegate",
    "getStakedBalance",
    "getUnstakedBalance",
  ];

  const invalidOperations: string[] = [
    "invalidOperation1",
    "invalidOperation2",
    "randomString",
    "12345",
    "",
  ];

  it("should return true for valid staking operations", () => {
    validOperations.forEach(operation => {
      expect(isStakingOperation(operation)).toBe(true);
    });
  });

  it("should return false for invalid staking operations", () => {
    invalidOperations.forEach(operation => {
      expect(isStakingOperation(operation)).toBe(false);
    });
  });

  it("should return false for non-staking strings", () => {
    expect(isStakingOperation("someRandomString")).toBe(false);
  });
});
describe("detectEvmStakingOperationType", () => {
  const contractAddress = "0x0000000000000000000000000000000000001005"; // Example contract address for sei_evm

  it("should return correct OperationType for delegate", () => {
    const fn = "delegate(string)";
    const methodId = ethers.id(fn).slice(0, 10).toLowerCase();
    const result = detectEvmStakingOperationType("sei_evm", contractAddress, methodId);
    expect(result).toBe("DELEGATE");
  });

  it("should return correct OperationType for redelegate", () => {
    const fn = "redelegate(string,string,uint256)";
    const methodId = ethers.id(fn).slice(0, 10).toLowerCase();
    const result = detectEvmStakingOperationType("sei_evm", contractAddress, methodId);
    expect(result).toBe("REDELEGATE");
  });

  it("should return undefined for invalid methodId", () => {
    const result = detectEvmStakingOperationType("sei_evm", contractAddress, "0xdeadbeef");
    expect(result).toBeUndefined();
  });

  it("should return undefined for mismatched contract address", () => {
    const methodId = "0x9ddb511a"; // selector for delegate(address,uint256)
    const result = detectEvmStakingOperationType("sei_evm", "0xDifferentAddress", methodId);
    expect(result).toBeUndefined();
  });

  it("should return undefined if methodId or address is missing", () => {
    expect(detectEvmStakingOperationType("sei_evm", null, "0x1234")).toBeUndefined();
    expect(detectEvmStakingOperationType("sei_evm", contractAddress, null)).toBeUndefined();
  });

  it("should return undefined for unknown currencyId", () => {
    const methodId = "0x9ddb511a"; // selector for delegate(address,uint256)
    expect(detectEvmStakingOperationType("unknown", contractAddress, methodId)).toBeUndefined();
  });
});
