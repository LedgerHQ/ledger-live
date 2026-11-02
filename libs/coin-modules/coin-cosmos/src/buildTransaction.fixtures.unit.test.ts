import { BigNumber } from "bignumber.js";
import { buildTransaction, CosmosTransactionParams, txToMessages } from "./buildTransaction";
import Babylon from "./chain/Babylon";
import Cosmos from "./chain/Cosmos";
import CosmosBase from "./chain/cosmosBase";
import { combine } from "./logic/transaction/combine";

const toHex = (bytes: Uint8Array): string => Buffer.from(bytes).toString("hex");

const cosmosParams = {
  senderAddress: "cosmos1zkcn8ec4fpvy4wwzxm86f9g8rv6zm2w4qmzr9j",
  currencyId: "cosmos",
  denom: "uatom",
  recipient: "cosmos1yvuhqg3rkqrw4xjhgxrc4w0jvhcqa3h5m4xq0u",
  amount: new BigNumber("3333300000000000000000"),
  memo: "",
  validators: [
    {
      address: "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm",
      amount: new BigNumber(1234567),
    },
  ],
  sourceValidator: "cosmosvaloper1sjllsnramtg3ewxqwwrwjxfgc4n4ef9u2lcnj0",
};

const babylonParams = {
  ...cosmosParams,
  senderAddress: "bbn1uwpws077a0a9pclapv3f2fyj5u0mlh6ewmds8n",
  currencyId: "babylon",
  denom: "ubbn",
  recipient: "bbn12v96axyv2cj28hp468haw2rzg8a35lj758yvkx",
  validators: [
    {
      address: "bbnvaloper1004qg6w9zr3mc7yhd0ms9ar7l5x4tt00llac4t",
      amount: new BigNumber(399180),
    },
  ],
  sourceValidator: "bbnvaloper1u9w7kfngrsr2defextqf5fscypw8dys50pdza4",
};

const cases: Array<[string, CosmosBase, CosmosTransactionParams]> = [
  ["cosmos send", new Cosmos(), { ...cosmosParams, mode: "send" }],
  ["cosmos delegate", new Cosmos(), { ...cosmosParams, mode: "delegate" }],
  ["cosmos undelegate", new Cosmos(), { ...cosmosParams, mode: "undelegate" }],
  ["cosmos redelegate", new Cosmos(), { ...cosmosParams, mode: "redelegate" }],
  ["cosmos claimReward", new Cosmos(), { ...cosmosParams, mode: "claimReward" }],
  ["cosmos claimRewardCompound", new Cosmos(), { ...cosmosParams, mode: "claimRewardCompound" }],
  ["babylon send", new Babylon(), { ...babylonParams, mode: "send" }],
  ["babylon delegate", new Babylon(), { ...babylonParams, mode: "delegate" }],
  ["babylon undelegate", new Babylon(), { ...babylonParams, mode: "undelegate" }],
  ["babylon redelegate", new Babylon(), { ...babylonParams, mode: "redelegate" }],
  ["babylon claimReward", new Babylon(), { ...babylonParams, mode: "claimReward" }],
];

const signature = Uint8Array.from(Buffer.from("11".repeat(32) + "22".repeat(32), "hex"));
const pubKey = "An8LLu9QjqdCpcVa3Dw6HGzeR5IcBlIZ4Im/3FcypWW0";

// Captured from the protobufjs@6-based encoders (@keplr-wallet/proto-types, cosmjs-types@0.2.1):
// any byte drift here changes what the device signs or what the chain receives.
const MESSAGE_FIXTURES: Record<
  string,
  { aminoMsgs: unknown[]; protoMsgs: { typeUrl: string; value: string }[] }
