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
            <= 41041caa3a42db5bdd125b2530c47cfbe829539b5a20a5562ec839d241c67d1862f2980d26ebffee25e4f924410c3316b397f34bd572543e72c59a7569ef9032f498223134384c484667516b6f504b48554665567a464e6d556a4b54375a774234376654529f819c7d45eb9eb1e9bd5fa695158cca9e493182f95068b22c8c440ae6eb07209000
            => e016000000
            <= 000000050107426974636f696e034254439000
            => e040000009028000002c80000000
            <= 41041caa3a42db5bdd125b2530c47cfbe829539b5a20a5562ec839d241c67d1862f2980d26ebffee25e4f924410c3316b397f34bd572543e72c59a7569ef9032f498223134384c484667516b6f504b48554665567a464e6d556a4b54375a774234376654529f819c7d45eb9eb1e9bd5fa695158cca9e493182f95068b22c8c440ae6eb07209000
            => e04000000d038000002c8000000080000000
            <= 4104238878d371ce61cdd04d22ccab50c542e94ffa7a27d02d6bcefaa22e4fcee6db4c2029fd4de0b595e98002c0be01fc1fbd3568671e394c97a6d52c3d4c113fb52231356f36754274527a4b6f6a6278714265344b6e69363642537658664b595432475944728146118df8d18d38c2615154eaffcdd53829957f4e26863344f35653364e9000
            => e040000009028000002c80000000
            <= 41041caa3a42db5bdd125b2530c47cfbe829539b5a20a5562ec839d241c67d1862f2980d26ebffee25e4f924410c3316b397f34bd572543e72c59a7569ef9032f498223134384c484667516b6f504b48554665567a464e6d556a4b54375a774234376654529f819c7d45eb9eb1e9bd5fa695158cca9e493182f95068b22c8c440ae6eb07209000
            => e04000000d038000002c8000000080000001
            <= 410415d2ae6368394c10962a92ab7b680e272f27c4951e2960ce11fe6d30ed9ca87dbbb1e0231da0caf45e2c7040adcb55b04eff0335ede12ca79600722846f0dc89223132675842717446627353316d566643637979436e35424d7566744d56736e334e4269c51a44ff9a3b3f2d041491ef614064b0193142057576c147763fe9493343879000
            => e040000109028000003180000000
            <= 41047615032ad01c87f38c5401a6765aee429eb5a57ccde63573fdfe602b4de7c7ac109d1f23fbdd847c483bd147ff8218f15858f16824ecff4ca3fcb4245e2d93f52233334c79656578314a5165624779525a36586e77686e4738334b4255787a793668343de97255695c6fbec7459a688b0fddef585e98fae29c96655c3ff648131ca1c39000
            => e016000000
            <= 000000050107426974636f696e034254439000
            => e040000109028000003180000000
            <= 41047615032ad01c87f38c5401a6765aee429eb5a57ccde63573fdfe602b4de7c7ac109d1f23fbdd847c483bd147ff8218f15858f16824ecff4ca3fcb4245e2d93f52233334c79656578314a5165624779525a36586e77686e4738334b4255787a793668343de97255695c6fbec7459a688b0fddef585e98fae29c96655c3ff648131ca1c39000
            => e04000010d03800000318000000080000000
            <= 410412f62e549eee10ea7df9c9b1acfa6d77abb7424c057d7d725f418e2124dcd8662e21fde9e0b5a4cb731933a68ca406f6efcdadc8fb52afdb9ae422a68cfe5bde2233483737566559675a584b4e4d6b426668653766634d416d334b376b794a67334734508666b8006f31778f6dbb06bdbf20088d9a84ea15776cf6073b3ea025d48d9e9000
            => e040000109028000003180000000
            <= 41047615032ad01c87f38c5401a6765aee429eb5a57ccde63573fdfe602b4de7c7ac109d1f23fbdd847c483bd147ff8218f15858f16824ecff4ca3fcb4245e2d93f52233334c79656578314a5165624779525a36586e77686e4738334b4255787a793668343de97255695c6fbec7459a688b0fddef585e98fae29c96655c3ff648131ca1c39000
            => e04000010d03800000318000000080000001
            <= 4104ade4dbcec2e6dafc664eb9337f784f01eb64087e19cbbf1068b6bcc535b5f1fab6094958d8f2b18c1f922d31b4a63d1f595689e2f2b3725bd6876c61a5488673223350684b454372414d32424c66595770505a7255485343694346395054526d66616b7adba784bff55fb0b1ae8b5ab1d1aba2883613db2f674ef00bc8df2bd7c4358e9000
            => e040000109028000003180000000
            <= 41047615032ad01c87f38c5401a6765aee429eb5a57ccde63573fdfe602b4de7c7ac109d1f23fbdd847c483bd147ff8218f15858f16824ecff4ca3fcb4245e2d93f52233334c79656578314a5165624779525a36586e77686e4738334b4255787a793668343de97255695c6fbec7459a688b0fddef585e98fae29c96655c3ff648131ca1c39000
            => e04000010d03800000318000000080000002
            <= 4104aab62ffcffe3bf9864b426d6f49b6bcd007f10f96f4be8fb28cd3a0ad4e6aded8a09965deca458a18a9d2151f2761844af9e473e3b4873670f097e470d73d72722333374654447684a7470793439707479763747635657347838437041344269706656881f8ad639081fb27a0db564011cf8a568a73ea1ac75b69e3e47ad6316165cfc9000
            => e040000209028000005480000000
            <= 41043188c7e9e184aa3f6c2967b9b2b19a5966efe88c526ac091687642540573ecfb4c988261e7b0b876c6aec0b393518676232b34289a5bfc0cc78cc2ef735fa5122a626331713636353767686b3368306e75786b717466716a6c383637637771796a6e63777677346c66386ccdddd55f0385b0a53a4803e47f24df989a42b4e3b0b1dda17c41f4381e5301cb9000
            => e016000000
            <= 000000050107426974636f696e034254439000
            => e040000209028000005480000000
            <= 41043188c7e9e184aa3f6c2967b9b2b19a5966efe88c526ac091687642540573ecfb4c988261e7b0b876c6aec0b393518676232b34289a5bfc0cc78cc2ef735fa5122a626331713636353767686b3368306e75786b717466716a6c383637637771796a6e63777677346c66386ccdddd55f0385b0a53a4803e47f24df989a42b4e3b0b1dda17c41f4381e5301cb9000
            => e04000020d03800000548000000080000000
            <= 4104985c77e031db7909b5bab541828faac7719bc3ac205907da16f379e693eb012217195cbb49c53854d1bfec204470abc73ab4fb51338653e5236c6a6ae57d34422a62633171723561783039386b6a73706a396c3737797a3234746e3733737878776d736367617479756533529d8a9f14d7c1b543bd6f288f167b3232e03fec8fe88746d74e958d1a101a489000
            => e040000209028000005480000000
            <= 41043188c7e9e184aa3f6c2967b9b2b19a5966efe88c526ac091687642540573ecfb4c988261e7b0b876c6aec0b393518676232b34289a5bfc0cc78cc2ef735fa5122a626331713636353767686b3368306e75786b717466716a6c383637637771796a6e63777677346c66386ccdddd55f0385b0a53a4803e47f24df989a42b4e3b0b1dda17c41f4381e5301cb9000
            => e04000020d03800000548000000080000001
            <= 4104495e8f35895184aca665882cbee1a0489c9f51aad1c981aabe6ce0684a953627f61b07f3fb79f8cd5da4a85149597dfacbd60836644300cb99a4257e21ff99bb2a62633171716c6e663567746171673070396836636376376e38677675787376786a65717332643576366ad71e3caf8b6840c9edfd48fecafd31fde2da5060edd6ce8b8c124841185896459000
            => e040000209028000005480000000
            <= 41043188c7e9e184aa3f6c2967b9b2b19a5966efe88c526ac091687642540573ecfb4c988261e7b0b876c6aec0b393518676232b34289a5bfc0cc78cc2ef735fa5122a626331713636353767686b3368306e75786b717466716a6c383637637771796a6e63777677346c66386ccdddd55f0385b0a53a4803e47f24df989a42b4e3b0b1dda17c41f4381e5301cb9000
            => e04000020d03800000548000000080000002
            <= 410418a42e7aa6f1ff07f1c284e5ef02b2b2df576856d8f5bd22454bb148a196b45cc35fddaa46229176f826557ff3db22b5149a258f8659ee2e9dfd9458dd0cbae92a626331716c766135707232707066386468367a6534756d6b70336d76766373376d376b7a7273636d7a61d525ad3db9e29a775891489f09a304d80f3cd1716dc47959645936ed075759f69000
          `,
          test: (expect, accounts) => {
            expect(accounts.map(toAccountRaw)).toMatchObject([
              {
                id:
                  "libcore:1:bitcoin:xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn:",
                seedIdentifier:
                  "041caa3a42db5bdd125b2530c47cfbe829539b5a20a5562ec839d241c67d1862f2980d26ebffee25e4f924410c3316b397f34bd572543e72c59a7569ef9032f498",
                name: "Bitcoin 1 (legacy)",
                derivationMode: "",
                index: 0,
                freshAddress: "1Ktck8TvjnCUj2jNXexzBXJ2ihNikfCDii",
                freshAddressPath: "44'/0'/0'/0/60",
                operationsCount: 131,
                pendingOperations: [],
                currencyId: "bitcoin",
                unitMagnitude: 8,
                balance: "2757",
                spendableBalance: "2757",
                xpub:
                  "xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn"
              },
              {
                id:
                  "libcore:1:bitcoin:xpub6CKb86o7RHSCxuwP5dnxyDySLbnVWypQUxhWpycFZWFTzXuXy3UgGtG3o51oGER6X2UY6zRqd5AXgzNghb9va1FkfzXz6k1RT6EwTwCKejE:segwit",
                seedIdentifier:
                  "047615032ad01c87f38c5401a6765aee429eb5a57ccde63573fdfe602b4de7c7ac109d1f23fbdd847c483bd147ff8218f15858f16824ecff4ca3fcb4245e2d93f5",
                name: "Bitcoin 1 (segwit)",
                derivationMode: "segwit",
                index: 0,
                freshAddress: "34WDB297Z1crydk6CMa1UvUpZ8G4cPXiYE",
                freshAddressPath: "49'/0'/0'/0/34",
                operationsCount: 71,
                pendingOperations: [],
                currencyId: "bitcoin",
                unitMagnitude: 8,
                balance: "0",
                spendableBalance: "0",
                xpub:
                  "xpub6CKb86o7RHSCxuwP5dnxyDySLbnVWypQUxhWpycFZWFTzXuXy3UgGtG3o51oGER6X2UY6zRqd5AXgzNghb9va1FkfzXz6k1RT6EwTwCKejE"
              },
              {
                id:
                  "libcore:1:bitcoin:xpub6CKb86o7RHSD1tDBFKwPgEZ5Q83gnRPG7Bs5HzBRUxcm4dvLEPnSTWP8C7c4P71GgMCk1Fw6xS6Ki4XC6bGAQcxE8gc9KJHXzQnErDtwTa6:segwit",
                seedIdentifier:
                  "047615032ad01c87f38c5401a6765aee429eb5a57ccde63573fdfe602b4de7c7ac109d1f23fbdd847c483bd147ff8218f15858f16824ecff4ca3fcb4245e2d93f5",
                name: "Bitcoin 2 (segwit)",
                derivationMode: "segwit",
                index: 1,
                freshAddress: "3EyuXJk735CE5oBummZqzzFGN5qSMYLQ9w",
                freshAddressPath: "49'/0'/1'/0/44",
                operationsCount: 91,
                pendingOperations: [],
                currencyId: "bitcoin",
                unitMagnitude: 8,
                balance: "3000",
                spendableBalance: "3000",
                xpub:
                  "xpub6CKb86o7RHSD1tDBFKwPgEZ5Q83gnRPG7Bs5HzBRUxcm4dvLEPnSTWP8C7c4P71GgMCk1Fw6xS6Ki4XC6bGAQcxE8gc9KJHXzQnErDtwTa6"
              },
              {
                id:
                  "libcore:1:bitcoin:xpub6CKb86o7RHSD4ZhRxHBtCWgL2J5MJYrVdurKFkdChDPjLpUt7EpvrsoCaBRCD78Qo7ith2DeCqonWinReuXMfs2bqJiLkcoE4VcwvkvUzEJ:segwit",
                seedIdentifier:
                  "047615032ad01c87f38c5401a6765aee429eb5a57ccde63573fdfe602b4de7c7ac109d1f23fbdd847c483bd147ff8218f15858f16824ecff4ca3fcb4245e2d93f5",
                name: "Bitcoin 3 (segwit)",
                derivationMode: "segwit",
                index: 2,
                freshAddress: "3DUk27bxJm3y7txoPTK4GGBWcyoW6ibGuh",
                freshAddressPath: "49'/0'/2'/0/0",
                operationsCount: 0,
                pendingOperations: [],
                currencyId: "bitcoin",
                unitMagnitude: 8,
                balance: "0",
                spendableBalance: "0",
                xpub:
                  "xpub6CKb86o7RHSD4ZhRxHBtCWgL2J5MJYrVdurKFkdChDPjLpUt7EpvrsoCaBRCD78Qo7ith2DeCqonWinReuXMfs2bqJiLkcoE4VcwvkvUzEJ"
              },
              {
                id:
                  "libcore:1:bitcoin:xpub6DEHKg8fgKcb5iYGPLtpBYD9gm7nvym3wwhHVnH3TtogvJGTcApj71K8iTpL7CzdZWAxwyjkZEFUrnLK24zKqgj3EVH7Vg1CD1ujibwiHuy:native_segwit",
                seedIdentifier:
                  "043188c7e9e184aa3f6c2967b9b2b19a5966efe88c526ac091687642540573ecfb4c988261e7b0b876c6aec0b393518676232b34289a5bfc0cc78cc2ef735fa512",
                name: "Bitcoin 1 (native segwit)",
                derivationMode: "native_segwit",
                index: 0,
                freshAddress: "bc1qhh568mfmwu7ymvwhu5e4mttpfg4ehxfpvhjs64",
                freshAddressPath: "84'/0'/0'/0/27",
                operationsCount: 65,
                pendingOperations: [],
                currencyId: "bitcoin",
                unitMagnitude: 8,
                balance: "0",
                spendableBalance: "0",
                xpub:
                  "xpub6DEHKg8fgKcb5iYGPLtpBYD9gm7nvym3wwhHVnH3TtogvJGTcApj71K8iTpL7CzdZWAxwyjkZEFUrnLK24zKqgj3EVH7Vg1CD1ujibwiHuy"
              },
              {
                id:
                  "libcore:1:bitcoin:xpub6DEHKg8fgKcb9at2u9Xhjtx4tXGyWqUPQAx2zNCzr41gQRyCqpCn7onSoJU4VS96GXyCtAhhFxErnG2pGVvVexaqF7DEfqGGnGk7Havn7C2:native_segwit",
                seedIdentifier:
                  "043188c7e9e184aa3f6c2967b9b2b19a5966efe88c526ac091687642540573ecfb4c988261e7b0b876c6aec0b393518676232b34289a5bfc0cc78cc2ef735fa512",
                name: "Bitcoin 2 (native segwit)",
                derivationMode: "native_segwit",
                index: 1,
                freshAddress: "bc1q8vp7v5wyv8nvhsh5p2dvkgalep4q325kd5xk4e",
                freshAddressPath: "84'/0'/1'/0/53",
                operationsCount: 118,
                pendingOperations: [],
                currencyId: "bitcoin",
                unitMagnitude: 8,
                balance: "2717",
                spendableBalance: "2717",
                xpub:
                  "xpub6DEHKg8fgKcb9at2u9Xhjtx4tXGyWqUPQAx2zNCzr41gQRyCqpCn7onSoJU4VS96GXyCtAhhFxErnG2pGVvVexaqF7DEfqGGnGk7Havn7C2"
              },
              {
                id:
                  "libcore:1:bitcoin:xpub6DEHKg8fgKcbC7ZzoayZKxpDs8PYag9aBvXLhpvZhag3DT2nU5PwLE6xaineM5jciavwNYGUZrdSTcktK6Xu9odBYXN6K2zeou479HUcbsc:native_segwit",
                seedIdentifier:
                  "043188c7e9e184aa3f6c2967b9b2b19a5966efe88c526ac091687642540573ecfb4c988261e7b0b876c6aec0b393518676232b34289a5bfc0cc78cc2ef735fa512",
                name: "Bitcoin 3 (native segwit)",
                derivationMode: "native_segwit",
                index: 2,
                freshAddress: "bc1qnqy7vyp0df7tl90mwz9jwca66t6hef4yj9hl6n",
                freshAddressPath: "84'/0'/2'/0/0",
                operationsCount: 0,
                pendingOperations: [],
                currencyId: "bitcoin",
                unitMagnitude: 8,
                balance: "0",
                spendableBalance: "0",
                xpub:
                  "xpub6DEHKg8fgKcbC7ZzoayZKxpDs8PYag9aBvXLhpvZhag3DT2nU5PwLE6xaineM5jciavwNYGUZrdSTcktK6Xu9odBYXN6K2zeou479HUcbsc"
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
