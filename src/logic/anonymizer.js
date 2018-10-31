// @flow

export default {
  url: (url: string): string =>
    url
      .replace(/\/addresses\/[^/]+/g, "/addresses/<HIDDEN>")
      .replace(/blockHash=[^&]+/g, "blockHash=<HIDDEN>"),
};
