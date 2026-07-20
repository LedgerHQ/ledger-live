export type CardScreenViewModel = {
  readonly description: string;
  readonly title: string;
};

export function useCardScreenViewModel(): CardScreenViewModel {
  return {
    title: "Card",
    description: "Login to access your card",
  };
}