> = {
  "cosmos send": {
    aminoMsgs: [
      {
        type: "cosmos-sdk/MsgSend",
        value: {
          from_address: "cosmos1zkcn8ec4fpvy4wwzxm86f9g8rv6zm2w4qmzr9j",
          to_address: "cosmos1yvuhqg3rkqrw4xjhgxrc4w0jvhcqa3h5m4xq0u",
          amount: [
            {
              denom: "uatom",
              amount: "3333300000000000000000",
            },
          ],
        },
      },
    ],
    protoMsgs: [
      {
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value:
          "0a2d636f736d6f73317a6b636e38656334667076793477777a786d3836663967387276367a6d327734716d7a72396a122d636f736d6f733179767568716733726b71727734786a68677872633477306a76686371613368356d34787130751a1f0a057561746f6d121633333333333030303030303030303030303030303030",
      },
    ],
  },
  "cosmos delegate": {
    aminoMsgs: [
      {
        type: "cosmos-sdk/MsgDelegate",
        value: {
          delegator_address: "cosmos1zkcn8ec4fpvy4wwzxm86f9g8rv6zm2w4qmzr9j",
          validator_address: "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm",
          amount: {
            denom: "uatom",
            amount: "3333300000000000000000",
          },
        },
      },
    ],
    protoMsgs: [
      {
        typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
        value:
          "0a2d636f736d6f73317a6b636e38656334667076793477777a786d3836663967387276367a6d327734716d7a72396a1234636f736d6f7376616c6f7065723130776c6a78706c3033303533683936393061706d7965616b6c7933796c68656a72756376746d1a1f0a057561746f6d121633333333333030303030303030303030303030303030",
      },
    ],
  },
  "cosmos undelegate": {
    aminoMsgs: [
      {
        type: "cosmos-sdk/MsgUndelegate",
        value: {
          delegator_address: "cosmos1zkcn8ec4fpvy4wwzxm86f9g8rv6zm2w4qmzr9j",
          validator_address: "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm",
          amount: {
            denom: "uatom",
            amount: "1234567",
          },
        },
      },
    ],
    protoMsgs: [
      {
        typeUrl: "/cosmos.staking.v1beta1.MsgUndelegate",
        value:
          "0a2d636f736d6f73317a6b636e38656334667076793477777a786d3836663967387276367a6d327734716d7a72396a1234636f736d6f7376616c6f7065723130776c6a78706c3033303533683936393061706d7965616b6c7933796c68656a72756376746d1a100a057561746f6d120731323334353637",
      },
    ],
  },
  "cosmos redelegate": {
    aminoMsgs: [
      {
        type: "cosmos-sdk/MsgBeginRedelegate",
        value: {
          delegator_address: "cosmos1zkcn8ec4fpvy4wwzxm86f9g8rv6zm2w4qmzr9j",
          validator_src_address: "cosmosvaloper1sjllsnramtg3ewxqwwrwjxfgc4n4ef9u2lcnj0",
          validator_dst_address: "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm",
          amount: {
            denom: "uatom",
            amount: "1234567",
          },
        },
      },
    ],
    protoMsgs: [
      {
        typeUrl: "/cosmos.staking.v1beta1.MsgBeginRedelegate",
        value:
          "0a2d636f736d6f73317a6b636e38656334667076793477777a786d3836663967387276367a6d327734716d7a72396a1234636f736d6f7376616c6f70657231736a6c6c736e72616d74673365777871777772776a78666763346e3465663975326c636e6a301a34636f736d6f7376616c6f7065723130776c6a78706c3033303533683936393061706d7965616b6c7933796c68656a72756376746d22100a057561746f6d120731323334353637",
      },
    ],
  },
  "cosmos claimReward": {
    aminoMsgs: [
      {
        type: "cosmos-sdk/MsgWithdrawDelegationReward",
        value: {
          delegator_address: "cosmos1zkcn8ec4fpvy4wwzxm86f9g8rv6zm2w4qmzr9j",
          validator_address: "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm",
        },
      },
    ],
    protoMsgs: [
      {
        typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
        value:
          "0a2d636f736d6f73317a6b636e38656334667076793477777a786d3836663967387276367a6d327734716d7a72396a1234636f736d6f7376616c6f7065723130776c6a78706c3033303533683936393061706d7965616b6c7933796c68656a72756376746d",
      },
    ],
  },
  "cosmos claimRewardCompound": {
    aminoMsgs: [
      {
        type: "cosmos-sdk/MsgWithdrawDelegationReward",
        value: {
          delegator_address: "cosmos1zkcn8ec4fpvy4wwzxm86f9g8rv6zm2w4qmzr9j",
          validator_address: "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm",
        },
      },
      {
        type: "cosmos-sdk/MsgDelegate",
        value: {
          delegator_address: "cosmos1zkcn8ec4fpvy4wwzxm86f9g8rv6zm2w4qmzr9j",
          validator_address: "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm",
          amount: {
            denom: "uatom",
            amount: "1234567",
          },
        },
      },
    ],
    protoMsgs: [
      {
        typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
        value:
          "0a2d636f736d6f73317a6b636e38656334667076793477777a786d3836663967387276367a6d327734716d7a72396a1234636f736d6f7376616c6f7065723130776c6a78706c3033303533683936393061706d7965616b6c7933796c68656a72756376746d",
      },
      {
        typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
        value:
          "0a2d636f736d6f73317a6b636e38656334667076793477777a786d3836663967387276367a6d327734716d7a72396a1234636f736d6f7376616c6f7065723130776c6a78706c3033303533683936393061706d7965616b6c7933796c68656a72756376746d1a100a057561746f6d120731323334353637",
      },
    ],
  },
  "babylon send": {
    aminoMsgs: [
      {
        type: "cosmos-sdk/MsgSend",
        value: {
          from_address: "bbn1uwpws077a0a9pclapv3f2fyj5u0mlh6ewmds8n",
          to_address: "bbn12v96axyv2cj28hp468haw2rzg8a35lj758yvkx",
          amount: [
            {
              denom: "ubbn",
              amount: "3333300000000000000000",
            },
          ],
        },
      },
    ],
    protoMsgs: [
      {
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value:
          "0a2a62626e3175777077733037376130613970636c61707633663266796a3575306d6c683665776d6473386e122a62626e31327639366178797632636a3238687034363868617732727a67386133356c6a37353879766b781a1e0a047562626e121633333333333030303030303030303030303030303030",
      },
    ],
  },
  "babylon delegate": {
    aminoMsgs: [
      {
        type: "/babylon.epoching.v1.MsgWrappedDelegate",
        value: {
          msg: {
            delegator_address: "bbn1uwpws077a0a9pclapv3f2fyj5u0mlh6ewmds8n",
            validator_address: "bbnvaloper1004qg6w9zr3mc7yhd0ms9ar7l5x4tt00llac4t",
            amount: {
              denom: "ubbn",
              amount: "3333300000000000000000",
            },
          },
        },
      },
    ],
    protoMsgs: [
      {
        typeUrl: "/babylon.epoching.v1.MsgWrappedDelegate",
        value:
          "0a7f0a2a62626e3175777077733037376130613970636c61707633663266796a3575306d6c683665776d6473386e123162626e76616c6f7065723130303471673677397a72336d6337796864306d73396172376c357834747430306c6c616334741a1e0a047562626e121633333333333030303030303030303030303030303030",
      },
    ],
  },
  "babylon undelegate": {
    aminoMsgs: [
      {
        type: "/babylon.epoching.v1.MsgWrappedUndelegate",
        value: {
          msg: {
            delegator_address: "bbn1uwpws077a0a9pclapv3f2fyj5u0mlh6ewmds8n",
            validator_address: "bbnvaloper1004qg6w9zr3mc7yhd0ms9ar7l5x4tt00llac4t",
            amount: {
              denom: "ubbn",
              amount: "399180",
            },
          },
        },
      },
    ],
    protoMsgs: [
      {
        typeUrl: "/babylon.epoching.v1.MsgWrappedUndelegate",
        value:
          "0a6f0a2a62626e3175777077733037376130613970636c61707633663266796a3575306d6c683665776d6473386e123162626e76616c6f7065723130303471673677397a72336d6337796864306d73396172376c357834747430306c6c616334741a0e0a047562626e1206333939313830",
      },
    ],
  },
  "babylon redelegate": {
    aminoMsgs: [
      {
        type: "/babylon.epoching.v1.MsgWrappedBeginRedelegate",
        value: {
          msg: {
            delegator_address: "bbn1uwpws077a0a9pclapv3f2fyj5u0mlh6ewmds8n",
            validator_src_address: "bbnvaloper1u9w7kfngrsr2defextqf5fscypw8dys50pdza4",
            validator_dst_address: "bbnvaloper1004qg6w9zr3mc7yhd0ms9ar7l5x4tt00llac4t",
            amount: {
              denom: "ubbn",
              amount: "399180",
            },
          },
        },
      },
    ],
    protoMsgs: [
      {
        typeUrl: "/babylon.epoching.v1.MsgWrappedBeginRedelegate",
        value:
          "0aa2010a2a62626e3175777077733037376130613970636c61707633663266796a3575306d6c683665776d6473386e123162626e76616c6f70657231753977376b666e677273723264656665787471663566736379707738647973353070647a61341a3162626e76616c6f7065723130303471673677397a72336d6337796864306d73396172376c357834747430306c6c61633474220e0a047562626e1206333939313830",
      },
    ],
  },
  "babylon claimReward": {
    aminoMsgs: [
      {
        type: "cosmos-sdk/MsgWithdrawDelegationReward",
        value: {
          delegator_address: "bbn1uwpws077a0a9pclapv3f2fyj5u0mlh6ewmds8n",
          validator_address: "bbnvaloper1004qg6w9zr3mc7yhd0ms9ar7l5x4tt00llac4t",
        },
      },
    ],
    protoMsgs: [
      {
        typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
        value:
          "0a2a62626e3175777077733037376130613970636c61707633663266796a3575306d6c683665776d6473386e123162626e76616c6f7065723130303471673677397a72336d6337796864306d73396172376c357834747430306c6c61633474",
      },
    ],
  },
};

