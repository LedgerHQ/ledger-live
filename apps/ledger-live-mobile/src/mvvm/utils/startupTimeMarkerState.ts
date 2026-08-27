let painted = false;
const afterHomeLayoutListeners = new Set<() => void>();

export function afterFirstHomeLayout(cb: () => void): () => void {
  if (painted) {
    cb();
    return () => undefined;
  }
  afterHomeLayoutListeners.add(cb);
  return () => {
    afterHomeLayoutListeners.delete(cb);
  };
}

export function resetStartupTimeMarker(): void {
  painted = false;
}

export function consumeFirstHomeLayout(): boolean {
  if (painted) return false;
  painted = true;
  afterHomeLayoutListeners.forEach(cb => cb());
  afterHomeLayoutListeners.clear();
  return true;
}
