import { fromAccountRaw } from "../account";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import { setSupportedCurrencies } from "../currencies";

setSupportedCurrencies(["ethereum", "bitcoin", "litecoin"]);

const accounts: Account[] = [
  {
    id: "libcore:1:bitcoin:xpub6DACJs4ZgE67HEu53j2osRtw51wfJybJ88ccVQnHpmjqr9XJfMYXn6Fxt3u772FonuWfqYUrb9Z9wxe2S9pTzxGDiQZDk1cMPiDH2S5HjYa:native_segwit",
    seedIdentifier:
      "04c34029090f64a127ed5abc5b46a4ac51d14256e121adfe65eade766c3a45d5112e480268ee3f9102d0e839b4656f0c2777a4bbeaf16054d6271f628fc99bd5af",
    name: "BTC 1",
    starred: false,
    derivationMode: "native_segwit",
    index: 0,
    freshAddress: "bc1qdcfdfp2k7zwhsxldurartqg69jj5ukzfytksfc",
    freshAddressPath: "84'/0'/0'/0/30",
    freshAddresses: [],
    blockHeight: 651631,
    creationDate: "2020-06-02T10:26:53.000Z",
    operationsCount: 64,
    operations: [],
    pendingOperations: [],
    currencyId: "bitcoin",
    unitMagnitude: 8,
    lastSyncDate: "2020-10-07T09:56:06.280Z",
    balance: "0",
    spendableBalance: "0",
    xpub: "xpub6DACJs4ZgE67HEu53j2osRtw51wfJybJ88ccVQnHpmjqr9XJfMYXn6Fxt3u772FonuWfqYUrb9Z9wxe2S9pTzxGDiQZDk1cMPiDH2S5HjYa",
    bitcoinResources: {
      utxos: [],
      walletAccount: undefined,
    },
    swapHistory: [
      {
        status: "finished",
        provider: "changelly",
        operationId:
          "libcore:1:bitcoin:xpub6DACJs4ZgE67HEu53j2osRtw51wfJybJ88ccVQnHpmjqr9XJfMYXn6Fxt3u772FonuWfqYUrb9Z9wxe2S9pTzxGDiQZDk1cMPiDH2S5HjYa:native_segwit-9f6388b2f8ebd0aa47e554937e44acd4831a1077d53519f0bd029e832ba36c8c-OUT",
        swapId: "stpivjjg6sz2qceb",
        receiverAccountId:
          "libcore:1:ethereum:xpub6BemYiVNp19a1mxEndPgCEG5MLN7veWbvUtPGwFeTwJ4K8z7uoNkEbHgNujVnisJ7pyVJE3q2Wi1JssEdVcUZeCSVL7ezohp71siJ76SNFQ:",
        tokenId: "ethereum/erc20/augur",
        fromAmount: "500000",
        toAmount: "2329983900000000000",
      },
      {
        status: "finished",
        provider: "changelly",
        operationId:
          "libcore:1:bitcoin:xpub6DACJs4ZgE67HEu53j2osRtw51wfJybJ88ccVQnHpmjqr9XJfMYXn6Fxt3u772FonuWfqYUrb9Z9wxe2S9pTzxGDiQZDk1cMPiDH2S5HjYa:native_segwit-e459f7e81e66c97845371018c13871e4ee05690e95e7382b3a1b87278ff03bc3-OUT",
        swapId: "k9y3murl0pxpq7ao",
        receiverAccountId:
          "libcore:1:ethereum:xpub6BemYiVNp19a1mxEndPgCEG5MLN7veWbvUtPGwFeTwJ4K8z7uoNkEbHgNujVnisJ7pyVJE3q2Wi1JssEdVcUZeCSVL7ezohp71siJ76SNFQ:",
        fromAmount: "718240",
        toAmount: "204654755830374400",
      },
      {
        status: "finished",
        provider: "changelly",
        operationId:
          "libcore:1:bitcoin:xpub6DACJs4ZgE67HEu53j2osRtw51wfJybJ88ccVQnHpmjqr9XJfMYXn6Fxt3u772FonuWfqYUrb9Z9wxe2S9pTzxGDiQZDk1cMPiDH2S5HjYa:native_segwit-384c33d20bb6aca1bf0df41126895f1f65dd3d73d8a46cdf6f31356a58a7a121-OUT",
        swapId: "ox46eckyg7ddjiqh",
        receiverAccountId:
          "libcore:1:litecoin:Ltub2Zx1tbqWB7AbC4fb7aWgsuyXBm2qt97gzG5av4PHAjdAhvdZQFHS7nmcScgtAvpgcGAkVQQvR9BXwu54ny6Yqwst4KQAnyD1Yx6VezNf1S8:segwit",
        fromAmount: "800000",
        toAmount: "166547279.6496",
      },
    ],
  },
  {
    id: "libcore:1:litecoin:Ltub2Zx1tbqWB7AbC4fb7aWgsuyXBm2qt97gzG5av4PHAjdAhvdZQFHS7nmcScgtAvpgcGAkVQQvR9BXwu54ny6Yqwst4KQAnyD1Yx6VezNf1S8:segwit",
    seedIdentifier:
      "04f0e0c596eda440b4110082147d96a316c25c2e6be47fe7325c299038328161c788ba804a297b4761587db7700b6934b1d32e9c7d407303cba816c35e83767366",
    name: "LTC 1",
    starred: false,
    derivationMode: "segwit",
    index: 0,
    freshAddress: "MK1uHHBy3Y88kXnVwSiKZyy3JPhPzmVXwA",
    freshAddressPath: "49'/2'/0'/0/12",
    freshAddresses: [],
    blockHeight: 1925624,
    creationDate: "2020-06-03T13:53:03.000Z",
    operationsCount: 29,
    operations: [],
    pendingOperations: [],
    currencyId: "litecoin",
    unitMagnitude: 8,
    lastSyncDate: "2020-10-07T09:56:06.658Z",
    balance: "0",
    spendableBalance: "0",
    xpub: "Ltub2Zx1tbqWB7AbC4fb7aWgsuyXBm2qt97gzG5av4PHAjdAhvdZQFHS7nmcScgtAvpgcGAkVQQvR9BXwu54ny6Yqwst4KQAnyD1Yx6VezNf1S8",
    bitcoinResources: {
      utxos: [],
      walletAccount: undefined,
    },
    swapHistory: [
      {
        status: "finished",
        provider: "changelly",
        operationId:
          "libcore:1:litecoin:Ltub2Zx1tbqWB7AbC4fb7aWgsuyXBm2qt97gzG5av4PHAjdAhvdZQFHS7nmcScgtAvpgcGAkVQQvR9BXwu54ny6Yqwst4KQAnyD1Yx6VezNf1S8:segwit-6c334585939ebaef5bb3ef7b4235d5389d9f9061db6f9e8c2daced1e8e7154dd-OUT",
        swapId: "rqp4laawa248rb8u",
        receiverAccountId:
          "libcore:1:ethereum:xpub6BemYiVNp19a1mxEndPgCEG5MLN7veWbvUtPGwFeTwJ4K8z7uoNkEbHgNujVnisJ7pyVJE3q2Wi1JssEdVcUZeCSVL7ezohp71siJ76SNFQ:",
        fromAmount: "170000000",
        toAmount: "304630249310000000",
      },
    ],
  },
  {
    id: "libcore:1:ethereum:xpub6BemYiVNp19a1mxEndPgCEG5MLN7veWbvUtPGwFeTwJ4K8z7uoNkEbHgNujVnisJ7pyVJE3q2Wi1JssEdVcUZeCSVL7ezohp71siJ76SNFQ:",
    seedIdentifier:
      "04468680d27b26d4304a3c2aeb2c696d5d3a2d7fea4e28e9d7d296e0ecbc626fa8bd458c4d4db0cbcb36d6e0b51bcedf44653483e40f200c366e86cbb54d579c1c",
    name: "ETH",
    starred: false,
    derivationMode: "",
    index: 0,
    freshAddress: "0x6Fb18BF2400b94C813FeDe3D2e816d5C811353D9",
    freshAddressPath: "44'/60'/0'/0/0",
    freshAddresses: [
      {
        address: "0x6Fb18BF2400b94C813FeDe3D2e816d5C811353D9",
        derivationPath: "44'/60'/0'/0/0",
      },
    ],
    blockHeight: 11007899,
    creationDate: "2020-07-03T15:02:43.000Z",
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    currencyId: "ethereum",
    unitMagnitude: 18,
    lastSyncDate: "2020-10-07T09:56:08.916Z",
    balance: "280255780000000000",
    spendableBalance: "280255780000000000",
    balanceHistory: {},
    xpub: "xpub6BemYiVNp19a1mxEndPgCEG5MLN7veWbvUtPGwFeTwJ4K8z7uoNkEbHgNujVnisJ7pyVJE3q2Wi1JssEdVcUZeCSVL7ezohp71siJ76SNFQ",
    subAccounts: [
      {
        type: "TokenAccountRaw",
        id: "libcore:1:ethereum:xpub6BemYiVNp19a1mxEndPgCEG5MLN7veWbvUtPGwFeTwJ4K8z7uoNkEbHgNujVnisJ7pyVJE3q2Wi1JssEdVcUZeCSVL7ezohp71siJ76SNFQ:+0xdAC17F958D2ee523a2206206994597C13D831ec7",
        parentId:
          "libcore:1:ethereum:xpub6BemYiVNp19a1mxEndPgCEG5MLN7veWbvUtPGwFeTwJ4K8z7uoNkEbHgNujVnisJ7pyVJE3q2Wi1JssEdVcUZeCSVL7ezohp71siJ76SNFQ:",
        starred: false,
        tokenId: "ethereum/erc20/usd_tether__erc20_",
        balance: "0",
        balanceHistory: {},
        creationDate: "2020-09-15T11:18:22.000Z",
        operationsCount: 15,
        operations: [],
        pendingOperations: [],
        swapHistory: [
          {
            status: "finished",
            provider: "changelly",
            operationId:
              "libcore:1:ethereum:xpub6BemYiVNp19a1mxEndPgCEG5MLN7veWbvUtPGwFeTwJ4K8z7uoNkEbHgNujVnisJ7pyVJE3q2Wi1JssEdVcUZeCSVL7ezohp71siJ76SNFQ:+0xdAC17F958D2ee523a2206206994597C13D831ec7-0x3e044ee188d1b8a43d293fbc7faba1619f0b55e1180d4848547573c3b26d4140-OUT",
            swapId: "8qk2zvsg5fsz69ma",
            receiverAccountId:
              "libcore:1:ethereum:xpub6BemYiVNp19a1mxEndPgCEG5MLN7veWbvUtPGwFeTwJ4K8z7uoNkEbHgNujVnisJ7pyVJE3q2Wi1JssEdVcUZeCSVL7ezohp71siJ76SNFQ:",
            fromAmount: "120961160",
            toAmount: "310338883496932000",
          },
          {
            status: "finished",
            provider: "changelly",
            operationId:
              "libcore:1:ethereum:xpub6BemYiVNp19a1mxEndPgCEG5MLN7veWbvUtPGwFeTwJ4K8z7uoNkEbHgNujVnisJ7pyVJE3q2Wi1JssEdVcUZeCSVL7ezohp71siJ76SNFQ:+0xdAC17F958D2ee523a2206206994597C13D831ec7-0x4b520ea9fb040761ff4f12da7945757e6130c954f29b5c4e994c068be6d3d56e-OUT",
            swapId: "x563tt1pjvyezkq1",
            receiverAccountId:
              "libcore:1:bitcoin:xpub6DACJs4ZgE67MoaVKEveVNW5XkSgS9BMDsFLcjcWmdRC3DThwyPrpVuGomZYa6gk7SxuFMzEeNE6dAwzPmozzdNJuXDzNNhVjfppFLwwDgM:native_segwit",
            fromAmount: "53820289",
            toAmount: "497175.6836953",
          },
        ],
      },
      {
        type: "TokenAccountRaw",
        id: "libcore:1:ethereum:xpub6BemYiVNp19a1mxEndPgCEG5MLN7veWbvUtPGwFeTwJ4K8z7uoNkEbHgNujVnisJ7pyVJE3q2Wi1JssEdVcUZeCSVL7ezohp71siJ76SNFQ:+imaginary",
        parentId:
          "libcore:1:ethereum:xpub6BemYiVNp19a1mxEndPgCEG5MLN7veWbvUtPGwFeTwJ4K8z7uoNkEbHgNujVnisJ7pyVJE3q2Wi1JssEdVcUZeCSVL7ezohp71siJ76SNFQ:",
        starred: false,
        tokenId: "ethereum/erc20/_imaginary_token_",
        balance: "0",
        balanceHistory: {},
        creationDate: "2020-09-15T11:18:22.000Z",
        operationsCount: 15,
        operations: [],
        pendingOperations: [],
        swapHistory: [
          {
            status: "finished",
            provider: "changelly",
            operationId:
              "libcore:1:ethereum:xpub6BemYiVNp19a1mxEndPgCEG5MLN7veWbvUtPGwFeTwJ4K8z7uoNkEbHgNujVnisJ7pyVJE3q2Wi1JssEdVcUZeCSVL7ezohp71siJ76SNFQ:+imaginary-0x3e044ee188d1b8a43d293fbc7faba1619f0b55e1180d4848547573c3b26d4140-OUT",
            swapId: "8qk2zvsg5fsz69ma",
            receiverAccountId:
              "libcore:1:ethereum:xpub6BemYiVNp19a1mxEndPgCEG5MLN7veWbvUtPGwFeTwJ4K8z7uoNkEbHgNujVnisJ7pyVJE3q2Wi1JssEdVcUZeCSVL7ezohp71siJ76SNFQ:",
            fromAmount: "120961160",
            toAmount: "310338883496932000",
          },
          {
            status: "finished",
            provider: "changelly",
            operationId:
              "libcore:1:ethereum:xpub6BemYiVNp19a1mxEndPgCEG5MLN7veWbvUtPGwFeTwJ4K8z7uoNkEbHgNujVnisJ7pyVJE3q2Wi1JssEdVcUZeCSVL7ezohp71siJ76SNFQ:+imaginary-0x4b520ea9fb040761ff4f12da7945757e6130c954f29b5c4e994c068be6d3d56e-OUT",
            swapId: "x563tt1pjvyezkq1",
            receiverAccountId:
              "libcore:1:bitcoin:xpub6DACJs4ZgE67MoaVKEveVNW5XkSgS9BMDsFLcjcWmdRC3DThwyPrpVuGomZYa6gk7SxuFMzEeNE6dAwzPmozzdNJuXDzNNhVjfppFLwwDgM:native_segwit",
            fromAmount: "53820289",
            toAmount: "497175.6836953",
          },
        ],
      },
    ],
    swapHistory: [
      {
        status: "finished",
        provider: "changelly",
        operationId:
          "libcore:1:ethereum:xpub6BemYiVNp19a1mxEndPgCEG5MLN7veWbvUtPGwFeTwJ4K8z7uoNkEbHgNujVnisJ7pyVJE3q2Wi1JssEdVcUZeCSVL7ezohp71siJ76SNFQ:-0x87e5e944de0a356fe24db55553494aa6575f800db0cd92e5e047f1aa2c3c7a2e-OUT",
        swapId: "bbzzx4x9wdzbouwu",
        receiverAccountId:
          "libcore:1:bitcoin:xpub6DACJs4ZgE67HEu53j2osRtw51wfJybJ88ccVQnHpmjqr9XJfMYXn6Fxt3u772FonuWfqYUrb9Z9wxe2S9pTzxGDiQZDk1cMPiDH2S5HjYa:native_segwit",
        fromAmount: "200000000000000000",
        toAmount: "675485.872",
      },
      {
        status: "finished",
        provider: "changelly",
        operationId:
          "libcore:1:ethereum:xpub6BemYiVNp19a1mxEndPgCEG5MLN7veWbvUtPGwFeTwJ4K8z7uoNkEbHgNujVnisJ7pyVJE3q2Wi1JssEdVcUZeCSVL7ezohp71siJ76SNFQ:-0xc68b12efabf587b29c7eae2feb7b58b606513d6511752be5b4e66662779caebe-OUT",
        swapId: "yhjfkfzltp66gxa5",
        receiverAccountId:
          "libcore:1:ethereum:xpub6BemYiVNp19a1mxEndPgCEG5MLN7veWbvUtPGwFeTwJ4K8z7uoNkEbHgNujVnisJ7pyVJE3q2Wi1JssEdVcUZeCSVL7ezohp71siJ76SNFQ:",
        tokenId: "ethereum/erc20/usd_tether__erc20_",
        fromAmount: "133000000000000000",
        toAmount: "43820289.74575",
      },
    ],
  },
].map((raw) => fromAccountRaw(raw as AccountRaw));

export default accounts;
