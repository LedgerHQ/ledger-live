import { IndexedTree } from "../IndexedTree";

describe("Indexed tree unit test suite", () => {
  it("should create a new tree with a root", () => {
    const tree = new IndexedTree(0);
    expect(tree.getValue()).toBe(0);
  });

  it("should create a new tree with a root and update the root", () => {
    let tree = new IndexedTree(0);
    tree = tree.updateChild([], 1);
    expect(tree.getValue()).toBe(1);
  });

  it("should create a new tree with a root and update a child", () => {
    let tree = new IndexedTree(0);
    tree = tree.updateChild([1], 1);
    expect(tree.getChild(1)!.getValue()).toBe(1);
  });

  it("should create a tree with multiple children and update a child which had no value before", () => {
    let tree = new IndexedTree(0);
    tree = tree.updateChild([0, 1], 1);
    tree = tree.updateChild([0, 2], 2);

    expect(tree.findChild([0, 1])!.getValue()).toBe(1);
    expect(tree.findChild([0, 2])!.getValue()).toBe(2);
    expect(tree.getChild(0)?.getValue()).toBe(null);

    tree = tree.updateChild([0], 42);
    expect(tree.getChild(0)?.getValue()).toBe(42);
  });

  it("should add a subtree to the tree", () => {
    let tree = new IndexedTree(0);
    tree = tree.addChild([0, 1], new IndexedTree(1));
    tree = tree.addChild([0, 2], new IndexedTree(2));

    let subtree = new IndexedTree(42);
    subtree = subtree.updateChild([0], 43);
    subtree = subtree.updateChild([1], 44);

    tree = tree.addChild([0, 3], subtree);

    expect(tree.findChild([0, 1])!.getValue()).toBe(1);
    expect(tree.findChild([0, 2])!.getValue()).toBe(2);
    expect(tree.findChild([0, 3])!.getValue()).toBe(42);
    expect(tree.findChild([0, 3, 0])!.getValue()).toBe(43);
    expect(tree.findChild([0, 3, 1])!.getValue()).toBe(44);
  });
});
