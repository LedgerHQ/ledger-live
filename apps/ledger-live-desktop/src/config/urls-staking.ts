import { useSelector } from "react-redux";
import { languageSelector } from "~/renderer/reducers/settings";

export enum StakingCoin {
  ethereum = "ethereum",
  cosmos = "cosmos",
  tezos = "tezos",
  tron = "tron",
}

export const useStakingUrl = (coin: StakingCoin) => {
  const language = useSelector(languageSelector);

  return `https://www.ledger.com/${language}/staking/staking-${coin}?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=${coin}`;
};
