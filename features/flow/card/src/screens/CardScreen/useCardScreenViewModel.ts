export type CardScreenViewModel = {
  readonly description: string;
  readonly title: string;
};

export function useCardScreenViewModel(): CardScreenViewModel {
  return {
    title: "Card playground",
    description: "Card flow scaffold by design system",
  };
}
