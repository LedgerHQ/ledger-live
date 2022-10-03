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
  default: () => RLC_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#FFD800";
function RLC({
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
    d: "M16.637 9.665c.043-.043.128-.043.211-.043 1.265 0 2.277 1.07 2.277 2.357 0 1.2-.885 2.143-2.023 2.357h-.254c-.421 0-.843-.129-1.222-.343a.704.704 0 00-.422-.129.838.838 0 00-.463.129c-.296.171-.422.471-.422.814v.386a2.31 2.31 0 01-2.024 2.1h-.253c-.421 0-.843-.128-1.223-.343a.95.95 0 00-.463-.128.843.843 0 00-.464.128c-.295.172-.422.472-.422.815v.385c-.084 1.115-.97 1.972-2.065 2.1h-.211c-1.265 0-2.277-1.072-2.277-2.357.042-1.2.885-2.186 2.024-2.315h.253c.421 0 .843.13 1.222.344.124.087.271.131.422.128a.84.84 0 00.464-.128c.295-.172.421-.472.421-.815-.084-1.242.802-2.357 2.024-2.485H12c.421 0 .843.128 1.223.342a.953.953 0 00.464.129.84.84 0 00.463-.129c.295-.171.422-.471.422-.814-.084-1.243.843-2.357 2.065-2.486zM11.79 6.707c.084-.042.127-.042.253-.042 1.265 0 2.277 1.07 2.277 2.357-.042 1.2-.885 2.185-2.024 2.313h-.253c-.422 0-.843-.128-1.223-.342a.705.705 0 00-.421-.129.839.839 0 00-.464.129c-.295.171-.422.471-.422.814v.386c-.084 1.114-.969 1.97-2.066 2.1h-.21c-1.265 0-2.277-1.071-2.277-2.357 0-1.157.843-2.1 1.981-2.271h.254c.421 0 .843.128 1.222.342.123.087.271.132.422.129a.839.839 0 00.463-.129c.296-.171.422-.471.422-.814-.084-1.243.844-2.357 2.066-2.486zM7.152 3.75c1.257 0 2.276 1.037 2.276 2.314 0 1.279-1.02 2.314-2.276 2.314-1.258 0-2.277-1.035-2.277-2.314 0-1.277 1.02-2.314 2.277-2.314z"
  }));
}
RLC.DefaultColor = DefaultColor;
var RLC_default = RLC;
//# sourceMappingURL=RLC.js.map
