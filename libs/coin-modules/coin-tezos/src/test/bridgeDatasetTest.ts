import { AmountRequired, NotEnoughBalance } from "@ledgerhq/errors";
import type { DatasetTest, DerivationMode } from "@ledgerhq/types-live";
import type { TezosAccountRaw, Transaction } from "../types";

function makeAccountRaw(
  name: string,
  pubkey: string,
  address: string,
  derivationMode: DerivationMode,
): TezosAccountRaw {
  return {
    id: `js:2:tezos:${pubkey}:${derivationMode}`,
    seedIdentifier: address,
    name: "Tezos " + name,
    derivationMode,
    index: 0,
    freshAddress: address,
    freshAddressPath: "",
    blockHeight: 0,
    operations: [],
    pendingOperations: [],
    currencyId: "tezos",
    lastSyncDate: "",
    balance: "0",
    xpub: pubkey,
    subAccounts: [],
    tezosResources: { revealed: true, counter: 0 },
  };
}

export const accountTZrevealedDelegating = makeAccountRaw(
  "TZrevealedDelegating",
  "02389ffd73423626894cb151416e51c72ec285376673daf83545eb5edb45b261ce",
  "tz1boBHAVpwcvKkNFAQHYr7mjxAz1PpVgKq7",
  "tezbox",
);

const accountTZnew = makeAccountRaw(
  "TZnew",
  "02a9ae8b0ff5f9a43565793ad78e10db6f12177d904d208ada591b8a5b9999e3fd",
  "tz1VSichevvJSNkSSntgwKDKikWNB6iqNJii",
  "tezbox",
);

const accountTZnotRevealed = makeAccountRaw(
  "TZnotRevealed",
  "020162dc75ad3c2b6e097d15a1513033c60d8a033f2312ff5a6ead812228d9d653",
  "tz1PWFt4Ym6HedY78MgUP2kVDtSampGwprs5",
  "tezosbip44h",
);

const accountTZRevealedNoDelegate = makeAccountRaw(
  "TZRevealedNoDelegate",
  "029bfe70b3e94ff23623f6c42f6e081a9ca8cc78f74b0d8da58f0d4cdc41c33c1a",
  "tz1YkAjh5mm5gJ5u3VbFLEtpAG7cFo7PfCux",
  "tezosbip44h",
);

export const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    tezos: {
      FIXME_ignoreOperationFields: ["blockHeight"],
      scanAccounts: [
        {
          name: "tezos seed 1",
          unstableAccounts: true,
          // accounts are staking so receive over time. we disable for now snapshot comparison
          apdus: `
            => 800200000d038000002c800006c180000000
            <= 2102ac76ba226118e2d593d09cd7e395546b7540c0e7fb3eb430da59f7982af632969000
            => 8002000015058000002c800006c1800000008000000080000001
            <= 2102b058662fd530e6463d774e3951a40ddd5e430dbeb62673f90caca0cec58735fd9000
            => 8002000011048000002c800006c18000000080000001
            <= 2102670e5e92d06e725b68edda589678fdf0f85a582df06ee634d841cf8042db63839000
            => 8002000015058000002c800006c1800000008000000080000000
            <= 2102f7ed85c519f7d39a664935a410d1a41ca302dfa3eee228e92cbe0dc12aba7a189000
            => 8002000015058000002c800006c1800000018000000080000000
            <= 2102c26d0da1978b7a7596c9853d80d0beac20519c73e76e7f677540db47165d94f39000
            => 8002000015058000002c800006c1800000028000000080000000
            <= 21020058c0efd324fa13d778c4b0995f6fa8d9c85e561c1465d770d4011993f557509000
            => 8002000015058000002c800006c1800000038000000080000000
            <= 21029bfe70b3e94ff23623f6c42f6e081a9ca8cc78f74b0d8da58f0d4cdc41c33c1a9000
            => 8002000015058000002c800006c1800000048000000080000000
            <= 21021d3b9b84feb81d5215cca4f0a016e99fc6cf86d06e864cb4a5098709f16aa2219000
            => 8002000015058000002c800006c1800000058000000080000000
            <= 21020162dc75ad3c2b6e097d15a1513033c60d8a033f2312ff5a6ead812228d9d6539000
            => 8002000015058000002c800006c1800000068000000080000000
            <= 21021831897c4224296519d496d32fdf9e17fb4af680635c5dbbc46cde84fe11dcc99000
            => 8002000011048000002c800006c18000000080000000
            <= 210294e8344ae6df2d3123fa100b5abd40cee339c67838b1c34c4f243cc582f4d2d89000
            => 8002000011048000002c800006c18000000180000000
            <= 2102389ffd73423626894cb151416e51c72ec285376673daf83545eb5edb45b261ce9000
            => 8002000011048000002c800006c18000000280000000
            <= 2102e4c49994c90ffe2e5480826d2f49fb9d0f45280e20bd0a61c488f652d7af0f9c9000
            => 8002000011048000002c800006c18000000380000000
            <= 2102a9ae8b0ff5f9a43565793ad78e10db6f12177d904d208ada591b8a5b9999e3fd9000
            `,
        },
      ],
      accounts: [
        {
          raw: accountTZrevealedDelegating,
          transactions: [
            {
              name: "No amount",
              transaction: t => ({
                ...t,
                recipient: "tz1VSichevvJSNkSSntgwKDKikWNB6iqNJii",
              }),
              expectedStatus: {
                errors: { amount: new AmountRequired() },
                warnings: {},
              },
            },
          ],
        },
        {
          raw: accountTZRevealedNoDelegate,
          transactions: [],
        },
        {
          raw: accountTZnotRevealed,
          transactions: [
            {
              name: "send more than min allowed",
              transaction: (t, account) => ({
                ...t,
                amount: account.balance.minus("100"),
                recipient: "tz1VSichevvJSNkSSntgwKDKikWNB6iqNJii",
              }),
              expectedStatus: {
                errors: {
                  amount: new NotEnoughBalance(),
                },
                warnings: {},
              },
            },
            /* // FIXME broken test
            {
              name: "Amount > spendablebalance",
              transaction: (t, account) => ({
                ...t,
                amount: account.balance,
                recipient: accountTZnew.freshAddress,
              }),
              expectedStatus: {
                errors: {
                  amount: new NotEnoughBalance(),
                },
                warnings: {},
              },
            },
            */
          ],
        },
        {
          raw: accountTZnew,
          test: (expect, account) => {
            expect(account.operations).toEqual([]);
          },
          transactions: [],
        },
      ],
    },
  },
};
