import type { DerivationMode } from "@ledgerhq/types-live";
import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { getNetworkParameters } from "@ledgerhq/coin-bitcoin/networks";
import { mockDeviceWithAPDUs } from "../../__tests__/test-helpers/mockDevice";
import { resolver, signerContext } from "./setup";
import { SCAN_ACCOUNTS_APDUS } from "./fixtures/scanAccounts.apdus";

const XPUBS: Array<[string, string, string, string]> = [
  [
    "bitcoin",
    "native_segwit",
    "84'/0'/0'",
    "xpub6DEHKg8fgKcb5iYGPLtpBYD9gm7nvym3wwhHVnH3TtogvJGTcApj71K8iTpL7CzdZWAxwyjkZEFUrnLK24zKqgj3EVH7Vg1CD1ujibwiHuy",
  ],
  [
    "bitcoin",
    "taproot",
    "86'/0'/0'",
    "xpub6BvkrmBTnBQMW1tBLgY2H6itSqFh9xGAYLGtR8PsKi762NghTQVUkv5gJ3osjMzaqqcfpKgHm2ov7N67A6njxLG8RSU8WwLVN4F596cDmp6",
  ],
  [
    "bitcoin",
    "segwit",
    "49'/0'/0'",
    "xpub6CKb86o7RHSCxuwP5dnxyDySLbnVWypQUxhWpycFZWFTzXuXy3UgGtG3o51oGER6X2UY6zRqd5AXgzNghb9va1FkfzXz6k1RT6EwTwCKejE",
  ],
  [
    "bitcoin",
    "legacy",
    "44'/0'/0'",
    "xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn",
  ],
  [
    "bitcoin_cash",
    "legacy",
    "44'/145'/0'",
    "xpub6D7pqJa4V3SFSigcsRaFL2mpfG7469osrMkk4ieR2uk8y1v3nuQUD8W8v36PLWQtVRSggSQM7jLpGNKH7sqCaoPSJEp9wZCVkRnMWoiUUXa",
  ],
  [
    "bitcoin_cash",
    "unsplit",
    "44'/0'/0'",
    "xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn",
  ],
  [
    "bitcoin_gold",
    "legacy",
    "44'/156'/0'",
    "xpub6C5kqm418Wut5RFaiKvcBznC1MC6oHi6G8RZ1xRVbQbNDSkpUTzkgZ9Z43RtC5ptHBV3AMqycVS2tHhmmxmqWorswc3796CMHTSCg5AJXnx",
  ],
  [
    "bitcoin_gold",
    "segwit",
    "49'/156'/0'",
    "xpub6CtTgvCAvB8VFH5iab8qc8GcXAQ3qfBGEJkedBrEH414ND1mpFzp6PhQP5m74Uzqb4o51KnXYK6KEiL51XbrwYa6WE1jxzwuCQa7GV88MHa",
  ],
  [
    "bitcoin_gold",
    "unsplit",
    "44'/0'/0'",
    "xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn",
  ],
  [
    "bitcoin_gold",
    "segwit_unsplit",
    "49'/0'/0'",
    "xpub6CKb86o7RHSCxuwP5dnxyDySLbnVWypQUxhWpycFZWFTzXuXy3UgGtG3o51oGER6X2UY6zRqd5AXgzNghb9va1FkfzXz6k1RT6EwTwCKejE",
  ],
  [
    "dash",
    "legacy",
    "44'/5'/0'",
    "drkvjRicQKXd21b4fiTjSfm4SMoVE5q6DhCopUQ4pBYU9WT1dTVSUHoF91sfFkfgR9MdXqiPGgpNV45VrGFrVfVGn8vH7jroquD34qyYuHbj6Dk",
  ],
  [
    "decred",
    "legacy",
    "44'/42'/0'",
    "dpubZFDVCCdFkBeuZXSf8dL49fG3zb6vqnE7wLixKRiHpiCAirvNh53N28DAHmqybRLgCZMgVDgrFBrTqNZZJppZ8QgDqxY6vtD4aJ1nNjUYnhT",
  ],
  [
    "digibyte",
    "native_segwit",
    "84'/20'/0'",
    "xpub6CV98T6ompjUmKuMaULsw4UP8yfnVCg6831rWdcPjScn6RaGWrt3b7uvTpt9hcq6tLtS1dGNzeJ9x4NpVGzLq7CFscxCdoPZ6zxkqGymx98",
  ],
  [
    "digibyte",
    "segwit",
    "49'/20'/0'",
    "xpub6CU9cUEYPkHVCSCuHWM9g7TxhmXByzPJGU3k9W588wNearJ1xjPjS5PW3fkYUaYRHgkaFx352YQTyWwZD7qbR8yMaac6K8UeV9XjydgBnkv",
  ],
  [
    "digibyte",
    "legacy",
    "44'/20'/0'",
    "xpub6DUeEdRmKaQSJnJBJURNcg4ss2fsjQvPFLkgQdmDsJ6aH9FJjurpgt3jxMbs2n3ctHsDYztMWiZ7H27wLRevnkFggwK8HVyKZf5Kij3PjuG",
  ],
  [
    "dogecoin",
    "legacy",
    "44'/3'/0'",
    "dgub8rBqrhN2grbuDNuFBCu9u9KQKgQmkKaa15Yvnf4YznmvqFZByDPJypigogDKanefhrjj129Ek1W13zvtyQSD6HDpzxyskJvU6xmhD29S9eF",
  ],
  [
    "litecoin",
    "native_segwit",
    "84'/2'/0'",
    "Ltub2ZDyeYFtDj5kHy4w5WaXBDE9217rNDYfmv7u5NV8dk8vKdmkqAfPdwRma5rkPcj5daMU8JiiLXQYPX9rtqEzrK1YrmkofcpADTV7s5FgzLF",
  ],
  [
    "litecoin",
    "segwit",
    "49'/2'/0'",
    "Ltub2ZoEDG8AmPfD8oGoFEvfsKWjeyiXh6TiKYjgLnoVxfeECfQteY6sDF1AuH1iW6ekue2PSwdbbvG2NpFPzLqcgNgteHZPNo6zGthjcAmwxT3",
  ],
  [
    "litecoin",
    "legacy",
    "44'/2'/0'",
    "Ltub2YRPRjnvZVoBBbfDrEV3jJdGQCTMHgKg1V1mnAZuQbbSY6XPhufcRTpoGB4595dUuW1GSDy6CApUYmCfwA4YjG5JWrAFd4GBR1WRJ8Jm6cM",
  ],
];