describe("txToMessages wire fixtures", () => {
  it.each(cases)("%s", (name, chain, params) => {
    const { aminoMsgs, protoMsgs } = txToMessages(params, chain);
    expect({
      aminoMsgs,
      protoMsgs: protoMsgs.map(m => ({ typeUrl: m.typeUrl, value: toHex(m.value) })),
    }).toEqual(MESSAGE_FIXTURES[name]);
  });
});

const BABYLON_TX_FIXTURE =
  "0ab0010aad010a272f626162796c6f6e2e65706f6368696e672e76312e4d73675772617070656444656c65676174651281010a7f0a2a62626e3175777077733037376130613970636c61707633663266796a3575306d6c683665776d6473386e123162626e76616c6f7065723130303471673677397a72336d6337796864306d73396172376c357834747430306c6c616334741a1e0a047562626e12163333333333303030303030303030303030303030303012640a4e0a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21027f0b2eef508ea742a5c55adc3c3a1c6cde47921c065219e089bfdc5732a565b412040a02087f12120a0c0a047562626e1204323035371084f7111a4011111111111111111111111111111111111111111111111111111111111111112222222222222222222222222222222222222222222222222222222222222222";

describe("buildTransaction wire fixtures", () => {
  const { protoMsgs: cosmosDelegate } = txToMessages(
    { ...cosmosParams, mode: "delegate" },
    new Cosmos(),
  );
  const { protoMsgs: babylonDelegate } = txToMessages(
    { ...babylonParams, mode: "delegate" },
    new Babylon(),
  );

  it("encodes a TxRaw with memo, several fee coins and uint64 gas/sequence beyond 32 bits", () => {
    const bytes = buildTransaction({
      protoMsgs: cosmosDelegate,
      memo: "Ledger Live",
      pubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      pubKey,
      feeAmount: [
        { denom: "uatom", amount: "5000" },
        {
          denom: "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2",
          amount: "1",
        },
      ],
      gasLimit: "123456789012",
      sequence: "9876543210",
      signature,
    });
    expect(toHex(bytes)).toEqual(
      "0abe010aae010a232f636f736d6f732e7374616b696e672e763162657461312e4d736744656c65676174651286010a2d636f736d6f73317a6b636e38656334667076793477777a786d3836663967387276367a6d327734716d7a72396a1234636f736d6f7376616c6f7065723130776c6a78706c3033303533683936393061706d7965616b6c7933796c68656a72756376746d1a1f0a057561746f6d121633333333333030303030303030303030303030303030120b4c6564676572204c69766512b9010a540a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21027f0b2eef508ea742a5c55adc3c3a1c6cde47921c065219e089bfdc5732a565b412040a02087f18eaadc0e52412610a0d0a057561746f6d1204353030300a490a446962632f323733393446423039324432454343443536313233433734463336453443314639323630303143454144413943413937454136323242323546343145354542321201311094b4e4f4cb031a4011111111111111111111111111111111111111111111111111111111111111112222222222222222222222222222222222222222222222222222222222222222",
    );
  });

  it("encodes a babylon wrapped-delegate TxRaw with a zero sequence", () => {
    const bytes = buildTransaction({
      protoMsgs: babylonDelegate,
      memo: "",
      pubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      pubKey,
      feeAmount: [{ denom: "ubbn", amount: "2057" }],
      gasLimit: "293764",
      sequence: 0,
      signature,
    });
    expect(toHex(bytes)).toEqual(BABYLON_TX_FIXTURE);
  });

  it.each([NaN, "abc"])("encodes a malformed sequence %p as 0 rather than throwing", sequence => {
    const bytes = buildTransaction({
      protoMsgs: babylonDelegate,
      memo: "",
      pubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      pubKey,
      feeAmount: [{ denom: "ubbn", amount: "2057" }],
      gasLimit: "293764",
      sequence,
      signature,
    });
    expect(toHex(bytes)).toEqual(BABYLON_TX_FIXTURE);
  });

  it("encodes an empty TxRaw with no fee, no gas and an empty signature", () => {
    const bytes = buildTransaction({
      protoMsgs: [],
      memo: "",
      pubKeyType: "/injective.crypto.v1beta1.ethsecp256k1.PubKey",
      pubKey,
      feeAmount: undefined,
      gasLimit: undefined,
      sequence: 1,
      signature: new Uint8Array(),
    });
    expect(toHex(bytes)).toEqual(
      "12620a5e0a540a2d2f696e6a6563746976652e63727970746f2e763162657461312e657468736563703235366b312e5075624b657912230a21027f0b2eef508ea742a5c55adc3c3a1c6cde47921c065219e089bfdc5732a565b412040a02087f180112001a00",
    );
  });

  it("combine produces the same TxRaw bytes from a crafted transaction", () => {
    const crafted = {
      protoMsgs: cosmosDelegate.map(m => ({
        typeUrl: m.typeUrl,
        value: Buffer.from(m.value).toString("base64"),
      })),
      memo: "memo",
      pubKeyType: "/cosmos.crypto.secp256k1.PubKey",
      feeAmount: [{ denom: "uatom", amount: "500" }],
      gasLimit: "200000",
      sequence: "3",
      accountNumber: "7",
      chainId: "cosmoshub-4",
      signable: "",
    };
    expect(combine(JSON.stringify(crafted), [toHex(signature)], pubKey)).toEqual(
      "0ab7010aae010a232f636f736d6f732e7374616b696e672e763162657461312e4d736744656c65676174651286010a2d636f736d6f73317a6b636e38656334667076793477777a786d3836663967387276367a6d327734716d7a72396a1234636f736d6f7376616c6f7065723130776c6a78706c3033303533683936393061706d7965616b6c7933796c68656a72756376746d1a1f0a057561746f6d12163333333333303030303030303030303030303030303012046d656d6f12660a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21027f0b2eef508ea742a5c55adc3c3a1c6cde47921c065219e089bfdc5732a565b412040a02087f180312120a0c0a057561746f6d120335303010c09a0c1a4011111111111111111111111111111111111111111111111111111111111111112222222222222222222222222222222222222222222222222222222222222222",
    );
  });
});
