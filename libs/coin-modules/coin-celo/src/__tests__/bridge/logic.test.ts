import BigNumber from "bignumber.js";
import { accountFixture } from "../../bridge/fixtures";
import {
  activatableVotes,
  availablePendingWithdrawals,
  defaultValidatorGroupAddress,
  fallbackValidatorGroup,
  getPendingStakingOperationAmounts,
  getValidatorGroupsWithoutVotes,
  getValidatorGroupsWithVotes,
  getVote,
  hasActivatableVotes,
  hasRevokableVotes,
  hasWithdrawableBalance,
  isAccountRegistrationPending,
  isDefaultValidatorGroup,
  isDefaultValidatorGroupAddress,
  revokableVotes,
  voteStatus,
  withdrawableBalance,
} from "../../logic";
import { CeloAccount } from "../../types";
import { Operation } from "@ledgerhq/types-live";

jest.useFakeTimers().setSystemTime(new Date("2020-01-01"));

describe("logic", () => {
  it("availablePendingWithdrawals", () => {
    const result = availablePendingWithdrawals({
      ...accountFixture,
      celoResources: {
        ...accountFixture.celoResources,
        pendingWithdrawals: [
          {
            value: BigNumber(123123123),
            time: BigNumber(31231),
            index: 0,
          },
          {
            value: BigNumber(123123123),
            time: BigNumber(23214451),
            index: 0,
          },
          {
            value: BigNumber(123123123),
            time: BigNumber(1577836900000),
            index: 0,
          },
        ],
      },
    });

    expect(result).toHaveLength(2);
  });

  it("withdrawableBalance", () => {
    const account = {
      ...accountFixture,
      celoResources: {
        ...accountFixture.celoResources,
        pendingWithdrawals: [
          {
            value: BigNumber(123123123),
            time: BigNumber(31231),
            index: 0,
          },
          {
            value: BigNumber(123123123),
            time: BigNumber(23214451),
            index: 0,
          },
          {
            value: BigNumber(123123123),
            time: BigNumber(1577836900000),
            index: 0,
          },
        ],
      },
    };

    expect(withdrawableBalance(account)).toEqual(BigNumber(246246246));
    expect(hasWithdrawableBalance(account)).toBeTruthy();
  });

  it("isDefaultValidatorGroupAddress", () => {
    expect(isDefaultValidatorGroupAddress("other_address")).toBeFalsy();
    expect(isDefaultValidatorGroupAddress(defaultValidatorGroupAddress())).toBeTruthy();
    expect(
      isDefaultValidatorGroup({
        address: "validator_address",
        name: "validator1",
        votes: BigNumber(8484848),
      }),
    ).toBeFalsy();
    expect(
      isDefaultValidatorGroup({
        address: defaultValidatorGroupAddress(),
        name: "validator1",
        votes: BigNumber(8484848),
      }),
    ).toBeTruthy();
  });

  it("activatableVotes", () => {
    const account = {
      ...accountFixture,
      celoResources: {
        ...accountFixture.celoResources,
        votes: [
          {
            validatorGroup: "1",
            amount: BigNumber(123),
            activatable: true,
            revokable: false,
            type: "active",
            index: 0,
          },
          {
            validatorGroup: "2",
            amount: BigNumber(123213),
            activatable: false,
            revokable: true,
            type: "pending",
            index: 0,
          },
          {
            validatorGroup: "3",
            amount: BigNumber(1232223),
            activatable: true,
            revokable: false,
            type: "active",
            index: 0,
          },
        ],
      },
    } as CeloAccount;
    const result = activatableVotes(account);

    expect(result).toMatchObject([
      {
        validatorGroup: "1",
        amount: BigNumber(123),
        activatable: true,
        revokable: false,
        type: "active",
        index: 0,
      },
      {
        validatorGroup: "3",
        amount: BigNumber(1232223),
        activatable: true,
        revokable: false,
        type: "active",
        index: 0,
      },
    ]);
    expect(hasActivatableVotes(account)).toBeTruthy();
    expect(revokableVotes(account)).toMatchObject([
      {
        validatorGroup: "2",
        amount: BigNumber(123213),
        activatable: false,
        revokable: true,
        type: "pending",
        index: 0,
      },
    ]);
    expect(hasRevokableVotes(account)).toBeTruthy();
  });

  it("getVote", () => {
    const account = {
      ...accountFixture,
      celoResources: {
        ...accountFixture.celoResources,
        votes: [
          {
            validatorGroup: "1",
            amount: BigNumber(123),
            activatable: true,
            revokable: false,
            type: "active",
            index: 0,
          },
          {
            validatorGroup: "2",
            amount: BigNumber(123213),
            activatable: false,
            revokable: true,
            type: "pending",
            index: 0,
          },
          {
            validatorGroup: "3",
            amount: BigNumber(1232223),
            activatable: true,
            revokable: false,
            type: "active",
            index: 0,
          },
        ],
      },
    } as CeloAccount;
    const result = getVote(account, "2", 0);

    expect(result).toMatchObject({
      validatorGroup: "2",
      amount: BigNumber(123213),
      activatable: false,
      revokable: true,
      type: "pending",
      index: 0,
    });
  });

  it("voteStatus", () => {
    expect(
      voteStatus({
        validatorGroup: "2",
        amount: BigNumber(123213),
        activatable: true,
        revokable: true,
        type: "pending",
        index: 0,
      }),
    ).toEqual("awaitingActivation");
    expect(
      voteStatus({
        validatorGroup: "2",
        amount: BigNumber(123213),
        activatable: false,
        revokable: true,
        type: "pending",
        index: 0,
      }),
    ).toEqual("pending");
  });

  it("fallbackValidatorGroup", () => {
    expect(fallbackValidatorGroup("address")).toMatchObject({
      address: "address",
      name: "address",
      votes: BigNumber(0),
    });
  });

  it("isAccountRegistrationPending", () => {
    const account = {
      ...accountFixture,
      pendingOperations: [
        {
          id: "pendingOperation1",
          accountId: accountFixture.id,
          blockHash: "block_hash",
          blockHeight: 1,
          date: new Date(),
          type: "REGISTER",
          senders: [],
          recipients: [],
          fee: BigNumber(0),
          value: BigNumber(1),
          hash: "hash",
          extra: "extra",
        } as Operation,
      ],
      celoResources: {
        ...accountFixture.celoResources,
        registrationStatus: false,
      },
    } as CeloAccount;

    expect(isAccountRegistrationPending(account)).toBeTruthy();
  });

  it("getPendingStakingOperationAmounts", () => {
    const account = {
      ...accountFixture,
      pendingOperations: [
        {
          id: "pendingOperation1",
          accountId: accountFixture.id,
          blockHash: "block_hash",
          blockHeight: 1,
          date: new Date(),
          type: "VOTE",
          senders: [],
          recipients: [],
          fee: BigNumber(0),
          value: BigNumber(2),
          hash: "hash",
          extra: "extra",
        } as Operation,
        {
          id: "pendingOperation1",
          accountId: accountFixture.id,
          blockHash: "block_hash",
          blockHeight: 1,
          date: new Date(),
          type: "VOTE",
          senders: [],
          recipients: [],
          fee: BigNumber(0),
          value: BigNumber(10),
          hash: "hash",
          extra: "extra",
        } as Operation,
        {
          id: "pendingOperation1",
          accountId: accountFixture.id,
          blockHash: "block_hash",
          blockHeight: 1,
          date: new Date(),
          type: "LOCK",
          senders: [],
          recipients: [],
          fee: BigNumber(0),
          value: BigNumber(30),
          hash: "hash",
          extra: "extra",
        } as Operation,
        {
          id: "pendingOperation1",
          accountId: accountFixture.id,
          blockHash: "block_hash",
          blockHeight: 1,
          date: new Date(),
          type: "REGISTER",
          senders: [],
          recipients: [],
          fee: BigNumber(0),
          value: BigNumber(30),
          hash: "hash",
          extra: "extra",
        } as Operation,
      ],
      celoResources: {
        ...accountFixture.celoResources,
        registrationStatus: false,
      },
    } as CeloAccount;
    const result = getPendingStakingOperationAmounts(account);
    expect(result).toMatchObject({
      vote: BigNumber(12),
      lock: BigNumber(30),
    });
  });

  it("getPendingStakingOperationAmounts", () => {
    const account = {
      ...accountFixture,
      pendingOperations: [
        {
          id: "pendingOperation1",
          accountId: accountFixture.id,
          blockHash: "block_hash",
          blockHeight: 1,
          date: new Date(),
          type: "VOTE",
          senders: [],
          recipients: [],
          fee: BigNumber(0),
          value: BigNumber(2),
          hash: "hash",
          extra: "extra",
        } as Operation,
        {
          id: "pendingOperation1",
          accountId: accountFixture.id,
          blockHash: "block_hash",
          blockHeight: 1,
          date: new Date(),
          type: "VOTE",
          senders: [],
          recipients: [],
          fee: BigNumber(0),
          value: BigNumber(10),
          hash: "hash",
          extra: "extra",
        } as Operation,
        {
          id: "pendingOperation1",
          accountId: accountFixture.id,
          blockHash: "block_hash",
          blockHeight: 1,
          date: new Date(),
          type: "LOCK",
          senders: [],
          recipients: [],
          fee: BigNumber(0),
          value: BigNumber(30),
          hash: "hash",
          extra: "extra",
        } as Operation,
        {
          id: "pendingOperation1",
          accountId: accountFixture.id,
          blockHash: "block_hash",
          blockHeight: 1,
          date: new Date(),
          type: "REGISTER",
          senders: [],
          recipients: [],
          fee: BigNumber(0),
          value: BigNumber(30),
          hash: "hash",
          extra: "extra",
        } as Operation,
      ],
      celoResources: {
        ...accountFixture.celoResources,
        registrationStatus: false,
      },
      operations: [
        {
          id: "operation1",
          accountId: accountFixture.id,
          blockHash: "block_hash",
          blockHeight: 1,
          date: new Date(),
          type: "LOCK",
          senders: [],
          recipients: [],
          fee: BigNumber(0),
          value: BigNumber(1),
          hash: "hash",
          extra: "extra",
        } as Operation,
      ],
      operationsCount: 1,
    } as CeloAccount;
    const result = getPendingStakingOperationAmounts(account);
    expect(result).toMatchObject({
      vote: BigNumber(0),
      lock: BigNumber(0),
    });
  });

  it("getValidatorGroupsWithVotes", () => {
    const result = getValidatorGroupsWithVotes(
      [
        {
          address: "validator1",
          name: "validator1",
          votes: BigNumber(3),
        },
        {
          address: "validator2",
          name: "validator2",
          votes: BigNumber(4),
        },
        {
          address: "validator3",
          name: "validator3",
          votes: BigNumber(0),
        },
      ],
      [
        {
          validatorGroup: "validator1",
          amount: BigNumber(1),
          activatable: true,
          revokable: true,
          type: "active",
          index: 0,
        },
        {
          validatorGroup: "validator2",
          amount: BigNumber(2),
          activatable: true,
          revokable: true,
          type: "active",
          index: 0,
        },
      ],
    );

    expect(result).toMatchObject([
      {
        address: "validator1",
        name: "validator1",
        votes: BigNumber(3),
      },
      {
        address: "validator2",
        name: "validator2",
        votes: BigNumber(4),
      },
    ]);
  });

  it("getValidatorGroupsWithoutVotes", () => {
    const result = getValidatorGroupsWithoutVotes(
      [
        {
          address: "validator1",
          name: "validator1",
          votes: BigNumber(3),
        },
        {
          address: "validator2",
          name: "validator2",
          votes: BigNumber(4),
        },
        {
          address: "validator3",
          name: "validator3",
          votes: BigNumber(0),
        },
      ],
      [
        {
          validatorGroup: "validator1",
          amount: BigNumber(1),
          activatable: true,
          revokable: true,
          type: "active",
          index: 0,
        },
        {
          validatorGroup: "validator2",
          amount: BigNumber(2),
          activatable: true,
          revokable: true,
          type: "active",
          index: 0,
        },
      ],
    );

    expect(result).toMatchObject([
      {
        address: "validator3",
        name: "validator3",
        votes: BigNumber(0),
      },
    ]);
  });
});
