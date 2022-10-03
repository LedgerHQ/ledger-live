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
  default: () => BRD_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#FE5D86";
function BRD({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M5.625 6.78c0-.431.354-.78.79-.78h5.692c3.357 0 4.54.396 5.357 1.2a2.572 2.572 0 01.735 1.955c0 1.389-.748 2.33-2.765 2.743 1.948.34 2.937 1.133 2.937 2.726a2.703 2.703 0 01-.765 2.021C16.808 17.433 15.503 18 11.99 18H6.416a.785.785 0 01-.79-.78V6.78zm4.32 4.47c0-.287.237-.519.528-.519h1.832c1.046 0 1.828-.051 2.19-.426a.885.885 0 00.243-.668.844.844 0 00-.225-.657c-.368-.361-1.15-.425-2.208-.425h-3.41v6.924h3.375c1.15 0 2-.085 2.398-.481a.915.915 0 00.26-.703.966.966 0 00-.26-.72c-.402-.395-1.253-.425-2.398-.425h-1.785a.53.53 0 01-.503-.33.515.515 0 01-.037-.207v-1.362z"
  }));
}
BRD.DefaultColor = DefaultColor;
var BRD_default = BRD;
//# sourceMappingURL=BRD.js.map
