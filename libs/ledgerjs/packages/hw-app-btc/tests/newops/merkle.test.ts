import { Merkle } from "../../src/newops/merkle";
function testHasher(buf: Buffer): Buffer {
  return Buffer.from(buf);
}
function leaf(n: number) {
  return Buffer.from([0, n]);
}
function merkleOf(count: number): Merkle {
  const leaves: Buffer[] = [];
  for (let i = 0; i < count; i++) {
    leaves.push(leaf(i));
  }
  return new Merkle(leaves, testHasher);
}
function rootOfLeaves(...leaves: number[]): Buffer {
  return new Merkle(
    leaves.map((v) => leaf(v)),
    testHasher
  ).getRoot();
}
function rootOf(count: number): Buffer {
  const manuals = [
    "0000000000000000000000000000000000000000000000000000000000000000",
    "0000",
    "0100000001",
    "0101000000010002",
    "0101000000010100020003",
    "0101010000000101000200030004",
  ];
  return Buffer.from(manuals[count], "hex");
}

test("Merkle root of N", () => {
  for (let i = 0; i <= 5; i++) {
    const root = merkleOf(i).getRoot();
    const expectedRoot = rootOf(i);
    expect(root).toEqual(expectedRoot);
  }
});

test("Merkle proof of single", () => {
  const proof = merkleOf(1).getProof(0);
  expect(proof).toEqual([]);
});

test("Merkle proof of two", () => {
  expect(merkleOf(2).getProof(0)).toEqual([rootOfLeaves(1)]);
  expect(merkleOf(2).getProof(1)).toEqual([rootOfLeaves(0)]);
});

test("Merkle proof of three", () => {
  expect(merkleOf(3).getProof(0)).toEqual([rootOfLeaves(1), rootOfLeaves(2)]);
  expect(merkleOf(3).getProof(1)).toEqual([rootOfLeaves(0), rootOfLeaves(2)]);
  expect(merkleOf(3).getProof(2)).toEqual([rootOfLeaves(0, 1)]);
});

test("Merkle proof of four", () => {
  expect(merkleOf(4).getProof(0)).toEqual([
    rootOfLeaves(1),
    rootOfLeaves(2, 3),
  ]);
  expect(merkleOf(4).getProof(1)).toEqual([
    rootOfLeaves(0),
    rootOfLeaves(2, 3),
  ]);
  expect(merkleOf(4).getProof(2)).toEqual([
    rootOfLeaves(3),
    rootOfLeaves(0, 1),
  ]);
  expect(merkleOf(4).getProof(3)).toEqual([
    rootOfLeaves(2),
    rootOfLeaves(0, 1),
  ]);
});
test("Merkle proof of five", () => {
  expect(merkleOf(5).getProof(0)).toEqual([
    rootOfLeaves(1),
    rootOfLeaves(2, 3),
    rootOfLeaves(4),
  ]);
  expect(merkleOf(5).getProof(1)).toEqual([
    rootOfLeaves(0),
    rootOfLeaves(2, 3),
    rootOfLeaves(4),
  ]);
  expect(merkleOf(5).getProof(2)).toEqual([
    rootOfLeaves(3),
    rootOfLeaves(0, 1),
    rootOfLeaves(4),
  ]);
  expect(merkleOf(5).getProof(3)).toEqual([
    rootOfLeaves(2),
    rootOfLeaves(0, 1),
    rootOfLeaves(4),
  ]);
  expect(merkleOf(5).getProof(4)).toEqual([rootOfLeaves(0, 1, 2, 3)]);
});
