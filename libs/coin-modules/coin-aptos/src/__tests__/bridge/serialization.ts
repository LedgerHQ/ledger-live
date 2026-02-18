import { AccountRaw } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { createFixtureAccount } from "../../bridge/bridge.fixture";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromAptosResourcesRaw,
  toAptosResourcesRaw,
} from "../../bridge/serialization";
import { AptosAccountRaw } from "../../types";

describe("serialization", () => {
  const stakingPositions = [
    {
      active: BigNumber(123456789),
      inactive: BigNumber(567567567),
      pendingInactive: BigNumber(5345),
      validatorId: "validator-1",
    },
    {
      active: BigNumber(0),
      inactive: BigNumber(33333),
      pendingInactive: BigNumber(67868678),
      validatorId: "validator-2",
    },
    {
      active: BigNumber(45864986459),
      inactive: BigNumber(0),
      pendingInactive: BigNumber(0),
      validatorId: "validator-3",
    },
  ];

  const aptosResources = {
    activeBalance: BigNumber(9834759839345),
    inactiveBalance: BigNumber(789346249),
    pendingInactiveBalance: BigNumber(0),
    stakingPositions,
  };

  const aptosResourcesRaw = {
    activeBalance: "9834759839345",
    pendingInactiveBalance: "0",
    inactiveBalance: "789346249",
    stakingPositions: [
      {
        active: "123456789",
        pendingInactive: "5345",
        inactive: "567567567",
        validatorId: "validator-1",
      },
      {
        active: "0",
        pendingInactive: "67868678",
        inactive: "33333",
        validatorId: "validator-2",
      },
      {
        active: "45864986459",
        pendingInactive: "0",
        inactive: "0",
        validatorId: "validator-3",
      },
    ],
  };

  const account = createFixtureAccount({ aptosResources });

  const accountRaw = {
    id: "1",
    seedIdentifier: "seedIdentifier",
    derivationMode: "",
    index: 1,
    freshAddress: "freshAddress",
    freshAddressPath: "freshAddressPath",
    balance: "1234",
    blockHeight: 1,
    currencyId: "aptos",
    operations: [],
    pendingOperations: [],
    lastSyncDate: "",
  };

  it("toAptosResourcesRaw", () => {
    expect(toAptosResourcesRaw(aptosResources)).toMatchObject(aptosResourcesRaw);
  });

  it("fromAptosResourcesRaw", () => {
    expect(fromAptosResourcesRaw(aptosResourcesRaw)).toMatchObject(aptosResources);
  });

  it("assignToAccountRaw", () => {
    assignToAccountRaw(account, accountRaw as AccountRaw);
    expect((accountRaw as unknown as AptosAccountRaw).aptosResources).toMatchObject(
      aptosResourcesRaw,
    );
  });

  it("assignFromAccountRaw", () => {
    assignFromAccountRaw(accountRaw as AccountRaw, account);
    expect((account as unknown as AptosAccountRaw).aptosResources).toMatchObject(aptosResources);
  });
});