const ADDRESSES: Array<[string, string, string, string]> = [
  ["bitcoin_cash", "legacy", "44'/145'/0'", "1LZru3UChDXkw4aYzn5dFdjvNDrKp3MtiA"],
  ["bitcoin_gold", "legacy", "44'/156'/0'", "GQKMSSXGHiaHoF1Z2T6hEj9e3jQQZcaGGh"],
  ["bitcoin_gold", "segwit", "49'/156'/0'", "AeYje2FzXiAABiDXoY89ghj7YpupqwG5Dj"],
  ["dash", "legacy", "44'/5'/0'", "XiEvPwG7j1qWHXeHSSMyMQ5hJpMDevAN3T"],
  ["decred", "legacy", "44'/42'/0'", "DsfTvYBcZ38unToZ6MZPhgRYYkZo2W2RPrg"],
  ["digibyte", "native_segwit", "84'/20'/0'", "dgb1qdh5nvn6yqdctjz8f7fxpkskntdfyagppvck68v"],
  ["digibyte", "segwit", "49'/20'/0'", "SMbxEduhxATi5Vo2DEMwC8WuE8aoubtCfk"],
  ["digibyte", "legacy", "44'/20'/0'", "DR7G2x3RjKopgrR6s8piGrZj9JwfZppJfS"],
  ["dogecoin", "legacy", "44'/3'/0'", "DAfbcDmVuEjqiFwv6itJTESCUzk8P4H2wE"],
  ["litecoin", "native_segwit", "84'/2'/0'", "ltc1qpx9fcj5qht64vymj469cfyun73tllcch7qeuwq"],
  ["litecoin", "segwit", "49'/2'/0'", "MQ1AaPQHsEVxxxQ93MGfqh8XQDEH1QGBwy"],
  ["litecoin", "legacy", "44'/2'/0'", "LNE2XB6RhTLWGwCax8ct6swZtjpHkfKX84"],
];

const DERIVATION_MODES: Record<string, DerivationMode> = {
  legacy: "",
  segwit: "segwit",
  native_segwit: "native_segwit",
  taproot: "taproot",
  unsplit: "unsplit",
  segwit_unsplit: "segwit_unsplit",
};

const replayDevice = (currencyId: string) =>
  mockDeviceWithAPDUs(SCAN_ACCOUNTS_APDUS[currencyId], { autoSkipUnknownApdu: true });

describe("bitcoin setup with the recorded device answers", () => {
  it.each(XPUBS)(
    "derives the %s %s account xpub of %s through the signer",
    async (currencyId, _mode, accountPath, xpub) => {
      const currency = getCryptoCurrencyById(currencyId);
      const deviceId = await replayDevice(currencyId);

      const derived = await signerContext(deviceId, currency, signer =>
        signer.getWalletXpub({
          path: accountPath,
          xpubVersion: getNetworkParameters(currencyId).xpubVersion.readUInt32BE(0),
        }),
      );

      expect(derived).toEqual(xpub);
    },
  );

  it.each(ADDRESSES)(
    "resolves the first %s %s address of account %s through the resolver",
    async (currencyId, mode, accountPath, address) => {
      const currency = getCryptoCurrencyById(currencyId);
      const transport = await openTransportReplayer(
        RecordStore.fromString(SCAN_ACCOUNTS_APDUS[currencyId], { autoSkipUnknownApdu: true }),
      );

      const result = await resolver(transport, {
        currency,
        path: `${accountPath}/0/0`,
        derivationMode: DERIVATION_MODES[mode],
      });

      expect(result).toMatchObject({ address, path: `${accountPath}/0/0` });
    },
  );
});
