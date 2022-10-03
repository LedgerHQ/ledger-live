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
  default: () => BTDX_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#0AF";
function BTDX({
  size = 16,
  color = DefaultColor
}) {
  return /* @__PURE__ */ React.createElement(import_StyledSvg.default, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color
  }, /* @__PURE__ */ React.createElement("path", {
    d: "M11.972 3.705a8.267 8.267 0 100 16.534 8.267 8.267 0 000-16.534zm.026 1.31a4.108 4.108 0 013.857 5.523 2.684 2.684 0 00-2.045.474 2.608 2.608 0 00.806-1.888 2.623 2.623 0 00-2.62-2.622 2.622 2.622 0 00-2.605 2.355A4.492 4.492 0 007.9 8.842a4.109 4.109 0 014.098-3.828zm1.511 7.718l-1.454-.87a.3.3 0 00-.313.003l-1.275.787a.3.3 0 00-.141.297 1.749 1.749 0 01-1.672 1.988 1.743 1.743 0 01-1.797-1.745 1.752 1.752 0 011.715-1.741 1.74 1.74 0 011.33.583.3.3 0 00.369.06l1.228-.689a.304.304 0 00.154-.263v-.075a.303.303 0 00-.207-.286 1.745 1.745 0 01.633-3.398 1.75 1.75 0 011.654 1.614 1.742 1.742 0 01-1.298 1.815.304.304 0 00-.231.292v.013c0 .105.055.202.144.257l1.29.794a.3.3 0 00.392-.066 1.742 1.742 0 011.403-.653 1.745 1.745 0 01-.134 3.488 1.748 1.748 0 01-1.646-1.916.3.3 0 00-.144-.289zm-4.91 4.525a4.065 4.065 0 01-3.68-5.802 4.065 4.065 0 014.458-2.257c.019.687.308 1.34.805 1.816a2.67 2.67 0 00-1.581-.515 2.692 2.692 0 000 5.384 2.689 2.689 0 002.497-1.695c.129.56.366 1.076.685 1.533A4.06 4.06 0 018.6 17.259zm6.792 0a4.068 4.068 0 01-4.059-3.79c.458.07.924.067 1.381-.008a2.692 2.692 0 103.422-2.856c.156-.435.241-.893.253-1.356a4.068 4.068 0 01-.997 8.01z"
  }), /* @__PURE__ */ React.createElement("path", {
    d: "M12 2.25c-5.384 0-9.75 4.366-9.75 9.75s4.366 9.75 9.75 9.75 9.75-4.366 9.75-9.75S17.384 2.25 12 2.25zm-.028 18.767a9.043 9.043 0 01-9.044-9.044 9.042 9.042 0 019.044-9.043 9.043 9.043 0 019.042 9.043 9.043 9.043 0 01-9.042 9.043z"
  }));
}
BTDX.DefaultColor = DefaultColor;
var BTDX_default = BTDX;
//# sourceMappingURL=BTDX.js.map
