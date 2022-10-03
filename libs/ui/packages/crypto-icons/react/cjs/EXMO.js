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
  default: () => EXMO_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#347FFB";
function EXMO({
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
    d: "M14.796 9.416l-2.152 5.813-.013.035-.395-.791-.825.375L13.575 9l.825-.375.395.791h.001zm5.385.137l-2.151 5.822-.395-.793-.825.374.05-.136L19.01 9l.825-.375.394.791-.048.137zm-4.605 5.034l1.267-3.422-.828.375-.393-.792-1.27 3.421.394.793.83-.374zm-6.853-3.374H4.94l.646.6-.646.61h3.78l.643-.61-.639-.6zM4.416 13.75h6.116l-.643.605.643.604H4.416l-.645-.604.645-.606zm1.876-5.076h6.112l-.64.606.641.604H6.293l-.646-.605.646-.605h-.001z"
  }));
}
EXMO.DefaultColor = DefaultColor;
var EXMO_default = EXMO;
//# sourceMappingURL=EXMO.js.map
