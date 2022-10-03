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
  default: () => PASC_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#F7931E";
function PASC({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M12 3a9 9 0 100 18 9 9 0 000-18zm4.5 4.36a1.687 1.687 0 011.688 1.687v2.53a1.687 1.687 0 01-1.688 1.688h-2.09l-.135.633a.366.366 0 01-.34.282h-.422a.22.22 0 01-.222-.282l.136-.632h-.985l-.135.632a.366.366 0 01-.34.282h-.423a.22.22 0 01-.221-.282l.135-.632h-1.056l-.926 4.359h-2.25L8.87 9.89h2.25l-.359 1.688h4.333a.843.843 0 00.844-.843V9.89a.844.844 0 00-.844-.843H5.813L7.218 7.36h5.494l.135-.633a.366.366 0 01.34-.282h.422a.22.22 0 01.222.282l-.135.633h.985l.134-.633a.366.366 0 01.34-.282h.423a.22.22 0 01.221.282l-.134.633h.834z"
  }));
}
PASC.DefaultColor = DefaultColor;
var PASC_default = PASC;
//# sourceMappingURL=PASC.js.map
