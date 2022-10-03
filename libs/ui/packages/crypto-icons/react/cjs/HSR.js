var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
__export(exports, {
  default: () => HSR_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#56428E";
function HSR({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M8.063 5.625h3.265c-.393.622-.634 1.31-.619 2.055.972.01 1.946.01 2.918 0a3.434 3.434 0 00-.612-2.055h3.288c-.226.475-.61.915-.574 1.472-.015 2.493.005 4.988-.002 7.48.322 0 .648 0 .975.003.237-.473.449-.955.618-1.455.976.025 1.958-.028 2.93.103-.962.83-1.464 2.01-2.09 3.085-2.486.005-4.97-.008-7.458.007-.117.907.442 1.532 1.09 2.055H7.595c.365-.482 1.1-.793 1.023-1.5.025-2.41 0-4.822.008-7.235h2.13v1.485h2.826V9.422h-5.9L6.214 12c.488.86.977 1.719 1.469 2.578h.726v1.735H6.19C5.38 14.873 4.54 13.45 3.75 12v-.002c.793-1.448 1.635-2.87 2.44-4.31.829 0 1.656 0 2.483-.008a3.579 3.579 0 00-.611-2.055zm2.694 7.25v1.703h2.825v-1.703h-2.825zm5.186-5.188h2.212c.606.975 1.023 2.1 1.898 2.88.018.058.05.176.067.233-.934.123-1.88.028-2.823.075-.12-.52-.355-.998-.616-1.455l-.738.002V7.687zm-2.284 8.843c.653.002 1.31 0 1.963-.002-.014.835.57 1.352 1.143 1.847h-4.227c.542-.515 1.176-1.003 1.121-1.845z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M8.063 5.625h3.265c-.393.622-.634 1.31-.619 2.055.972.01 1.946.01 2.918 0a3.434 3.434 0 00-.612-2.055h3.288c-.226.475-.61.915-.574 1.472-.015 2.493.005 4.988-.002 7.48.322 0 .648 0 .975.003.237-.473.449-.955.618-1.455.976.025 1.958-.028 2.93.103-.962.83-1.464 2.01-2.09 3.085-2.486.005-4.97-.008-7.458.007-.117.907.442 1.532 1.09 2.055H7.595c.365-.482 1.1-.793 1.023-1.5.025-2.41 0-4.822.008-7.235h2.13v1.485h2.826V9.422h-5.9L6.214 12c.488.86.977 1.719 1.469 2.578h.726v1.735H6.19C5.38 14.873 4.54 13.45 3.75 12v-.002c.793-1.448 1.635-2.87 2.44-4.31.829 0 1.656 0 2.483-.008a3.579 3.579 0 00-.611-2.055zm2.694 7.25v1.703h2.825v-1.703h-2.825zm5.186-5.188h2.212c.606.975 1.023 2.1 1.898 2.88.018.058.05.176.067.233-.934.123-1.88.028-2.823.075-.12-.52-.355-.998-.616-1.455l-.738.002V7.687zm-2.284 8.843c.653.002 1.31 0 1.963-.002-.014.835.57 1.352 1.143 1.847h-4.227c.542-.515 1.176-1.003 1.121-1.845z"
  }));
}
HSR.DefaultColor = DefaultColor;
var HSR_default = HSR;
//# sourceMappingURL=HSR.js.map
