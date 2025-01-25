import BigNumber from "bignumber.js";
import * as jsHelpers from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { AccountShapeInfo } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation, SyncConfig } from "@ledgerhq/types-live";
import { CosmosAPI } from "./api/Cosmos";
import { getAccountShape } from "./synchronisation";
import { CosmosAccount, CosmosOperation, CosmosTx } from "./types";

jest.mock("./api/Cosmos");
jest.mock("@ledgerhq/coin-framework/account");
jest.mock("@ledgerhq/coin-framework/bridge/jsHelpers");

const infoMock = {
  currency: {
    units: [{}, { code: "uatom" }],
  } as CryptoCurrency,
  address: "address",
  index: 0,
} as AccountShapeInfo<CosmosAccount>;

const baseAccountInfoMock = {
  txs: [],
  delegations: [],
  unbondings: [],
  balances: new BigNumber(0),
  accountInfo: { sequence: 0, accountNumber: 0 },
};

const baseTxMock = {
  logs: [],
  txhash: "2",
  tx: {
    auth_info: {
      signer_infos: [{ sequence: "seq" }],
      fee: { amount: [{ denom: "uatom", amount: new BigNumber(1) }] },
    },
  },
};

const syncConfig = {} as SyncConfig;

function mockAccountInfo(
  partialMock: Partial<{
    delegations: any;
    unbondings: any;
    balances: BigNumber;
    txs: any[];
  }>,
) {
  // @ts-expect-error mocked
  CosmosAPI.mockReturnValueOnce({
    getAccountInfo: jest.fn().mockResolvedValue({ ...baseAccountInfoMock, ...partialMock }),
  });
}

function mockCosmosTx(tx: Partial<CosmosTx>) {
  return {
    events: [
      {
        type: "withdraw_rewards",
        attributes: [
          {
            key: "amount",
            value: "10uatom",
          },
          {
            key: "validator",
            value: "validatorAddressHehe",
          },
        ],
      },
    ],
    logs: [],
    txhash: "2",
    tx: {
      "@type": "/cosmos.tx.v1beta1.Tx",
      body: {
        messages: [
          {
            "@type": "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
            delegator_address: "address",
            validator_address: "validatorAddressHehe",
          },
        ],
        memo: "Ledger Live",
        timeout_height: "0",
        extension_options: [],
        non_critical_extension_options: [],
      },
      auth_info: {
        signer_infos: [{ sequence: "seq" }],
        fee: { amount: [{ denom: "uatom", amount: new BigNumber(0) }] },
      },
    },
    code: 0,
    ...tx,
  } as unknown as CosmosTx;
}

