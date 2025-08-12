const NUMBER_OF_MONTHS = 3;
const MILLISECONDS_IN_A_MONTH = 30 * 24 * 60 * 60 * 1000;

export const cutoffDate = () => Date.now() - NUMBER_OF_MONTHS * MILLISECONDS_IN_A_MONTH;

export const generateAnonymousId = () => {
  return "anonymous_id_" + (Math.floor(Math.random() * 20) + 1);
};

export const getOldCampaignIds = (campaigns: Record<string, number>) => {
  const timeAgo = cutoffDate();
  return Object.entries(campaigns)
    .filter(([_, timestamp]) => timestamp < timeAgo)
    .map(([id, _]) => id);
};
