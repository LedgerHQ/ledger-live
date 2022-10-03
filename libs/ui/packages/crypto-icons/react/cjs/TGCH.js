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
  default: () => TGCH_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#434247";
function TGCH({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M12 3.066a8.934 8.934 0 100 17.868 8.934 8.934 0 000-17.868zm0 17.506a8.58 8.58 0 118.58-8.578A8.58 8.58 0 0112 20.573"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M12.981 12.878h2.265v3.342c0 .331-.34.508-.664.679-.317.17-.834.132-1.704.132h-1.062c-1.63.037-2.088-.088-2.479-.258-.39-.177-.59-.428-.59-.753v-3.142H7.574v3.54c0 .193.096.414.244.613.169.23.147.295.516.48.332.17.664.302 1.261.376.465.059.384.044 1.21.059h1.963c1.475-.03 1.777.074 2.654-.369.717-.354.96-.767 1.011-1.033v-4.817H12.99v1.15h-.008zM9.927 6.06c-.597.038-1.092.222-1.475.37-.39.147-.472.324-.634.516a.976.976 0 00-.237.627v3.925h1.18v-3.55c0-.302.185-.545.547-.722.369-.185.907-.273 1.409-.273h2.301c.877 0 1.35-.015 1.623.147.28.177.613.332.613.664v.937h1.18v-1.26c-.022-.164-.2-.628-1.033-1.02-.752-.353-.995-.375-2.176-.375"
  }));
}
TGCH.DefaultColor = DefaultColor;
var TGCH_default = TGCH;
//# sourceMappingURL=TGCH.js.map
