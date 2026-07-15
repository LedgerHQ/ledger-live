export type CardParams = Readonly<{
  platform: string;
  name: string;
  path?: string;
}>;

export type CardState = Readonly<{
  isOpen: boolean;
  params: CardParams | null;
}>;
