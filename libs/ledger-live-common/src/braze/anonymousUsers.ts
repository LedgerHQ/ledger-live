const numberOfMonths = 3;
const millisecondsInAMonth = 30 * 24 * 60 * 60 * 1000;

export const generateAnonymousId = () => {
  return "anonymous_id_" + (Math.floor(Math.random() * 20) + 1);
};

export const getOldCampaignIds = (campaigns: Record<string, number>) => {
  const timeAgo = Date.now() - numberOfMonths * millisecondsInAMonth;
  return Object.entries(campaigns)
    .filter(([_, timestamp]) => timestamp < timeAgo)
    .map(([id, _]) => id);
};
