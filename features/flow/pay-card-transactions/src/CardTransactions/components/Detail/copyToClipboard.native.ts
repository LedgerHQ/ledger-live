import Clipboard from "@react-native-clipboard/clipboard";

export function copyToClipboard(value: string): void {
  Clipboard.setString(value);
}
