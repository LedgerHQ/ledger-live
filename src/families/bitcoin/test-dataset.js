// @flow
import { BigNumber } from "bignumber.js";
import { FeeTooHigh } from "@ledgerhq/errors";
import type { DatasetTest } from "../../__tests__/test-helpers/bridge";
import type { NetworkInfoRaw, Transaction } from "./types";
import { toAccountRaw } from "../../account";
import { fromTransactionRaw } from "./transaction";

const networkInfo: NetworkInfoRaw = {
  family: "bitcoin",
  feeItems: {
    items: [
      { key: "0", speed: "high", feePerByte: "3" },
      { key: "1", speed: "standard", feePerByte: "2" },
      { key: "2", speed: "low", feePerByte: "1" }
    ],
    defaultFeePerByte: "1"
  }
};

const dataset: DatasetTest<Transaction> = {
  implementations: ["libcore", "mock"],
  currencies: {
    bitcoin: {
      scanAccounts: [
        {
          name: "seedtest1",
          apdus: `
          => e040000009028000002c80000000
          <= 4104b9b3078fbdef02b5f5aa8bb400423d5170015da06c31ad7745160cbab1fa4cdc965f271b924c2999639211310f6d35029698749b38ea7e64608de3ebcdbaa46a2231324d455278336a7a5a64657a4a726551444c777a5242387363763778754e677976cdff3f19b89aab59d5804050b1c99f99cb079630c786144cd6cba8e84c29750c9000
          => e016000000
          <= 000000050107426974636f696e034254439000
          => e040000009028000002c80000000
          <= 4104b9b3078fbdef02b5f5aa8bb400423d5170015da06c31ad7745160cbab1fa4cdc965f271b924c2999639211310f6d35029698749b38ea7e64608de3ebcdbaa46a2231324d455278336a7a5a64657a4a726551444c777a5242387363763778754e677976cdff3f19b89aab59d5804050b1c99f99cb079630c786144cd6cba8e84c29750c9000
          => e04000000d038000002c8000000080000000
          <= 41041f6c89d7b896277954ddad21110dca739b67a5aaae58afe16c5cd212925339f8df8de52910a71ce7475bea7b51f24020fa4e0097622242ed7e3b17e275e1d889223139434a386e6b73465a703574486638694c4639367653435a4e55314b4c69446d6490489ace59735ee2a130e5db0a3cb43734d1e0f17c66c182dd6af01e325600859000
          => e040000009028000002c80000000
          <= 4104b9b3078fbdef02b5f5aa8bb400423d5170015da06c31ad7745160cbab1fa4cdc965f271b924c2999639211310f6d35029698749b38ea7e64608de3ebcdbaa46a2231324d455278336a7a5a64657a4a726551444c777a5242387363763778754e677976cdff3f19b89aab59d5804050b1c99f99cb079630c786144cd6cba8e84c29750c9000
          => e04000000d038000002c8000000080000001
          <= 4104c9bc195c9c0e1a51127f8b1c372b4543e14041431e6b57923dd52ba4174b25ef39cc32d8c50cc37214ae93ffcca926163269e729dc80bd95ee545f35dc3e0ed62231336b37795968346a6b4b694c7173503847716265555a336f4253523553705873615a31399b978a87550d7000702b7033d5c087434320794348fa622d26bdec1dfe9000
          => e040000109028000003180000000
          <= 4104b3b0982673f35bd288e681c371636145c7a8e17d4c59a6c8704100d366fa06da4246b7de1535511f9e11ad111683cbeafd992c4d1390b3a04fd79a51159f86912233467a48517a76375a36767537576e6a6568727269354c556644373177773873436fd0ce17bf8b118b0d5b5c93a905ae915e50e42d6f3f5afeea9e319d461388babd9000
          => e016000000
          <= 000000050107426974636f696e034254439000
          => e040000109028000003180000000
          <= 4104b3b0982673f35bd288e681c371636145c7a8e17d4c59a6c8704100d366fa06da4246b7de1535511f9e11ad111683cbeafd992c4d1390b3a04fd79a51159f86912233467a48517a76375a36767537576e6a6568727269354c556644373177773873436fd0ce17bf8b118b0d5b5c93a905ae915e50e42d6f3f5afeea9e319d461388babd9000
          => e04000010d03800000318000000080000000
          <= 41049367da0966f580263501b50bec1430730b742ba2866f0537310a9a45c493dc875fc7a38df3aab224b42962f13d1c22183a597cc21813aac9bbb0a1bab48e12362233443947787271714b5a32596f55314d39354a7a576d48357454545964444e7a32729d40147cfc05c038a58c03a8b6bb23b30774f6ef6ca3e2be8fc8cbb2329515fa9000
          => e040000109028000003180000000
          <= 4104b3b0982673f35bd288e681c371636145c7a8e17d4c59a6c8704100d366fa06da4246b7de1535511f9e11ad111683cbeafd992c4d1390b3a04fd79a51159f86912233467a48517a76375a36767537576e6a6568727269354c556644373177773873436fd0ce17bf8b118b0d5b5c93a905ae915e50e42d6f3f5afeea9e319d461388babd9000
          => e04000010d03800000318000000080000001
          <= 4104f8b1ef8090ebb036e3a0a67574e3930704dd18f26ccc7ca2d441031c8b8f1ffb4853a0db133622e6d15957d69e7077dc296665e1a75cb58456e880711b83fd92223341486a564b733874656d506978597148377047713571354c584c31783359694c4eadaa264cde663f664f6193417abd943d2a4c1dfb0002ad769843a92f370386279000
          => e040000109028000003180000000
          <= 4104b3b0982673f35bd288e681c371636145c7a8e17d4c59a6c8704100d366fa06da4246b7de1535511f9e11ad111683cbeafd992c4d1390b3a04fd79a51159f86912233467a48517a76375a36767537576e6a6568727269354c556644373177773873436fd0ce17bf8b118b0d5b5c93a905ae915e50e42d6f3f5afeea9e319d461388babd9000
          => e04000010d03800000318000000080000002
          <= 4104cb698d9ef78361d4bca22c4c2a40ce160ce441de12b844ceb6851508d9637eb6e08278059e842927d9fa236127fc8b7b145c5d14c2373f17e247404960a930812233416e5a53593576444c7031563569436b7839374a7661714e396f777238364e63646b64bdeeefff6354dc4616bf092c9ebd2090bc000f4fb1e370c4a0a1fbd1d75e9000
          => e040000109028000003180000000
          <= 4104b3b0982673f35bd288e681c371636145c7a8e17d4c59a6c8704100d366fa06da4246b7de1535511f9e11ad111683cbeafd992c4d1390b3a04fd79a51159f86912233467a48517a76375a36767537576e6a6568727269354c556644373177773873436fd0ce17bf8b118b0d5b5c93a905ae915e50e42d6f3f5afeea9e319d461388babd9000
          => e04000010d03800000318000000080000003
          <= 41042ddf54969196680ddf44ea9543c9ebffdd4e55beebd21daa1c4d71d33538bdd6362b0e344bfb80153405ca2068726e36c2e104ad2e7dfaca914593f82cd216d922334e795351483572734d3859554b6f3865464d7632446370657a6e6e6e7141436839a530b8188de29da54a0faf8383b6f9c30fd8cfd200b2c5d2bc535f12a919b9429000
          => e040000209028000005480000000
          <= 4104c2f0fe9c27396ba3e37558d71d8308572c5bba380cfe0a68450bc38039b781ce02f1ce14db54eed0ba56ed4aebba93338d3d0af82a6078ace90458f09069b1252a626331716c32377966776c6433796171666e6b6d38363472356d78366466766e7972633266786333766ce530784b710ea23b7becaaec152377edff93281e4e10a2fcd97cb1a0f3d9f5c29000
          => e016000000
          <= 000000050107426974636f696e034254439000
          => e040000209028000005480000000
          <= 4104c2f0fe9c27396ba3e37558d71d8308572c5bba380cfe0a68450bc38039b781ce02f1ce14db54eed0ba56ed4aebba93338d3d0af82a6078ace90458f09069b1252a626331716c32377966776c6433796171666e6b6d38363472356d78366466766e7972633266786333766ce530784b710ea23b7becaaec152377edff93281e4e10a2fcd97cb1a0f3d9f5c29000
          => e04000020d03800000548000000080000000
          <= 4104e636335b14fc4359d61d0342c9bd92985d225f9d21317d02c54223ee855290679de1eeef7da078455e026696f18b953cb58ff80ef774b9b60d45ca69f659a92a2a6263317130673465647366766e6b383575343938386579736768646d77307839726d6a7836776a6d797255e476ee6fe4aed00146cfc33279e7b80d103d030fbedf2e0e5b206318f93c1f9000
          => e040000209028000005480000000
          <= 4104c2f0fe9c27396ba3e37558d71d8308572c5bba380cfe0a68450bc38039b781ce02f1ce14db54eed0ba56ed4aebba93338d3d0af82a6078ace90458f09069b1252a626331716c32377966776c6433796171666e6b6d38363472356d78366466766e7972633266786333766ce530784b710ea23b7becaaec152377edff93281e4e10a2fcd97cb1a0f3d9f5c29000
          => e04000020d03800000548000000080000001
          <= 41043fd6856e4605f9c96d644d56ad7e654cecbcb19afac38add945ab4a3360a5b2c2ec856777d6178d01a8789a04323ce5177c1a59521b71a661c463cd336b77c362a626331717136326a6a777a6a6b3739713230383865327234676361747635637378767174333036616732f12cd174453b43384b526d8b2a7a08a8889fac6cd8f00db54f04e342ea39d4289000
          `,
          test: (expect, accounts) => {
            expect(accounts.map(toAccountRaw)).toMatchObject([
              {
                balance: "0",
                currencyId: "bitcoin",
                derivationMode: "",
                freshAddress: "1DuAJPh3eZWxampXYqAehmmtMUXsiKsMzD",
                freshAddressPath: "44'/0'/0'/0/86",
                id:
                  "libcore:1:bitcoin:xpub6Bm5P7Xyx2UYrVBAgb54gEswXhbZaryZSWsPjeJ1jpb9K9S5UTD5z5cXW4EREkTqkNjSHQHxwHKZJVE7TFvftySnKabMAXAQCMSVJBdJxMC:",
                index: 0,
                name: "Bitcoin 1 (legacy)",
                operationsCount: 172,
                pendingOperations: [],
                seedIdentifier:
                  "04b9b3078fbdef02b5f5aa8bb400423d5170015da06c31ad7745160cbab1fa4cdc965f271b924c2999639211310f6d35029698749b38ea7e64608de3ebcdbaa46a",
                spendableBalance: "0",
                unitMagnitude: 8,
                xpub:
                  "xpub6Bm5P7Xyx2UYrVBAgb54gEswXhbZaryZSWsPjeJ1jpb9K9S5UTD5z5cXW4EREkTqkNjSHQHxwHKZJVE7TFvftySnKabMAXAQCMSVJBdJxMC"
              },
              {
                balance: "117395",
                currencyId: "bitcoin",
                derivationMode: "segwit",
                freshAddress: "3AtghS1V9QLYA6DWr3sfhtmK2fRxXp3NLn",
                freshAddressPath: "49'/0'/0'/0/38",
                id:
                  "libcore:1:bitcoin:xpub6BuPGsUw1Aaz92W5AjsuwjHYbjUKG8Xw4HEuQ2XzYSZWa8CZ4Hkhh6pBeZx2iSVuK7LZk4VKFytXuNNEPHbiuyYyXyDCiusnQ56Aoghhrcs:segwit",
                index: 0,
                name: "Bitcoin 1 (segwit)",
                operationsCount: 77,
                pendingOperations: [],
                seedIdentifier:
                  "04b3b0982673f35bd288e681c371636145c7a8e17d4c59a6c8704100d366fa06da4246b7de1535511f9e11ad111683cbeafd992c4d1390b3a04fd79a51159f8691",
                spendableBalance: "117395",
                unitMagnitude: 8,
                xpub:
                  "xpub6BuPGsUw1Aaz92W5AjsuwjHYbjUKG8Xw4HEuQ2XzYSZWa8CZ4Hkhh6pBeZx2iSVuK7LZk4VKFytXuNNEPHbiuyYyXyDCiusnQ56Aoghhrcs"
              },
              {
                balance: "0",
                currencyId: "bitcoin",
                derivationMode: "segwit",
                freshAddress: "3KyHUnYpJRejc84fVqEBPmH4WtSxvEtEgP",
                freshAddressPath: "49'/0'/1'/0/135",
                id:
                  "libcore:1:bitcoin:xpub6BuPGsUw1AazBjooDr9dHzVm5hwQCQbEtreXX6hjAA5ahJdPNHuJkn8t3nR9e9rNQ8rqboGdnWkrcwmxp9Cvd2u7zEURkQVnnWQHJFcFiMV:segwit",
                index: 1,
                name: "Bitcoin 2 (segwit)",
                operationsCount: 297,
                pendingOperations: [],
                seedIdentifier:
                  "04b3b0982673f35bd288e681c371636145c7a8e17d4c59a6c8704100d366fa06da4246b7de1535511f9e11ad111683cbeafd992c4d1390b3a04fd79a51159f8691",
                spendableBalance: "0",
                unitMagnitude: 8,
                xpub:
                  "xpub6BuPGsUw1AazBjooDr9dHzVm5hwQCQbEtreXX6hjAA5ahJdPNHuJkn8t3nR9e9rNQ8rqboGdnWkrcwmxp9Cvd2u7zEURkQVnnWQHJFcFiMV"
              },
              {
                balance: "0",
                currencyId: "bitcoin",
                derivationMode: "segwit",
                freshAddress: "38pozD9N9Sb4a2vJVvn1VsTESwhxvvTYDS",
                freshAddressPath: "49'/0'/2'/0/1",
                id:
                  "libcore:1:bitcoin:xpub6BuPGsUw1AazDdNDNVPgRY1EYbM1xMxPdbrh8AD7ChSQKgECTEnVukh216M3Xz8f1VzNtJ7xCKMzbgFP7DFEMT2PVV8EbYkekVfY5Y9TTKh:segwit",
                index: 2,
                name: "Bitcoin 3 (segwit)",
                operationsCount: 2,
                pendingOperations: [],
                seedIdentifier:
                  "04b3b0982673f35bd288e681c371636145c7a8e17d4c59a6c8704100d366fa06da4246b7de1535511f9e11ad111683cbeafd992c4d1390b3a04fd79a51159f8691",
                spendableBalance: "0",
                unitMagnitude: 8,
                xpub:
                  "xpub6BuPGsUw1AazDdNDNVPgRY1EYbM1xMxPdbrh8AD7ChSQKgECTEnVukh216M3Xz8f1VzNtJ7xCKMzbgFP7DFEMT2PVV8EbYkekVfY5Y9TTKh"
              },
              {
                balance: "0",
                currencyId: "bitcoin",
                derivationMode: "segwit",
                freshAddress: "32zC2Vt63WJttvkvtYtHEJFh2gjZRi1K29",
                freshAddressPath: "49'/0'/3'/0/0",
                id:
                  "libcore:1:bitcoin:xpub6BuPGsUw1AazGkZvYGrhFX2t3Ag42rEgtPndss4r2cp5jyhSqdFouRERCUFXLUeEC5DpPBYw14Lt7Vjq4Vs8SzDWteTgSgdN5SMowDzAh78:segwit",
                index: 3,
                name: "Bitcoin 4 (segwit)",
                operationsCount: 0,
                pendingOperations: [],
                seedIdentifier:
                  "04b3b0982673f35bd288e681c371636145c7a8e17d4c59a6c8704100d366fa06da4246b7de1535511f9e11ad111683cbeafd992c4d1390b3a04fd79a51159f8691",
                spendableBalance: "0",
                unitMagnitude: 8,
                xpub:
                  "xpub6BuPGsUw1AazGkZvYGrhFX2t3Ag42rEgtPndss4r2cp5jyhSqdFouRERCUFXLUeEC5DpPBYw14Lt7Vjq4Vs8SzDWteTgSgdN5SMowDzAh78"
              },
              {
                balance: "171611",
                currencyId: "bitcoin",
                derivationMode: "native_segwit",
                freshAddress: "bc1qte9n4z62lfwyeg44ue9n3cue2hax46wxrvk2ew",
                freshAddressPath: "84'/0'/0'/0/30",
                id:
                  "libcore:1:bitcoin:xpub6DVfEXXjv6nspJK6h7A57pRKgAStQDhEST2NNUUwmtGpatc2cEhvP4FbCYSmtF4DJoLHBPG5imcTNVxq8V2SDdENaf63HXPKgMkeZ7SEbsK:native_segwit",
                index: 0,
                name: "Bitcoin 1 (native segwit)",
                operationsCount: 53,
                pendingOperations: [],
                seedIdentifier:
                  "04c2f0fe9c27396ba3e37558d71d8308572c5bba380cfe0a68450bc38039b781ce02f1ce14db54eed0ba56ed4aebba93338d3d0af82a6078ace90458f09069b125",
                spendableBalance: "171611",
                unitMagnitude: 8,
                xpub:
                  "xpub6DVfEXXjv6nspJK6h7A57pRKgAStQDhEST2NNUUwmtGpatc2cEhvP4FbCYSmtF4DJoLHBPG5imcTNVxq8V2SDdENaf63HXPKgMkeZ7SEbsK"
              },
              {
                balance: "0",
                currencyId: "bitcoin",
                derivationMode: "native_segwit",
                freshAddress: "bc1q5rz9qj6dfme42fhygnuvxc9p6hgqgwn0nl48zj",
                freshAddressPath: "84'/0'/1'/0/0",
                id:
                  "libcore:1:bitcoin:xpub6DVfEXXjv6nstPop8K6CPPiRp4fPJhGWYP7RBJ7BakvUhpkibRqTs6zhos3jQKD9bQWNecHyDN2YEr9EcPHfZ3W6vyBL12ouogv5rVNtGdy:native_segwit",
                index: 1,
                name: "Bitcoin 2 (native segwit)",
                operationsCount: 0,
                pendingOperations: [],
                seedIdentifier:
                  "04c2f0fe9c27396ba3e37558d71d8308572c5bba380cfe0a68450bc38039b781ce02f1ce14db54eed0ba56ed4aebba93338d3d0af82a6078ace90458f09069b125",
                spendableBalance: "0",
                unitMagnitude: 8,
                xpub:
                  "xpub6DVfEXXjv6nstPop8K6CPPiRp4fPJhGWYP7RBJ7BakvUhpkibRqTs6zhos3jQKD9bQWNecHyDN2YEr9EcPHfZ3W6vyBL12ouogv5rVNtGdy"
              }
            ]);
          }
        }
      ],

      accounts: [
        {
          transactions: [
            {
              name: "on legacy recipient",
              transaction: fromTransactionRaw({
                family: "bitcoin",
                recipient: "1Cz2ZXb6Y6AacXJTpo4RBjQMLEmscuxD8e",
                amount: "999",
                feePerByte: "1",
                networkInfo
              }),
              expectedStatus: {
                amount: BigNumber("999"),
                // FIXME fee are reloaded?
                // estimatedFees: BigNumber("250"),
                // totalSpent: BigNumber("1249"),
                errors: {},
                warnings: {
                  feeTooHigh: new FeeTooHigh()
                }
              }
            },
            {
              name: "on segwit recipient",
              transaction: fromTransactionRaw({
                family: "bitcoin",
                recipient: "34N7XoKANmM66ZQDyQf2j8hPaTo6v5X8eA",
                amount: "998",
                feePerByte: "1",
                networkInfo
              }),
              expectedStatus: {
                amount: BigNumber("998"),
                // FIXME fee are reloaded?
                // estimatedFees: BigNumber("250"),
                // totalSpent: BigNumber("1248"),
                errors: {},
                warnings: {
                  feeTooHigh: new FeeTooHigh()
                }
              }
            },
            {
              name: "on native segwit recipient",
              transaction: fromTransactionRaw({
                family: "bitcoin",
                recipient: "bc1qqmxqdrkxgx6swrvjl9l2e6szvvkg45all5u4fl",
                amount: "997",
                feePerByte: "1",
                networkInfo
              }),
              expectedStatus: {
                amount: BigNumber("997"),
                // FIXME fee are reloaded?
                // estimatedFees: BigNumber("250"),
                // totalSpent: BigNumber("1247"),
                errors: {},
                warnings: {
                  feeTooHigh: new FeeTooHigh()
                }
              }
            }
          ],
          raw: {
            id:
              "libcore:1:bitcoin:xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn:",
            seedIdentifier:
              "041caa3a42db5bdd125b2530c47cfbe829539b5a20a5562ec839d241c67d1862f2980d26ebffee25e4f924410c3316b397f34bd572543e72c59a7569ef9032f498",
            name: "Bitcoin 1 (legacy)",
            derivationMode: "",
            index: 0,
            freshAddress: "17gPmBH8b6UkvSmxMfVjuLNAqzgAroiPSe",
            freshAddressPath: "44'/0'/0'/0/59",
            freshAddresses: [
              {
                address: "17gPmBH8b6UkvSmxMfVjuLNAqzgAroiPSe",
                derivationPath: "44'/0'/0'/0/59"
              }
            ],
            pendingOperations: [],
            operations: [],
            currencyId: "bitcoin",
            unitMagnitude: 8,
            balance: "2757",
            blockHeight: 0,
            lastSyncDate: "",
            xpub:
              "xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn"
          }
        },
        {
          raw: {
            id:
              "libcore:1:bitcoin:xpub6DEHKg8fgKcb9at2u9Xhjtx4tXGyWqUPQAx2zNCzr41gQRyCqpCn7onSoJU4VS96GXyCtAhhFxErnG2pGVvVexaqF7DEfqGGnGk7Havn7C2:native_segwit",
            seedIdentifier:
              "043188c7e9e184aa3f6c2967b9b2b19a5966efe88c526ac091687642540573ecfb4c988261e7b0b876c6aec0b393518676232b34289a5bfc0cc78cc2ef735fa512",
            name: "Bitcoin 2 (native segwit)",
            derivationMode: "native_segwit",
            index: 1,
            freshAddress: "bc1q8vp7v5wyv8nvhsh5p2dvkgalep4q325kd5xk4e",
            freshAddressPath: "84'/0'/1'/0/53",
            freshAddresses: [
              {
                address: "bc1q8vp7v5wyv8nvhsh5p2dvkgalep4q325kd5xk4e",
                derivationPath: "84'/0'/1'/0/53"
              }
            ],
            blockHeight: 0,
            operations: [],
            pendingOperations: [],
            currencyId: "bitcoin",
            unitMagnitude: 8,
            lastSyncDate: "",
            balance: "2717",
            xpub:
              "xpub6DEHKg8fgKcb9at2u9Xhjtx4tXGyWqUPQAx2zNCzr41gQRyCqpCn7onSoJU4VS96GXyCtAhhFxErnG2pGVvVexaqF7DEfqGGnGk7Havn7C2"
          }
        }
      ]
    },
    dogecoin: {
      accounts: [
        {
          raw: {
            id:
              "libcore:1:dogecoin:dgub8rBqrhN2grbuDNuFBCu9u9KQKgQmkKaa15Yvnf4YznmvqFZByDPJypigogDKanefhrjj129Ek1W13zvtyQSD6HDpzxyskJvU6xmhD29S9eF:",
            seedIdentifier:
              "044c892c19c1873fa73dabee9942e551fafe49d3fd12dacd6a25c421d7c712bc136c61295d195ded6d366121cfe0a1aa2a1df548680fbfcabe868233bc12e2d772",
            name: "Dogecoin 1",
            derivationMode: "",
            index: 0,
            freshAddress: "DCovDUyAFueFmK2QVuW5XDtaUNLa2LP72n",
            freshAddressPath: "44'/3'/0'/0/6",
            freshAddresses: [
              {
                address: "DCovDUyAFueFmK2QVuW5XDtaUNLa2LP72n",
                derivationPath: "44'/3'/0'/0/6"
              }
            ],
            blockHeight: 2869296,
            operations: [],
            pendingOperations: [],
            currencyId: "dogecoin",
            unitMagnitude: 8,
            lastSyncDate: "",
            balance: "286144149366",
            xpub:
              "dgub8rBqrhN2grbuDNuFBCu9u9KQKgQmkKaa15Yvnf4YznmvqFZByDPJypigogDKanefhrjj129Ek1W13zvtyQSD6HDpzxyskJvU6xmhD29S9eF"
          }
        }
      ]
    },
    zcash: {
      accounts: [
        {
          raw: {
            id:
              "libcore:1:zcash:xpub6DXuLL97nvCs14Ashf3u8N2X9BLBpxN3HKCQWnLzn61o6CqME3Jm1hZ6oBeXcMhkqGDaziTGmw19w5iRstuXJrKLX6khbDt1rEatozTkf97:",
            seedIdentifier:
              "04ccf669020e2e315fb2ffdb98e6f60fed7b4abed8a013f5fd1bd604f7742207feef8cffcf1aca7f08628dea1abbcf1170b80ccf3809aa560996e5a5baaef4da33",
            name: "Zcash 1",
            derivationMode: "",
            index: 0,
            freshAddress: "t1gJ5fydzJKsTUkykzcVw1yDhHSc8FkULEB",
            freshAddressPath: "44'/133'/0'/0/43",
            freshAddresses: [
              {
                address: "t1gJ5fydzJKsTUkykzcVw1yDhHSc8FkULEB",
                derivationPath: "44'/133'/0'/0/43"
              }
            ],
            blockHeight: 597238,
            operations: [],
            pendingOperations: [],
            currencyId: "zcash",
            unitMagnitude: 8,
            lastSyncDate: "",
            balance: "11000000",
            xpub:
              "xpub6DXuLL97nvCs14Ashf3u8N2X9BLBpxN3HKCQWnLzn61o6CqME3Jm1hZ6oBeXcMhkqGDaziTGmw19w5iRstuXJrKLX6khbDt1rEatozTkf97"
          }
        }
      ]
    }
  }
};

export default dataset;
