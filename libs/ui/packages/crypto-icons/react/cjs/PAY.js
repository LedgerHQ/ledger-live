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
  default: () => PAY_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#302C2C";
function PAY({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M20.183 11.772a.85.85 0 00-.162-.225c-1.426-1.616-4.33-4.797-4.33-4.797l-3.687 4.034-3.735-3.996s-2.937 3.21-4.376 4.842c-.188.185-.188.518-.02.714.748.852 4.42 4.902 4.42 4.902L12 13.186l3.68 4.064 4.437-4.91s.094-.097.114-.162a.558.558 0 00-.047-.406zm-14.244.45c-.12-.143-.08-.365.032-.5.47-.534 2.348-2.55 2.348-2.55l2.618 2.78-2.622 2.867s-1.605-1.713-2.376-2.598zm11.99.094c-.054.095-.119.184-.191.266l-2.033 2.209L13.08 12l2.583-2.831s1.488 1.541 2.17 2.37c.058.072.126.14.155.232.063.179.023.378-.059.544"
  }));
}
PAY.DefaultColor = DefaultColor;
var PAY_default = PAY;
//# sourceMappingURL=PAY.js.map
