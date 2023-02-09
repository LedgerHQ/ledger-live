type CryptopanicAvailableRegions =
  | "en"
  | "de"
  | "nl"
  | "es"
  | "fr"
  | "it"
  | "pt"
  | "ru";

export type CryptopanicNews = {
  kind: "news";
  domain: string;
  source: {
    title: string;
    region: CryptopanicAvailableRegions;
    domain: string;
    path: string | null;
  };
  title: string;
  slug: string;
  currencies: [
    {
      code: string;
      title: string;
      slug: string;
      url: string;
    },
  ];
  id: number;
  url: string;
  // eslint-disable-next-line camelcase
  published_at: string;
  // eslint-disable-next-line camelcase
  created_at: string;
};

export type CryptopanicNewsWithMetadata = CryptopanicNews & {
  description: string;
  image: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type CryptopanicPostsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: CryptopanicNewsWithMetadata[];
};

export function getPosts(_: {
  filter?:
    | "rising"
    | "hot"
    | "bullish"
    | "bearish"
    | "important"
    | "saved"
    | "lol";
  public?: boolean;
  currencies?: [string];
  regions?: [CryptopanicAvailableRegions];
  metadata?: boolean;
  approved?: boolean;
}) {
  return null;
}
