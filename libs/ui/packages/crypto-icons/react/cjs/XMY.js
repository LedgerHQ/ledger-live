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
  default: () => XMY_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#fff";
function XMY({
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
    d: "M15.787 15.75c-.451 0-.947-.227-.947-.909 0-.336.263-1.369.786-3.099.107-.267.16-.507.16-.72 0-.408-.314-.817-.9-.817-.341 0-1.083.135-1.308.863-.15.485-.496 1.773-1.037 3.864-.21.545-.586.818-1.127.818-.811 0-.947-.591-.947-.955 0-.144.216-1.014.649-2.61.168-.532.252-.92.252-1.162 0-.364-.27-.818-.901-.818-.63 0-1.217.454-1.487 1.454-.18.667-.436 1.667-.767 3-.18.727-.586 1.091-1.217 1.091-.571 0-.871-.318-.901-.955l1.036-4.318H4.832a1.067 1.067 0 01-1.026-1.472A1.069 1.069 0 014.81 8.34h3.854c.54 0 .872.258.992.772.541-.68 1.262-.863 1.894-.863.632 0 1.442.364 1.803 1.182.495-.546 1.352-1.182 2.57-1.182 1.126 0 2.073.773 2.073 2.136 0 .515-.255 1.591-.766 3.228l1.977-.014c.579 0 1.043.482 1.043 1.075s-.464 1.075-1.037 1.075h-3.426z"
  }), /* @__PURE__ */ React.createElement("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M15.8 15.75c-.452 0-.948-.227-.948-.909 0-.336.263-1.369.786-3.099.107-.267.16-.507.16-.72 0-.408-.314-.817-.9-.817-.341 0-1.083.135-1.308.863-.15.485-.496 1.773-1.037 3.864-.21.545-.586.818-1.127.818-.811 0-.947-.591-.947-.955 0-.144.216-1.014.649-2.61.168-.532.252-.92.252-1.162 0-.364-.27-.818-.901-.818-.63 0-1.217.454-1.487 1.454-.18.667-.436 1.667-.767 3-.18.727-.586 1.091-1.217 1.091-.572 0-.872-.318-.902-.955l1.037-4.318H4.844a1.067 1.067 0 01-1.026-1.472 1.069 1.069 0 011.004-.664h3.854c.54 0 .871.258.991.772.542-.68 1.263-.863 1.895-.863.632 0 1.442.364 1.803 1.182.495-.546 1.352-1.182 2.57-1.182 1.126 0 2.073.773 2.073 2.136 0 .515-.256 1.591-.766 3.228l1.977-.014c.579 0 1.043.482 1.043 1.075s-.464 1.075-1.037 1.075h-3.426z"
  }));
}
XMY.DefaultColor = DefaultColor;
var XMY_default = XMY;
//# sourceMappingURL=XMY.js.map
