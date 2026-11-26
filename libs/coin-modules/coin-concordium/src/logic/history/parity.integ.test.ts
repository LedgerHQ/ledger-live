import { concordiumDefaults } from "../../config";
import { blockEffect, listedEffect } from "../../test/historyParity";
import { getBlock } from "./getBlock";
import { listOperations } from "./listOperations";

const MAINNET = "concordium";
const config = concordiumDefaults[MAINNET];

describe("listOperations and getBlock report a transaction alike", () => {
  it.each([
    {
      kind: "contract deposit",
      account: "3iZVPmcZLomKLdunJsrTmZ98xoqNWfVENcgCDzZ48JMvqrcSdV",
      height: 1610907,
      type: "OUT",
      hash: "50cb75078abe583e29dd215cb8ff69efb36ce4801842df33ede0ee53bbf61f0a",
    },
    {
      kind: "contract payout",
      account: "4DAERy94ScrVZQPLyqV9bGF9kT8kDSUS8M5Y4EpmfvCe2gjFnb",
      height: 29889771,
      type: "IN",
      hash: "65e1814ec44ccf89af447ebbb3bb74d6b407944028db9d10ff7da96527f6ccde",
    },
    {
      kind: "contract call without CCD",
      account: "38F4QH75Z2ajJ4e5jPuHRwBDfpreowyWwNnU62fGo7s8jUqUBw",
      height: 47734145,
      type: "FEES",
      hash: "449caac7b761cd6aae22b021a18e0bdc06a01c8b3b0e2a5f2cad106c3ba5f8ba",
    },
    {
      kind: "contract call it sponsored",
      account: "38F4QH75Z2ajJ4e5jPuHRwBDfpreowyWwNnU62fGo7s8jUqUBw",
      height: 47772682,
      type: "FEES",
      hash: "6433a1baaeed8cf1f8bbc1cc93d5931304e0cfd16b45a3abb48a740490f46072",
    },
    {
      kind: "rejected contract call",
      account: "468jABeGn4TsYTM64ochTiShtxLLizT8ZFxkjwmQb33UuHhvMg",
      height: 1612300,
      type: "FEES",
      hash: "9e6dea8066d2b01c74f1b50d890fa52907a14704ff50a2afda35b73225b3cd98",
    },
    {
      kind: "contract initialization",
      account: "4rc1tjHwkFB5JP39rcEeRqsh1gMJZerjjDpWoqqTY6VHy2WZgj",
      height: 1390584,
      type: "FEES",
      hash: "e41c11aeee800b50d4e748f53c6fbd17e82d25add0c8c037d69a8fdb9877c838",
    },
    {
      kind: "registered data",
      account: "3Bd2m1js7XQgt2cqsH27E43JXmCRDdzbWWtGjC3QtUVFRg83ya",
      height: 880602,
      type: "FEES",
      hash: "f05c49d701a8a9358d4f83df59f2168bdf6d29f13b232e6c185889be769acd4e",
    },
    {
      kind: "scheduled transfer received",
      account: "4DAERy94ScrVZQPLyqV9bGF9kT8kDSUS8M5Y4EpmdsqWLiz8iu",
      height: 45055575,
      type: "IN",
      hash: "842662c35339b6cf87f821d194f1733217eca97fb3c131610a08b452767075fa",
    },
    {
      kind: "scheduled transfer sent",
      account: "48XPY79hpqAxFKzDr6gv2CGuLaUGnynbYW6W7uzybcs71QME2u",
      height: 45055575,
      type: "OUT",
      hash: "842662c35339b6cf87f821d194f1733217eca97fb3c131610a08b452767075fa",
    },
    {
      kind: "shielded amount",
      account: "2zCijc5JkoFXx2zPR27UPMaBAj9oXyAQqisxrg98bYnYp9mt7E",
      height: 1573304,
      type: "OUT",
      hash: "6909cf9f6e969748a33eb2f4523c33172b09e3afc73eef6021674e55f1125c24",
    },
    {
      kind: "unshielded amount",
      account: "3D24qjNcgo15P1FveWmyf1KNFS2syskAf5LvVdoMTzD7Ge6nvd",
      height: 1621727,
      type: "IN",
      hash: "d63656010a2531b69a23b0416a2d974ae225875789317765e8ffa34aee3756b1",
    },
    {
      kind: "encrypted transfer sent",
      account: "4eaqExmhTFNmxTMbsYDrNBu8wAKFZD2ieMLXUihXgVHTFdFGeF",
      height: 1608539,
      type: "FEES",
      hash: "d982a1d5d756f9cee7731fb5221eb6938d53bf826f4dd3d09b92956c906d3a64",
    },
  ] as const)("$kind", async ({ account, height, type, hash }) => {
    const [page, block] = await Promise.all([
      listOperations(config, account, { minHeight: height, order: "asc", limit: 20 }, MAINNET),
      getBlock(config, height, MAINNET),
    ]);

    const listed = page.items.find(op => op.hash === hash);
    const tx = block.transactions.find(candidate => candidate.hash === hash);
    if (!listed || !tx) throw new Error(`transaction ${hash} is missing on one side`);

    expect(listed.type).toBe(type);
    expect(listedEffect(listed)).toEqual(blockEffect(tx, account));
  });
});
