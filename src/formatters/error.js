//@flow

export default (error: ?Error | string) => {
  if (typeof error === "string") return error;
  const genStr = ((error && error.message) || "").toString();
  // u2f-api lib https://github.com/grantila/u2f-api/blob/1e75b41fd5d9d001e6ad2be2eda6b9b41d137a81/lib/u2f-api.js#L98
  if (error && typeof error.metaData === "object" && error.metaData) {
    const metaData = error.metaData;
    return genStr + ": " + String(metaData.type);
  }
  return genStr;
};
