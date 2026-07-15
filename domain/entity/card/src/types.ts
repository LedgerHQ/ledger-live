export type CardFlowParams = Readonly<{
  platform: string;
  name: string;
  path?: string;
}>;

export type CardState = Readonly<{
  isOpen: boolean;
  params: CardFlowParams | null;
}>;
