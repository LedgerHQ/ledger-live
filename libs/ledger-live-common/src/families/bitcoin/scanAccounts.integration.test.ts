import "../../__tests__/test-helpers/setup.integration";
import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { getOperationAmountNumber } from "@ledgerhq/ledger-wallet-framework/operation";
import { isAccountBalanceUnconfirmed } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { bridge } from "./setup";
import { isBitcoinAccount, scanWithRecordedDevice } from "./fixtures/scanAccounts.helpers";

type ExpectedAccount = {
  derivationMode: string;
  index: number;
  accountPath: string;
  seedIdentifier: string;
  xpub: string;
  used: boolean;
  operationsCount: number;
};

const EXPECTED_ACCOUNTS: Record<string, ExpectedAccount[]> = {
  bitcoin: [
    {
      derivationMode: "native_segwit",
      index: 0,
      seedIdentifier:
        "04985c77e031db7909b5bab541828faac7719bc3ac205907da16f379e693eb012217195cbb49c53854d1bfec204470abc73ab4fb51338653e5236c6a6ae57d3442",
      accountPath: "84'/0'/0'",
      xpub: "xpub6DEHKg8fgKcb5iYGPLtpBYD9gm7nvym3wwhHVnH3TtogvJGTcApj71K8iTpL7CzdZWAxwyjkZEFUrnLK24zKqgj3EVH7Vg1CD1ujibwiHuy",
      used: true,
      operationsCount: 66,
    },
    {
      derivationMode: "native_segwit",
      index: 1,
      seedIdentifier:
        "04985c77e031db7909b5bab541828faac7719bc3ac205907da16f379e693eb012217195cbb49c53854d1bfec204470abc73ab4fb51338653e5236c6a6ae57d3442",
      accountPath: "84'/0'/1'",
      xpub: "xpub6DEHKg8fgKcb9at2u9Xhjtx4tXGyWqUPQAx2zNCzr41gQRyCqpCn7onSoJU4VS96GXyCtAhhFxErnG2pGVvVexaqF7DEfqGGnGk7Havn7C2",
      used: true,
      operationsCount: 119,
    },
    {
      derivationMode: "native_segwit",
      index: 2,
      seedIdentifier:
        "04985c77e031db7909b5bab541828faac7719bc3ac205907da16f379e693eb012217195cbb49c53854d1bfec204470abc73ab4fb51338653e5236c6a6ae57d3442",
      accountPath: "84'/0'/2'",
      xpub: "xpub6DEHKg8fgKcbC7ZzoayZKxpDs8PYag9aBvXLhpvZhag3DT2nU5PwLE6xaineM5jciavwNYGUZrdSTcktK6Xu9odBYXN6K2zeou479HUcbsc",
      used: false,
      operationsCount: 0,
    },
    {
      derivationMode: "taproot",
      index: 0,
      seedIdentifier:
        "04bceefa855d60d97cd38688cffdc76e52a663e71db885535d0f62abcea9811148f48e2e21093058a41324c268024eb042c3fa427e9f4f6a60f1af9eb361a05a5b",
      accountPath: "86'/0'/0'",
      xpub: "xpub6BvkrmBTnBQMW1tBLgY2H6itSqFh9xGAYLGtR8PsKi762NghTQVUkv5gJ3osjMzaqqcfpKgHm2ov7N67A6njxLG8RSU8WwLVN4F596cDmp6",
      used: false,
      operationsCount: 0,
    },
    {
      derivationMode: "segwit",
      index: 0,
      seedIdentifier:
        "0412f62e549eee10ea7df9c9b1acfa6d77abb7424c057d7d725f418e2124dcd8662e21fde9e0b5a4cb731933a68ca406f6efcdadc8fb52afdb9ae422a68cfe5bde",
      accountPath: "49'/0'/0'",
      xpub: "xpub6CKb86o7RHSCxuwP5dnxyDySLbnVWypQUxhWpycFZWFTzXuXy3UgGtG3o51oGER6X2UY6zRqd5AXgzNghb9va1FkfzXz6k1RT6EwTwCKejE",
      used: true,
      operationsCount: 71,
    },
    {
      derivationMode: "segwit",
      index: 1,
      seedIdentifier:
        "0412f62e549eee10ea7df9c9b1acfa6d77abb7424c057d7d725f418e2124dcd8662e21fde9e0b5a4cb731933a68ca406f6efcdadc8fb52afdb9ae422a68cfe5bde",
      accountPath: "49'/0'/1'",
      xpub: "xpub6CKb86o7RHSD1tDBFKwPgEZ5Q83gnRPG7Bs5HzBRUxcm4dvLEPnSTWP8C7c4P71GgMCk1Fw6xS6Ki4XC6bGAQcxE8gc9KJHXzQnErDtwTa6",
      used: true,
      operationsCount: 92,
    },
    {
      derivationMode: "segwit",
      index: 2,
      seedIdentifier:
        "0412f62e549eee10ea7df9c9b1acfa6d77abb7424c057d7d725f418e2124dcd8662e21fde9e0b5a4cb731933a68ca406f6efcdadc8fb52afdb9ae422a68cfe5bde",
      accountPath: "49'/0'/2'",
      xpub: "xpub6CKb86o7RHSD4ZhRxHBtCWgL2J5MJYrVdurKFkdChDPjLpUt7EpvrsoCaBRCD78Qo7ith2DeCqonWinReuXMfs2bqJiLkcoE4VcwvkvUzEJ",
      used: false,
      operationsCount: 0,
    },
    {
      derivationMode: "",
      index: 0,
      seedIdentifier:
        "04238878d371ce61cdd04d22ccab50c542e94ffa7a27d02d6bcefaa22e4fcee6db4c2029fd4de0b595e98002c0be01fc1fbd3568671e394c97a6d52c3d4c113fb5",
      accountPath: "44'/0'/0'",
      xpub: "xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn",
      used: true,
      operationsCount: 131,
    },
    {
      derivationMode: "",
      index: 1,
      seedIdentifier:
        "04238878d371ce61cdd04d22ccab50c542e94ffa7a27d02d6bcefaa22e4fcee6db4c2029fd4de0b595e98002c0be01fc1fbd3568671e394c97a6d52c3d4c113fb5",
      accountPath: "44'/0'/1'",
      xpub: "xpub6BuPWhjLqutPY3pENUxwkG3NAQfjLxoHMTAkwzH13rZSzkymZrbKui1MN3KgwiNFsH4AyLM3GkodNo4bTxQXE1kvZiruVUtJLe1bMW1MBBJ",
      used: false,
      operationsCount: 0,
    },
  ],
  bitcoin_cash: [
    {
      derivationMode: "unsplit",
      index: 0,
      seedIdentifier:
        "04238878d371ce61cdd04d22ccab50c542e94ffa7a27d02d6bcefaa22e4fcee6db4c2029fd4de0b595e98002c0be01fc1fbd3568671e394c97a6d52c3d4c113fb5",
      accountPath: "44'/0'/0'",
      xpub: "xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn",
      used: true,
      operationsCount: 41,
    },
    {
      derivationMode: "",
      index: 0,
      seedIdentifier:
        "04884ed3fe628a8487f782f97f38e7a9f014e624f1ea679951cf3a67445ea33fb334f4cc19e6c421b3ef9943d526cd4fbfebacebe8a62cc45db79a33d3ab04bd47",
      accountPath: "44'/145'/0'",
      xpub: "xpub6D7pqJa4V3SFSigcsRaFL2mpfG7469osrMkk4ieR2uk8y1v3nuQUD8W8v36PLWQtVRSggSQM7jLpGNKH7sqCaoPSJEp9wZCVkRnMWoiUUXa",
      used: true,
      operationsCount: 67,
    },
    {
      derivationMode: "",
      index: 1,
      seedIdentifier:
        "04884ed3fe628a8487f782f97f38e7a9f014e624f1ea679951cf3a67445ea33fb334f4cc19e6c421b3ef9943d526cd4fbfebacebe8a62cc45db79a33d3ab04bd47",
      accountPath: "44'/145'/1'",
      xpub: "xpub6D7pqJa4V3SFVc2TjqQaz1N6gCs5vTjznBSAyEE9es1j5nTb2uKXbihXQuaUURKJ59hEVQZctuCSC8t1MURbeiSmZFDTBsJ9QJCS5crNrBG",
      used: false,
      operationsCount: 0,
    },
  ],
  bitcoin_gold: [
    {
      derivationMode: "unsplit",
      index: 0,
      seedIdentifier:
        "04238878d371ce61cdd04d22ccab50c542e94ffa7a27d02d6bcefaa22e4fcee6db4c2029fd4de0b595e98002c0be01fc1fbd3568671e394c97a6d52c3d4c113fb5",
      accountPath: "44'/0'/0'",
      xpub: "xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn",
      used: true,
      operationsCount: 6,
    },
    {
      derivationMode: "segwit_unsplit",
      index: 0,
      seedIdentifier:
        "0412f62e549eee10ea7df9c9b1acfa6d77abb7424c057d7d725f418e2124dcd8662e21fde9e0b5a4cb731933a68ca406f6efcdadc8fb52afdb9ae422a68cfe5bde",
      accountPath: "49'/0'/0'",
      xpub: "xpub6CKb86o7RHSCxuwP5dnxyDySLbnVWypQUxhWpycFZWFTzXuXy3UgGtG3o51oGER6X2UY6zRqd5AXgzNghb9va1FkfzXz6k1RT6EwTwCKejE",
      used: true,
      operationsCount: 7,
    },
    {
      derivationMode: "segwit",
      index: 0,
      seedIdentifier:
        "04465a1e085f90dd90d6aaae53fe772371d8e8f60e93b68d4b5e4ebe345e8bcdd4adc5b0ffc9047859a33f3944220203bd093cf24e0dd22342b580c7f66c3971b0",
      accountPath: "49'/156'/0'",
      xpub: "xpub6CtTgvCAvB8VFH5iab8qc8GcXAQ3qfBGEJkedBrEH414ND1mpFzp6PhQP5m74Uzqb4o51KnXYK6KEiL51XbrwYa6WE1jxzwuCQa7GV88MHa",
      used: true,
      operationsCount: 13,
    },
    {
      derivationMode: "segwit",
      index: 1,
      seedIdentifier:
        "04465a1e085f90dd90d6aaae53fe772371d8e8f60e93b68d4b5e4ebe345e8bcdd4adc5b0ffc9047859a33f3944220203bd093cf24e0dd22342b580c7f66c3971b0",
      accountPath: "49'/156'/1'",
      xpub: "xpub6CtTgvCAvB8VJZVpJsSueoPyDoWwXtQf1P49q3kTaSoCe6ELeGtyJVtQ9qikkuPyTUrm5MpN2yw2Muhyd2tWnazehh6616Gajsp4FqwsisA",
      used: false,
      operationsCount: 0,
    },
    {
      derivationMode: "",
      index: 0,
      seedIdentifier:
        "04ff80c3dcdf1aa6c92a101510dd9b830718875670fb593a7dd399a2d52af4816142b2f9072f6b025bd95a2638ed76209eff811b9308c272daafed4cf262a54f5a",
      accountPath: "44'/156'/0'",
      xpub: "xpub6C5kqm418Wut5RFaiKvcBznC1MC6oHi6G8RZ1xRVbQbNDSkpUTzkgZ9Z43RtC5ptHBV3AMqycVS2tHhmmxmqWorswc3796CMHTSCg5AJXnx",
      used: true,
      operationsCount: 4,
    },
    {
      derivationMode: "",
      index: 1,
      seedIdentifier:
        "04ff80c3dcdf1aa6c92a101510dd9b830718875670fb593a7dd399a2d52af4816142b2f9072f6b025bd95a2638ed76209eff811b9308c272daafed4cf262a54f5a",
      accountPath: "44'/156'/1'",
      xpub: "xpub6C5kqm418Wut6kFDfmmLTnHvyBCLjJJYyvDmDJW8dzLVZ93Y9rWrjuUp4iecWCFUqLNiLF28awmMngyCQ7c4WywHsWKZ1VEbd66UP5uFTx6",
      used: false,
      operationsCount: 0,
    },
  ],
  dash: [
    {
      derivationMode: "",
      index: 0,
      seedIdentifier:
        "04b86738cee704df2efcbe8da0c8021dd8bff53a2b95a4f5ca586cd8b26af2e79f7be8cb35b62bad7560807414d8e80363f917d1c3cd6d5d10f8c8df347a463c5c",
      accountPath: "44'/5'/0'",
      xpub: "drkvjRicQKXd21b4fiTjSfm4SMoVE5q6DhCopUQ4pBYU9WT1dTVSUHoF91sfFkfgR9MdXqiPGgpNV45VrGFrVfVGn8vH7jroquD34qyYuHbj6Dk",
      used: true,
      operationsCount: 21,
    },
    {
      derivationMode: "",
      index: 1,
      seedIdentifier:
        "04b86738cee704df2efcbe8da0c8021dd8bff53a2b95a4f5ca586cd8b26af2e79f7be8cb35b62bad7560807414d8e80363f917d1c3cd6d5d10f8c8df347a463c5c",
      accountPath: "44'/5'/1'",
      xpub: "drkvjRicQKXd21b4iYXbeKjiBPLHQyqeriXcjUL6HxiLnMbLkC6w2teZTgxpjSv4tZ4gq5KrNan9c9aPtrkUhRF3aBQa4vr3WGy6z1WwQh5GB7W",
      used: true,
      operationsCount: 20,
    },
    {
      derivationMode: "",
      index: 2,
      seedIdentifier:
        "04b86738cee704df2efcbe8da0c8021dd8bff53a2b95a4f5ca586cd8b26af2e79f7be8cb35b62bad7560807414d8e80363f917d1c3cd6d5d10f8c8df347a463c5c",
      accountPath: "44'/5'/2'",
      xpub: "drkvjRicQKXd21b4iybA3Ujpe4BxxrvMPEBs5W1vrHeGK4tFU6uZixaCzJ8Jq4C3yXdKmMnW45JvZ6nnuzSBevrtvh9GdRU6soFJhgGHBKtwboC",
      used: false,
      operationsCount: 0,
    },
  ],
  decred: [
    {
      derivationMode: "",
      index: 0,
      seedIdentifier:
        "045542c1076de9cc128a3cb5eed33d80a916072031a71ebe3c5b77b2a71adf44468e4b657ee017692092ef75f5b61c973e96aea5f6270caac8732d2ad226ffca14",
      accountPath: "44'/42'/0'",
      xpub: "dpubZFDVCCdFkBeuZXSf8dL49fG3zb6vqnE7wLixKRiHpiCAirvNh53N28DAHmqybRLgCZMgVDgrFBrTqNZZJppZ8QgDqxY6vtD4aJ1nNjUYnhT",
      used: true,
      operationsCount: 102,
    },
    {
      derivationMode: "",
      index: 1,
      seedIdentifier:
        "045542c1076de9cc128a3cb5eed33d80a916072031a71ebe3c5b77b2a71adf44468e4b657ee017692092ef75f5b61c973e96aea5f6270caac8732d2ad226ffca14",
      accountPath: "44'/42'/1'",
      xpub: "dpubZFDVCCdFkBeubksrzFQXDzcn7nVB3uFKUAj17LfCijBm4SyCTPb2mbAbYqtrotmWjiZPigWTEePwzgXLUx1fT2UN6n5NfC2WtBPx7e3pAhN",
      used: true,
      operationsCount: 91,
    },
    {
      derivationMode: "",
      index: 2,
      seedIdentifier:
        "045542c1076de9cc128a3cb5eed33d80a916072031a71ebe3c5b77b2a71adf44468e4b657ee017692092ef75f5b61c973e96aea5f6270caac8732d2ad226ffca14",
      accountPath: "44'/42'/2'",
      xpub: "dpubZFDVCCdFkBeufRYVfDcs6YcRsGkepqD2uyJk8DDxhsjSo1TETDoxjqY9fdoYjBU2W93Sdxyy1vVj4vzJTiKuLBEAUSpPTDU1jVGoq1oX8f1",
      used: true,
      operationsCount: 13,
    },
    {
      derivationMode: "",
      index: 3,
      seedIdentifier:
        "045542c1076de9cc128a3cb5eed33d80a916072031a71ebe3c5b77b2a71adf44468e4b657ee017692092ef75f5b61c973e96aea5f6270caac8732d2ad226ffca14",
      accountPath: "44'/42'/3'",
      xpub: "dpubZFDVCCdFkBeufxc7PWg8o1L6oBJKRk7wUhNMLDDm1Pxg9D9eyCR3EB6kas2Uuqwx6236oauPDLQ5r5AwPS43Byt7UPbgeiZ2oxZ97sGmA6S",
      used: false,
      operationsCount: 0,
    },
  ],
  digibyte: [
    {
      derivationMode: "native_segwit",
      index: 0,
      seedIdentifier:
        "044e2d9a5ef3b18f29447cd8583e9ced0d0ea56c70d1f4b78689b007428903be309e1c7b5ee9f1350b0a32812904d46269d520128a606ee0b2774aecb0370c4e52",
      accountPath: "84'/20'/0'",
      xpub: "xpub6CV98T6ompjUmKuMaULsw4UP8yfnVCg6831rWdcPjScn6RaGWrt3b7uvTpt9hcq6tLtS1dGNzeJ9x4NpVGzLq7CFscxCdoPZ6zxkqGymx98",
      used: true,
      operationsCount: 8,
    },
    {
      derivationMode: "native_segwit",
      index: 1,
      seedIdentifier:
        "044e2d9a5ef3b18f29447cd8583e9ced0d0ea56c70d1f4b78689b007428903be309e1c7b5ee9f1350b0a32812904d46269d520128a606ee0b2774aecb0370c4e52",
      accountPath: "84'/20'/1'",
      xpub: "xpub6CV98T6ompjUo2YMbNNwkK6t2xQ9ZMihM54xFopW9896ztmAA6haNfNFuFQY3JLrCmKUAdRbYn1sqUUN7aVSVBPRqCdYX9uoroNUWTLFUU1",
      used: false,
      operationsCount: 0,
    },
    {
      derivationMode: "segwit",
      index: 0,
      seedIdentifier:
        "04f5b072bf6220a4788ff43ee9b0b12bc18384bbf5348883f307ee5b3516ba50caaef64ab0635c753c0afebe4c1a8a3f318a427dbd3ac20a6bdce014ebe23a463b",
      accountPath: "49'/20'/0'",
      xpub: "xpub6CU9cUEYPkHVCSCuHWM9g7TxhmXByzPJGU3k9W588wNearJ1xjPjS5PW3fkYUaYRHgkaFx352YQTyWwZD7qbR8yMaac6K8UeV9XjydgBnkv",
      used: true,
      operationsCount: 35,
    },
    {
      derivationMode: "segwit",
      index: 1,
      seedIdentifier:
        "04f5b072bf6220a4788ff43ee9b0b12bc18384bbf5348883f307ee5b3516ba50caaef64ab0635c753c0afebe4c1a8a3f318a427dbd3ac20a6bdce014ebe23a463b",
      accountPath: "49'/20'/1'",
      xpub: "xpub6CU9cUEYPkHVFw3jvQ3epUkHpqpN7NS9eFFbS57WynDvmzqcBtdAY5uvaLCS7QakFN7uJiQLWLZz56tPAwqQq8LFXqorVMgK9r4Ev2Sg2Eu",
      used: true,
      operationsCount: 2,
    },
    {
      derivationMode: "segwit",
      index: 2,
      seedIdentifier:
        "04f5b072bf6220a4788ff43ee9b0b12bc18384bbf5348883f307ee5b3516ba50caaef64ab0635c753c0afebe4c1a8a3f318a427dbd3ac20a6bdce014ebe23a463b",
      accountPath: "49'/20'/2'",
      xpub: "xpub6CU9cUEYPkHVHnMTPxCWhA59f6GbHCrop6j1RXbZKFZg8ES9eCamW26rWEji2zmXhRBLc2xxTVcD7qxKHKe99XyWwn4udqDBeTzRysURXRR",
      used: false,
      operationsCount: 0,
    },
    {
      derivationMode: "",
      index: 0,
      seedIdentifier:
        "04f84e496b260969a531d4f3a8d47ce995a27cd99c9d59f7955147f6310d23766dd3dfa64d18f8716b9ac9e977b9f14eb83d9a8470e9545796a8a210c9e0854cb6",
      accountPath: "44'/20'/0'",
      xpub: "xpub6DUeEdRmKaQSJnJBJURNcg4ss2fsjQvPFLkgQdmDsJ6aH9FJjurpgt3jxMbs2n3ctHsDYztMWiZ7H27wLRevnkFggwK8HVyKZf5Kij3PjuG",
      used: true,
      operationsCount: 28,
    },
    {
      derivationMode: "",
      index: 1,
      seedIdentifier:
        "04f84e496b260969a531d4f3a8d47ce995a27cd99c9d59f7955147f6310d23766dd3dfa64d18f8716b9ac9e977b9f14eb83d9a8470e9545796a8a210c9e0854cb6",
      accountPath: "44'/20'/1'",
      xpub: "xpub6DUeEdRmKaQSNaZhYGoVZBaP42H4hCNdJTpQzFztxBiqfD1GMCds4v8LENpHYCTU1Am9NDVmswJkNrahKpQ24GTBugvqzCgk9aUNUEYMtFj",
      used: false,
      operationsCount: 0,
    },
  ],
  dogecoin: [
    {
      derivationMode: "",
      index: 0,
      seedIdentifier:
        "0416cc9a6e8e778fb11883b788f886766aecf972f34e10350e394d3dddf90b2d2297487eed3c0d53289c95d61616f258e76a8bb9f17cfef6512d390b90424ab8ab",
      accountPath: "44'/3'/0'",
      xpub: "dgub8rBqrhN2grbuDNuFBCu9u9KQKgQmkKaa15Yvnf4YznmvqFZByDPJypigogDKanefhrjj129Ek1W13zvtyQSD6HDpzxyskJvU6xmhD29S9eF",
      used: true,
      operationsCount: 14,
    },
    {
      derivationMode: "",
      index: 1,
      seedIdentifier:
        "0416cc9a6e8e778fb11883b788f886766aecf972f34e10350e394d3dddf90b2d2297487eed3c0d53289c95d61616f258e76a8bb9f17cfef6512d390b90424ab8ab",
      accountPath: "44'/3'/1'",
      xpub: "dgub8rBqrhN2grbuFeMR47KiFwZWqV6A6kmKQ5F73eKwpLqT8Wmj7P4gmuAUbEHJxVr5qkfaUN2kmYsD4pPTQbkUtTqk7dtpGcWWTLC7F1ACS1u",
      used: true,
      operationsCount: 11,
    },
    {
      derivationMode: "",
      index: 2,
      seedIdentifier:
        "0416cc9a6e8e778fb11883b788f886766aecf972f34e10350e394d3dddf90b2d2297487eed3c0d53289c95d61616f258e76a8bb9f17cfef6512d390b90424ab8ab",
      accountPath: "44'/3'/2'",
      xpub: "dgub8rBqrhN2grbuGtVSoWKrKi97gHrA1eV6XQtR9AKFgG2BP3pQ12ncpkTBPmKGSU7xTd28RpYZFkUryG9PBFStcdCuHVCtAfLmi8NhTF8PRGY",
      used: false,
      operationsCount: 0,
    },
  ],
  litecoin: [
    {
      derivationMode: "native_segwit",
      index: 0,
      seedIdentifier:
        "045e6b1f8055c0b1b54e35cfe61793cdf492d153ecd4184f16e0d50286750b78940bd4bf3f55072bd3c5f665b106979b562e4f55d5c19dafac72022bb9e869c506",
      accountPath: "84'/2'/0'",
      xpub: "Ltub2ZDyeYFtDj5kHy4w5WaXBDE9217rNDYfmv7u5NV8dk8vKdmkqAfPdwRma5rkPcj5daMU8JiiLXQYPX9rtqEzrK1YrmkofcpADTV7s5FgzLF",
      used: true,
      operationsCount: 14,
    },
    {
      derivationMode: "native_segwit",
      index: 1,
      seedIdentifier:
        "045e6b1f8055c0b1b54e35cfe61793cdf492d153ecd4184f16e0d50286750b78940bd4bf3f55072bd3c5f665b106979b562e4f55d5c19dafac72022bb9e869c506",
      accountPath: "84'/2'/1'",
      xpub: "Ltub2ZDyeYFtDj5kL5kYEcBGiDwhXQtZNefG3k4XvAtoMfD5cHxa93WMr6zLGnLb11LCgUXpxWTZRVPv2Roh2vdxesTpgFYayeNNVJb7wmCfD3x",
      used: false,
      operationsCount: 0,
    },
    {
      derivationMode: "segwit",
      index: 0,
      seedIdentifier:
        "04921553e9c4ff6ef39e98f2e8a7719d76e6ecdc67cbb65dcdfd4d04b7e0386524daf087032c6a2ab4280d343d8f4d086e1ef78d9acc1e2464282feb75abf624aa",
      accountPath: "49'/2'/0'",
      xpub: "Ltub2ZoEDG8AmPfD8oGoFEvfsKWjeyiXh6TiKYjgLnoVxfeECfQteY6sDF1AuH1iW6ekue2PSwdbbvG2NpFPzLqcgNgteHZPNo6zGthjcAmwxT3",
      used: true,
      operationsCount: 53,
    },
    {
      derivationMode: "segwit",
      index: 1,
      seedIdentifier:
        "04921553e9c4ff6ef39e98f2e8a7719d76e6ecdc67cbb65dcdfd4d04b7e0386524daf087032c6a2ab4280d343d8f4d086e1ef78d9acc1e2464282feb75abf624aa",
      accountPath: "49'/2'/1'",
      xpub: "Ltub2ZoEDG8AmPfDAyu3yK2WfA9zE8VgL3E3nNjnS5VRYAo7LfrrEmaCUYqWP8tgo6vNWc7dsr3kDykaX7yDpkAN93RWorZG6tekiyNpBNtFJhc",
      used: true,
      operationsCount: 2,
    },
    {
      derivationMode: "segwit",
      index: 2,
      seedIdentifier:
        "04921553e9c4ff6ef39e98f2e8a7719d76e6ecdc67cbb65dcdfd4d04b7e0386524daf087032c6a2ab4280d343d8f4d086e1ef78d9acc1e2464282feb75abf624aa",
      accountPath: "49'/2'/2'",
      xpub: "Ltub2ZoEDG8AmPfDCKLYi3GHWexWa26tL5G4QvPkYgdRNKFKLsDe1i3rzjSZiBYDpYnkgQn9T8GRRJTXF8rdG6NXyWR9wTzATChRQbixYxnjKBg",
      used: false,
      operationsCount: 0,
    },
    {
      derivationMode: "",
      index: 0,
      seedIdentifier:
        "04fb4805746848cbf5abdf143659a6ceb5ed0f894bd2a0a76a881b03e2f9be00d910c746046fdd40c1ad48b6b0479c4410248f6d3d625793865e13ff3f9bcc861f",
      accountPath: "44'/2'/0'",
      xpub: "Ltub2YRPRjnvZVoBBbfDrEV3jJdGQCTMHgKg1V1mnAZuQbbSY6XPhufcRTpoGB4595dUuW1GSDy6CApUYmCfwA4YjG5JWrAFd4GBR1WRJ8Jm6cM",
      used: true,
      operationsCount: 31,
    },
    {
      derivationMode: "",
      index: 1,
      seedIdentifier:
        "04fb4805746848cbf5abdf143659a6ceb5ed0f894bd2a0a76a881b03e2f9be00d910c746046fdd40c1ad48b6b0479c4410248f6d3d625793865e13ff3f9bcc861f",
      accountPath: "44'/2'/1'",
      xpub: "Ltub2YRPRjnvZVoBD5RZpkoyuuiSPJdHS8jeDksZHPtt5RraJFHLDSRdobd1gfBrPKZHx1Nag5nUBuuA95LkNMXbZ6fnFHCotsewEdqccigYadD",
      used: false,
      operationsCount: 0,
    },
  ],
  zencash: [
    {
      derivationMode: "",
      index: 0,
      seedIdentifier:
        "04ecf3eb0c3454436fd414da75eafad95896209052eef81b06860cc6c14731963e63ae744577e35b51d4e40ebb4366e59e2a20f571384384bfcb804444db6a83d7",
      accountPath: "44'/121'/0'",
      xpub: "xpub6D5t3ggLE75WLn8cMhJ6V5tdZsT5ixJDjoYrERnYgkjXe5f2qqBBsjCLJ4ktGeorZBrSwQZ6tRqmmu9CM5fpi6S7n1T6VMxitE4LnXBStue",
      used: true,
      operationsCount: 130,
    },
    {
      derivationMode: "",
      index: 1,
      seedIdentifier:
        "04ecf3eb0c3454436fd414da75eafad95896209052eef81b06860cc6c14731963e63ae744577e35b51d4e40ebb4366e59e2a20f571384384bfcb804444db6a83d7",
      accountPath: "44'/121'/1'",
      xpub: "xpub6D5t3ggLE75WMZywf9sHZtBZcgdQTvVorb4U6YiYBSZrWiPZsB7JjjyMfyM7KiSQMwc87BLZSi8wXgoRvMZHVACMF7CBE3B77NN314ZKWuA",
      used: true,
      operationsCount: 128,
    },
    {
      derivationMode: "",
      index: 2,
      seedIdentifier:
        "04ecf3eb0c3454436fd414da75eafad95896209052eef81b06860cc6c14731963e63ae744577e35b51d4e40ebb4366e59e2a20f571384384bfcb804444db6a83d7",
      accountPath: "44'/121'/2'",
      xpub: "xpub6D5t3ggLE75WQGWU8XaFEiYXbgQFJD3u6eyN1Yb7gcRu4Gan7uKEwqaCBoRhFs73nN1Kf51D5W7kx6TRLpDmwWgeDEk6mghh4gPA3BZbNvg",
      used: false,
      operationsCount: 0,
    },
  ],
};

