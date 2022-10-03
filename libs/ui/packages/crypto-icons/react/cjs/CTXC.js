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
  default: () => CTXC_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#000";
function CTXC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M11.923 3.299c-.11-.248.286-.423.396-.188 2.574 4.434 5.148 8.87 7.722 13.311-.137 0-.27-.045-.401-.066l-6.87-1.37c-.226-.01-.275-.375-.055-.429l2.695-.742a.225.225 0 00.149-.313l-3.636-10.21v.006z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M11.527 3.321a.79.79 0 01.066.115c.814 2.31 1.65 4.62 2.458 6.93.072.193-.198.352-.33.209-.693-.726-1.353-1.474-2.034-2.2-.11-.099-.27-.033-.342.072l-7.084 8.322c-.082.087-.153.22-.291.236-.1 0-.165-.078-.22-.154v-.127C6.346 12.258 8.938 7.79 11.527 3.32z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M9.36 11.246c.132-.038.308.055.264.215-.275.957-.566 1.909-.853 2.86-.043.121.066.23.182.236 3.707.743 7.414 1.513 11.12 2.255.073.011.122.066.177.11v.154l-.105.11H4.41c1.65-1.98 3.295-3.971 4.95-5.94z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M11.923 3.299c-.11-.248.286-.423.396-.188 2.574 4.434 5.148 8.87 7.722 13.311-.137 0-.27-.045-.401-.066l-6.87-1.37c-.226-.01-.275-.375-.055-.429l2.695-.742a.225.225 0 00.149-.313l-3.636-10.21v.006z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M11.527 3.321a.79.79 0 01.066.115c.814 2.31 1.65 4.62 2.458 6.93.072.193-.198.352-.33.209-.693-.726-1.353-1.474-2.034-2.2-.11-.099-.27-.033-.342.072l-7.084 8.322c-.082.087-.153.22-.291.236-.1 0-.165-.078-.22-.154v-.127C6.346 12.258 8.938 7.79 11.527 3.32z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M9.36 11.246c.132-.038.308.055.264.215-.275.957-.566 1.909-.853 2.86-.043.121.066.23.182.236 3.707.743 7.414 1.513 11.12 2.255.073.011.122.066.177.11v.154l-.105.11H4.41c1.65-1.98 3.295-3.971 4.95-5.94z"
  }));
}
CTXC.DefaultColor = DefaultColor;
var CTXC_default = CTXC;
//# sourceMappingURL=CTXC.js.map
