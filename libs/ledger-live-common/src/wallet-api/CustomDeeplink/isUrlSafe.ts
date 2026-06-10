export const ALLOWED_PROTOCOLS = ["http:", "https:", "ledgerlive:", "ledgerwallet:", "mailto:"];

export const isUrlSafe = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return ALLOWED_PROTOCOLS.includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};