const sumOfOperations = (account: Account): string => {
  return account.operations
    .reduce((sum, operation) => sum.plus(getOperationAmountNumber(operation)), new BigNumber(0))
    .toString();
};

describe.each(Object.entries(EXPECTED_ACCOUNTS))(
  "bitcoin family currency bridge scanAccounts on %s (integration)",
  (currencyId, expectedAccounts) => {
    let accounts: Account[];

    beforeAll(async () => {
      accounts = await scanWithRecordedDevice(currencyId);
    }, 360_000);

    it("discovers the used accounts followed by an unused one for every derivation mode", () => {
      expect(
        accounts.map(account => ({
          id: account.id,
          derivationMode: account.derivationMode,
          index: account.index,
          used: account.used,
        })),
      ).toEqual(
        expectedAccounts.map(expected => ({
          id: `js:2:${currencyId}:${expected.xpub}:${expected.derivationMode}`,
          derivationMode: expected.derivationMode,
          index: expected.index,
          used: expected.used,
        })),
      );
    });

    it("derives the fresh address path from the account path", () => {
      expect(accounts.map(account => account.freshAddressPath)).toEqual(
        expectedAccounts.map(expected =>
          expect.stringMatching(new RegExp(`^${expected.accountPath}/0/\\d+$`)),
        ),
      );
    });

    it("keeps at least the operations already known", () => {
      expect(
        accounts.map((account, i) =>
          Math.max(0, expectedAccounts[i].operationsCount - account.operationsCount),
        ),
      ).toEqual(expectedAccounts.map(() => 0));
    });

    it("derives the seed identifier of every account from the device", () => {
      expect(accounts.map(account => account.seedIdentifier)).toEqual(
        expectedAccounts.map(expected => expected.seedIdentifier),
      );
    });

    it("has no unconfirmed account", () => {
      expect(accounts.map(account => isAccountBalanceUnconfirmed(account))).toEqual(
        accounts.map(() => false),
      );
    });

    it("creates no account after its oldest operation", () => {
      const lateCreations = accounts.flatMap(account =>
        account.operations
          .slice(-1)
          .map(operation => account.creationDate.getTime() - operation.date.getTime())
          .filter(delay => delay > 0),
      );

      expect(lateCreations).toEqual([]);
    });

    it("has no NaN balance, operation value or operation fee", () => {
      const nanValues = accounts.flatMap(account => [
        account.balance.isNaN(),
        ...account.operations.map(operation => operation.value.isNaN() || operation.fee.isNaN()),
      ]);

      expect(nanValues.filter(isNaNValue => isNaNValue)).toEqual([]);
    });

    it("keeps the balances within their boundaries", () => {
      const outOfBoundaries = accounts.filter(
        account =>
          account.balance.lt(0) ||
          account.spendableBalance.lt(0) ||
          account.spendableBalance.gt(account.balance),
      );

      expect(outOfBoundaries.map(account => account.id)).toEqual([]);
    });

    it("has no operation duplicated by id", () => {
      expect(
        accounts.map(account => new Set(account.operations.map(operation => operation.id)).size),
      ).toEqual(accounts.map(account => account.operations.length));
    });

    it("estimates a maximum spendable amount between zero and the spendable balance", async () => {
      const bitcoinAccounts = accounts.filter(isBitcoinAccount);

      const estimations = await Promise.all(
        bitcoinAccounts.map(account => bridge.accountBridge.estimateMaxSpendable({ account })),
      );

      expect({
        scannedAccounts: bitcoinAccounts.length,
        withinBoundaries: estimations.map(
          (estimation, i) =>
            estimation.gte(0) && estimation.lte(bitcoinAccounts[i].spendableBalance),
        ),
      }).toEqual({
        scannedAccounts: accounts.length,
        withinBoundaries: accounts.map(() => true),
      });
    });

    it("sets a balance that is the sum of the operations amounts", () => {
      expect(accounts.map(account => account.balance.toString())).toEqual(
        accounts.map(sumOfOperations),
      );
    });
  },
);
