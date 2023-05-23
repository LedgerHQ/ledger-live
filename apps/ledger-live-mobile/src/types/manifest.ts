export type Manifest =
  | {
      id: string;
      name: string;
      params?: {
        dappUrl?: string;
      };
    }
  | undefined;
