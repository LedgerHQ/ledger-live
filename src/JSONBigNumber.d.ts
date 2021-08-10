declare global {
  interface Date {
    toJSON(): string | null;
  }
}
