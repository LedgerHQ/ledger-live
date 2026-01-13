/**
 * Generic Registry class following the Registry pattern
 */
export class Registry<T> {
  private items: Map<string, T> = new Map();

  register(id: string, item: T): void {
    this.items.set(id, item);
  }

  get(id: string): T | undefined {
    return this.items.get(id);
  }

  unregister(id: string): boolean {
    return this.items.delete(id);
  }

  has(id: string): boolean {
    return this.items.has(id);
  }

  clear(): void {
    this.items.clear();
  }

  size(): number {
    return this.items.size;
  }

  keys(): string[] {
    return Array.from(this.items.keys());
  }
}