describe("getAccountShape", () => {
  let mergeOpsSpy: jest.SpyInstance;
  beforeEach(() => {
    // @ts-expect-error mocked
    CosmosAPI.mockClear();
    mergeOpsSpy = jest
      .spyOn(jsHelpers, "mergeOps")
      .mockImplementation((existing: Operation[], newlyFetched: Operation[]): Operation[] => [
        ...existing,
        ...newlyFetched,
      ]);
  });

  afterEach(() => {
    mergeOpsSpy.mockReset();
  });

  it("should sum up delegations to balance", async () => {
    mockAccountInfo({
      balances: new BigNumber(1),
      delegations: [{ amount: new BigNumber(2) }],
    });
    const account = await getAccountShape(infoMock, syncConfig);
    expect(account.balance).toEqual(new BigNumber(3));
  });

  it("should sum up delegation balances and assign it in cosmosResources delegatedBalances", async () => {
    mockAccountInfo({
      delegations: [{ amount: new BigNumber(1) }, { amount: new BigNumber(2) }],
    });
    const account = await getAccountShape(infoMock, syncConfig);
    expect((account as CosmosAccount).cosmosResources.delegatedBalance).toEqual(new BigNumber(3));
  });

  it("should sum up unbondings to balance", async () => {
    mockAccountInfo({
      balances: new BigNumber(2),
      unbondings: [{ amount: new BigNumber(3) }],
    });
    const account = await getAccountShape(infoMock, syncConfig);
    expect(account.balance).toEqual(new BigNumber(5));
  });

  it("estimate spendable balance correctly", async () => {
    // Shouldn't it be 97 ?
    mockAccountInfo({
      balances: new BigNumber(100),
      unbondings: [{ amount: new BigNumber(1) }],
      delegations: [{ amount: new BigNumber(2) }],
    });
    const account = await getAccountShape(infoMock, syncConfig);
    expect(account.spendableBalance).toEqual(new BigNumber(100));
  });

  it("should reduce balance to 0 if spendable balance is negative", async () => {
    mockAccountInfo({
      balances: new BigNumber(-10),
    });
    const account = await getAccountShape(infoMock, syncConfig);
    expect(account.spendableBalance).toEqual(new BigNumber(0));
  });

  it("should sum up pendingRewards and insert it in cosmosResources", async () => {
    mockAccountInfo({
      delegations: [
        {
          pendingRewards: new BigNumber(1),
        },
        {
          pendingRewards: new BigNumber(2),
        },
      ],
    });
    const account = await getAccountShape(infoMock, syncConfig);
    expect((account as CosmosAccount).cosmosResources.pendingRewardsBalance).toEqual(
      new BigNumber(3),
    );
  });

  it("set spendable balance to 0 if spendable balance is negative in initial account", async () => {
    mockAccountInfo({});
    const account = await getAccountShape(
      {
        ...infoMock,
        initialAccount: {
          spendableBalance: new BigNumber(-10),
        } as CosmosAccount,
      },
      syncConfig,
    );
    expect(account.spendableBalance).toEqual(new BigNumber(0));
  });

  it("should estimate operations count correctly", async () => {
    mockAccountInfo({});
    const account = await getAccountShape(
      {
        ...infoMock,
        initialAccount: {
          operations: [{}, {}],
        } as CosmosAccount,
      },
      syncConfig,
    );
    expect(account.operationsCount).toEqual(2);
  });

  it("should merge old operations with newly fetched ones", async () => {
    const existingOperations = [{ hash: "3", id: "3" }];
    mockAccountInfo({});
    await getAccountShape(
      {
        ...infoMock,
        initialAccount: {
          operations: existingOperations,
        } as CosmosAccount,
      },
      syncConfig,
    );
    expect(mergeOpsSpy.mock.calls[0][0]).toEqual(existingOperations);
  });

  it("should add newly fetched operations", async () => {
    mockAccountInfo({ txs: [mockCosmosTx({})] });
    await getAccountShape(infoMock, syncConfig);
    expect(mergeOpsSpy.mock.calls[0][1]).toBeTruthy();
  });

  it("should get the memo correctly", async () => {
    mockAccountInfo({ txs: [mockCosmosTx({})] });
    const account = await getAccountShape(infoMock, syncConfig);
    expect((account.operations as CosmosOperation[])[0].extra.memo).toEqual("Ledger Live");
  });

  it("should list claim reward operations correctly with one delegation", async () => {
    mockAccountInfo({
      txs: [
        mockCosmosTx({
          events: [
            {
              type: "withdraw_rewards",
              attributes: [
                {
                  key: "amount",
                  value: "3uatom",
                },
                {
                  key: "validator",
                  value: "validatorAddressNumeroUno",
                },
              ],
            },
          ],
          logs: [],
          tx: {
            "@type": "/cosmos.tx.v1beta1.Tx",
            body: {
              messages: [
                {
                  "@type": "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
                  delegator_address: "address",
                  validator_address: "cosmosvaloper1crqm3598z6qmyn2kkcl9dz7uqs4qdqnr6s8jdn",
                },
              ],
              memo: "Ledger Live",
              timeout_height: "0",
              extension_options: [],
              non_critical_extension_options: [],
            },
            auth_info: {
              signer_infos: [{ sequence: "seq" }],
              fee: { amount: [{ denom: "uatom", amount: new BigNumber(0) }] },
            },
            signatures: [],
          },
        } as Partial<CosmosTx>),
      ],
    });

    const account = await getAccountShape(infoMock, syncConfig);
    expect((account.operations as CosmosOperation[])[0].value).toEqual(new BigNumber(3));
    expect((account.operations as CosmosOperation[])[0].extra.validators).toEqual([
      {
        address: "validatorAddressNumeroUno",
        amount: new BigNumber(3),
      },
    ]);
  });

  it("should list claim reward operations correctly with multiple delegations", async () => {
    mockAccountInfo({
      txs: [
        mockCosmosTx({
          events: [
            {
              type: "withdraw_rewards",
              attributes: [
                {
                  key: "amount",
                  value: "10uatom",
                },
                {
                  key: "validator",
                  value: "validatorAddressHehe",
                },
              ],
            },
            {
              type: "withdraw_rewards",
              attributes: [
                {
                  key: "amount",
                  value: "5uatom",
                },
                {
                  key: "validator",
                  value: "validatorAddressTwo",
                },
              ],
            },
            {
              type: "withdraw_rewards",
              attributes: [
                {
                  key: "amount",
                  value:
                    "56ibc/0025F8A87464A471E66B234C4F93AEC5B4DA3D42D7986451A059273426290DD5,512ibc/6B8A3F5C2AD51CD6171FA41A7E8C35AD594AB69226438DB94450436EA57B3A89,7uatom",
                },
                {
                  key: "validator",
                  value: "validatorAddressThree",
                },
              ],
            },
          ],
          tx: {
            "@type": "/cosmos.tx.v1beta1.Tx",
            body: {
              messages: [
                {
                  "@type": "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
                  delegator_address: "address",
                  validator_address: "validatorAddressHehe",
                },
                {
                  "@type": "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
                  delegator_address: "address",
                  validator_address: "validatorAddressTwo",
                },
                {
                  "@type": "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
                  delegator_address: "address",
                  validator_address: "validatorAddressThree",
                },
              ],
              memo: "Ledger Live",
              timeout_height: "0",
              extension_options: [],
              non_critical_extension_options: [],
            },
            auth_info: {
              signer_infos: [{ sequence: "seq" }],
              fee: { amount: [{ denom: "uatom", amount: new BigNumber(0) }] },
            },
            signatures: [],
          },
        } as Partial<CosmosTx>),
      ],
    });

    const account = await getAccountShape(infoMock, syncConfig);
    expect((account.operations as CosmosOperation[])[0].value).toEqual(new BigNumber(22));
    expect((account.operations as CosmosOperation[])[0].extra.validators).toEqual([
      {
        address: "validatorAddressHehe",
        amount: new BigNumber(10),
      },
      {
        address: "validatorAddressTwo",
        amount: new BigNumber(5),
      },
      {
        address: "validatorAddressThree",
        amount: new BigNumber(7),
      },
    ]);
  });

  it("should parse an operation correctly when the operation failed)", async () => {
    const failedOperation = mockCosmosTx({
      tx: {
        "@type": "/cosmos.tx.v1beta1.Tx",
        body: {
          messages: [
            {
              "@type": "/cosmos.bank.v1beta1.MsgSend",
              from_address: "address",
              to_address: "cosmos1lptvx486j7630632q3ah0dwq20ghdrpxgl8xzg",
              amount: [
                {
                  denom: "uatom",
                  amount: "10000",
                },
              ],
            },
          ],
          memo: "",
          timeout_height: "0",
          extension_options: [],
          non_critical_extension_options: [],
        },
        auth_info: baseTxMock.tx.auth_info,
      },
      code: 11,
    } as Partial<CosmosTx>);

    mockAccountInfo({
      txs: [failedOperation],
    });

    const account = await getAccountShape(infoMock, syncConfig);
    expect((account.operations as CosmosOperation[])[0].value).toEqual(new BigNumber(10001)); // 10000(amount) + 1(fees)
    expect((account.operations as CosmosOperation[])[0].type).toEqual("OUT");
    expect((account.operations as CosmosOperation[])[0].hasFailed).toEqual(true);
  });

  it("should parse an operation correctly with multiple transfers(received operations)", async () => {
    mockAccountInfo({
      txs: [
        mockCosmosTx({
          tx: {
            "@type": "/cosmos.tx.v1beta1.Tx",
            body: {
              messages: [
                {
                  "@type": "/cosmos.bank.v1beta1.MsgSend",
                  from_address: "cosmos1lptvx486j7630632q3ah0dwq20ghdrpxgl8xzg",
                  to_address: "address",
                  amount: [
                    {
                      denom: "uatom",
                      amount: "5",
                    },
                  ],
                },
                {
                  "@type": "/cosmos.bank.v1beta1.MsgSend",
                  from_address: "cosmos1lptvx486j7630632q3ah0dwq20ghdrpxgl8xzg",
                  to_address: "address",
                  amount: [
                    {
                      denom: "uatom",
                      amount: "6",
                    },
                  ],
                },
              ],
              memo: "",
              timeout_height: "0",
              extension_options: [],
              non_critical_extension_options: [],
            },
            auth_info: baseTxMock.tx.auth_info,
          },
        } as Partial<CosmosTx>),
      ],
    });

    const account = await getAccountShape(infoMock, syncConfig);
    expect((account.operations as CosmosOperation[])[0].value).toEqual(new BigNumber(11)); // 5 + 6
    expect((account.operations as CosmosOperation[])[0].type).toEqual("IN");
  });

  it("should parse an operation correctly with multiple transfers(sent operations)", async () => {
    mockAccountInfo({
      txs: [
        mockCosmosTx({
          tx: {
            "@type": "/cosmos.tx.v1beta1.Tx",
            body: {
              messages: [
                {
                  "@type": "/cosmos.bank.v1beta1.MsgSend",
                  from_address: "address",
                  to_address: "cosmos1lptvx486j7630632q3ah0dwq20ghdrpxgl8xzg",
                  amount: [
                    {
                      denom: "uatom",
                      amount: "5",
                    },
                  ],
                },
                {
                  "@type": "/cosmos.bank.v1beta1.MsgSend",
                  from_address: "address",
                  to_address: "cosmos1lptvx486j7630632q3ah0dwq20ghdrpxgl8xzg",
                  amount: [
                    {
                      denom: "uatom",
                      amount: "6",
                    },
                  ],
                },
              ],
              memo: "",
              timeout_height: "0",
              extension_options: [],
              non_critical_extension_options: [],
            },
            auth_info: baseTxMock.tx.auth_info,
          },
        } as Partial<CosmosTx>),
      ],
    });

    const account = await getAccountShape(infoMock, syncConfig);
    expect((account.operations as CosmosOperation[])[0].value).toEqual(new BigNumber(12)); // 5 + 6 + 1(fees)
    expect((account.operations as CosmosOperation[])[0].type).toEqual("OUT");
  });

  it("should parse an operation correctly with multiple delegations", async () => {
    mockAccountInfo({
      txs: [
        mockCosmosTx({
          tx: {
            body: {
              memo: "memo",
              messages: [
                {
                  "@type": "/cosmos.staking.v1beta1.MsgDelegate",
                  delegator_address: "address",
                  validator_address: "address1",
                  amount: {
                    denom: "uatom",
                    amount: "5",
                  },
                },
                {
                  "@type": "/cosmos.staking.v1beta1.MsgDelegate",
                  delegator_address: "address",
                  validator_address: "address2",
                  amount: {
                    denom: "uatom",
                    amount: "6",
                  },
                },
              ],
            },
            auth_info: baseTxMock.tx.auth_info,
          },
        } as Partial<CosmosTx>),
      ],
    });
    const account = await getAccountShape(infoMock, syncConfig);
    expect((account.operations as CosmosOperation[])[0].value).toEqual(new BigNumber(1)); // fees
    expect((account.operations as CosmosOperation[])[0].type).toEqual("DELEGATE");
    expect((account.operations as CosmosOperation[])[0].extra.validators).toEqual([
      {
        address: "address1",
        amount: new BigNumber(5),
      },
      {
        address: "address2",
        amount: new BigNumber(6),
      },
    ]);
  });

  it("should parse an operation correctly with multiple redelegate", async () => {
    mockAccountInfo({
      txs: [
        mockCosmosTx({
          tx: {
            body: {
              memo: "memo",
              messages: [
                {
                  "@type": "/cosmos.staking.v1beta1.MsgBeginRedelegate",
                  delegator_address: "address",
                  validator_src_address: "address_src",
                  validator_dst_address: "address1",
                  amount: {
                    denom: "uatom",
                    amount: "5",
                  },
                },
                {
                  "@type": "/cosmos.staking.v1beta1.MsgBeginRedelegate",
                  delegator_address: "address",
                  validator_src_address: "address_src",
                  validator_dst_address: "address2",
                  amount: {
                    denom: "uatom",
                    amount: "6",
                  },
                },
              ],
            },
            auth_info: baseTxMock.tx.auth_info,
          },
        } as Partial<CosmosTx>),
      ],
    });
    const account = await getAccountShape(infoMock, syncConfig);
    expect((account.operations as CosmosOperation[])[0].value).toEqual(new BigNumber(1)); // fees
    expect((account.operations as CosmosOperation[])[0].type).toEqual("REDELEGATE");
    expect((account.operations as CosmosOperation[])[0].extra.sourceValidator).toEqual(
      "address_src",
    );
    expect((account.operations as CosmosOperation[])[0].extra.validators).toEqual([
      {
        address: "address1",
        amount: new BigNumber(5),
      },
      {
        address: "address2",
        amount: new BigNumber(6),
      },
    ]);
  });

  it("should parse an operation correctly with multiple unredelegate", async () => {
    mockAccountInfo({
      txs: [
        mockCosmosTx({
          tx: {
            body: {
              memo: "memo",
              messages: [
                {
                  "@type": "/cosmos.staking.v1beta1.MsgUndelegate",
                  delegator_address: "address",
                  validator_address: "address1",
                  amount: {
                    denom: "uatom",
                    amount: "5",
                  },
                },
                {
                  "@type": "/cosmos.staking.v1beta1.MsgUndelegate",
                  delegator_address: "address",
                  validator_address: "address2",
                  amount: {
                    denom: "uatom",
                    amount: "6",
                  },
                },
              ],
            },
            auth_info: baseTxMock.tx.auth_info,
          },
        } as Partial<CosmosTx>),
      ],
    });
    const account = await getAccountShape(infoMock, syncConfig);
    expect((account.operations as CosmosOperation[])[0].value).toEqual(new BigNumber(1)); // fees
    expect((account.operations as CosmosOperation[])[0].type).toEqual("UNDELEGATE");
    expect((account.operations as CosmosOperation[])[0].extra.validators).toEqual([
      {
        address: "address1",
        amount: new BigNumber(5),
      },
      {
        address: "address2",
        amount: new BigNumber(6),
      },
    ]);
  });

  it("should parse an operation correctly with missing auth_info", async () => {
    mockAccountInfo({
      txs: [
        mockCosmosTx({
          tx: {
            body: {
              memo: "memo",
              messages: [
                {
                  "@type": "/cosmos.bank.v1beta1.MsgSend",
                  from_address: "address",
                  to_address: "cosmos1lptvx486j7630632q3ah0dwq20ghdrpxgl8xzg",
                  amount: [
                    {
                      denom: "uatom",
                      amount: "5",
                    },
                  ],
                },
              ],
            },
          },
        } as Partial<CosmosTx>),
      ],
    });
    const account = await getAccountShape(infoMock, syncConfig);
    expect((account.operations as CosmosOperation[])[0].value).toBeDefined();
  });
});
