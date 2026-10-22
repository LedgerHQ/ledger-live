import { isMoodIndexAvailable } from "@features/flow-fear-and-greed";
import { getParsedSystemDeviceLocale } from "~/helpers/systemLocale";

export function useMoodIndexCardViewModel() {
  const { region } = getParsedSystemDeviceLocale();

  return { moodIndexAvailable: isMoodIndexAvailable(region) };
}
