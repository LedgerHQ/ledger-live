export function copyToClipboard(value: string): void {
  void navigator.clipboard.writeText(value);
}
