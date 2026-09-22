export type ListReorderOptions = Readonly<{
  onMove: (id: string, toIndex: number) => void;
  disabled?: boolean;
}>;

export type ListReorderState = Readonly<{
  announcement: string;
  keyboardPickedUpId: string | null;
}>;
