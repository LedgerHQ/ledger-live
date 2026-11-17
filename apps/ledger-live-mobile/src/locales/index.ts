type Catalog = Record<string, unknown>;

// Each catalog is parsed on first read, so a launch only pays for the language it shows.
function lazyCommon(load: () => Catalog): { common: Catalog } {
  return {
    get common() {
      const common = load();
      Object.defineProperty(this, "common", { value: common, writable: true, enumerable: true });
      return common;
    },
  };
}

export const de = lazyCommon(() => require("./de/common.json"));
export const en = lazyCommon(() => require("./en/common.json"));
export const es = lazyCommon(() => require("./es/common.json"));
export const fr = lazyCommon(() => require("./fr/common.json"));
export const ja = lazyCommon(() => require("./ja/common.json"));
export const ko = lazyCommon(() => require("./ko/common.json"));
export const ru = lazyCommon(() => require("./ru/common.json"));
export const tr = lazyCommon(() => require("./tr/common.json"));
export const zh = lazyCommon(() => require("./zh/common.json"));
export const pt = lazyCommon(() => require("./pt-BR/common.json"));
export const ar = lazyCommon(() => require("./ar/common.json"));
export const th = lazyCommon(() => require("./th/common.json"));
