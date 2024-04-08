export const generateAnonymousId = () => {
  return "anonymous_id_" + Math.floor(Math.random() * 21);
};

export const getOldCampaignIds = (campaigns: Record<string, number>) => {
  const threeMonthsAgo = Date.now() - 3 * 30 * 24 * 60 * 60 * 1000;
  return Object.entries(campaigns)
    .filter(([_, timestamp]) => timestamp < threeMonthsAgo)
    .map(([id, _]) => id);
};
