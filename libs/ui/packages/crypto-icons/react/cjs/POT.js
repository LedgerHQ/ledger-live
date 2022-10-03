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
  default: () => POT_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#105B2F";
function POT({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M9.025 13.635l-.293 1.49-.532 2.739c-.015.082-.036.138-.141.136-.662-.01-1.323-.015-1.985-.022-.015 0-.032-.01-.074-.027l1.493-7.455H6.235c.003-.055.001-.088.007-.12.078-.402.16-.804.23-1.209.02-.112.07-.14.175-.14.308.003.615-.008.921.002.147.005.203-.037.231-.181.171-.891.354-1.78.53-2.669.02-.105.044-.178.182-.178 1.506.004 3.013-.01 4.519.01.879.01 1.76.056 2.625.234.298.061.6.14.876.264.793.352 1.271.963 1.404 1.808.206 1.313-.072 2.52-.915 3.571-.623.774-1.476 1.209-2.43 1.473-.755.209-1.53.274-2.312.276-1.017.002-2.033 0-3.05-.001h-.203zm.416-2.053h.212c1.075 0 2.15.002 3.225-.002.23 0 .46-.01.688-.037.868-.104 1.527-.52 1.949-1.275.18-.328.241-.708.171-1.076-.088-.523-.4-.864-.93-.96a7.37 7.37 0 00-1.177-.127c-1.104-.02-2.208-.012-3.313-.015-.04 0-.08.006-.133.01l-.183.936h3.068l-.282 1.454H9.659l-.218 1.092z"
  }));
}
POT.DefaultColor = DefaultColor;
var POT_default = POT;
//# sourceMappingURL=POT.js.map
