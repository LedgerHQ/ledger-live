import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { languageSelector } from "~/renderer/reducers/settings";
import { urls } from "./urls";

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

/**
 *
 * @param key
 * @returns the correct url based on language
 */
export const useDynamicUrl = (
  key: keyof Pick<
    typeof urls,
    "faq" | "terms" | "privacyPolicy" | "contactSupportWebview" | "buyNew" | "genuineCheck"
  >,
): string => {
  const [url, setUrl] = useState(urls[key].en);
  const language = useSelector(languageSelector);

  useEffect(() => {
    setUrl(urls[key][language] || urls[key].en);
  }, [key, language]);

  return url;
};
