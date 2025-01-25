export class IndexedTree<T> {
  private node: T | null;
  private children: Map<number, IndexedTree<T>>;

  constructor(node: T | null, children: Map<number, IndexedTree<T>> = new Map()) {
    this.node = node;
    this.children = children;
  }

  public getHighestIndex(): number {
    return [...this.children.keys()].reduce((a, b) => Math.max(a, b), 0);
  }

  public getChildren(): Map<number, IndexedTree<T>> {
    return this.children;
  }

  public getChild(index: number): IndexedTree<T> | undefined {
    return this.children.get(index);
  }

  public findChild(path: number[]): IndexedTree<T> | undefined {
    if (path.length === 0) {
      return this;
    }
    const index = path[0];
    const rest = path.slice(1);
    if (this.children.has(index)) {
      return this.children.get(index)!.findChild(rest);
    }
    return undefined;
  }

  public getValue(): T | null {
    return this.node;
  }

  /// Update the value of the node, if the node doesn't exist, it will be created
  public updateChild(path: number[], value: T): IndexedTree<T> {
    if (path.length === 0) {
      return new IndexedTree(value, this.children);
    }

    const index = path[0];
    const rest = path.slice(1);
    const children = new Map(this.children);
    if (this.children.has(index)) {
      const subTree = this.children.get(index)!.updateChild(rest, value);
      children.set(index, subTree);
    } else {
      const subTree = new IndexedTree<T>(null).updateChild(rest, value);
      children.set(index, subTree);
    }
    return new IndexedTree(this.node, children);
  }

  /// Adds a subtree to the tree
  public addChild(path: number[], child: IndexedTree<T>): IndexedTree<T> {
    if (path.length === 0) {
      return this;
    }
    if (path.length == 1) {
      const children = new Map(this.children);
      children.set(path[0], child);
      return new IndexedTree(this.node, children);
    }
    const index = path[0];
    const rest = path.slice(1);
    const children = new Map(this.children);

    if (this.children.has(index)) {
      const subTree = this.children.get(index)!.addChild(rest, child);
      children.set(index, subTree);
    } else {
      const subTree = new IndexedTree<T>(null).addChild(rest, child);
      children.set(index, subTree);
    }
    return new IndexedTree(this.node, children);
  }
}
