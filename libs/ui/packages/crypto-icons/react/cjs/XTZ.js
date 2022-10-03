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
  default: () => XTZ_default
});
var React = __toModule(require("react"));
var import_StyledSvg = __toModule(require("./StyledSvg"));
const DefaultColor = "#2C7DF7";
function XTZ({
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
    d: "M13.642 19.5c-1.095 0-1.893-.258-2.394-.773-.5-.516-.75-1.071-.75-1.667 0-.217.043-.401.13-.55a.953.953 0 01.359-.352c.151-.086.337-.13.558-.13.222 0 .408.044.56.13.151.086.27.203.358.352.087.149.13.333.13.55 0 .263-.063.478-.191.644a.888.888 0 01-.455.327c.152.206.39.352.717.438.326.092.652.138.978.138.437.005.866-.12 1.232-.361.367-.24.637-.596.811-1.065.175-.47.263-1.003.263-1.598 0-.648-.096-1.2-.288-1.659-.187-.464-.464-.807-.83-1.03a2.243 2.243 0 00-1.188-.335c-.28 0-.629.114-1.048.343l-.769.378v-.378l3.46-4.536h-4.787v4.708c0 .39.087.71.262.962.174.252.443.378.803.378.28 0 .547-.091.804-.275a2.82 2.82 0 00.663-.67.257.257 0 01.088-.112.177.177 0 01.113-.042c.065 0 .14.031.228.093.08.087.123.2.122.318-.01.081-.025.162-.044.241-.198.435-.472.767-.82.997a2.06 2.06 0 01-1.154.343c-1.036 0-1.752-.2-2.148-.601-.396-.4-.594-.945-.594-1.632V8.366H6.375V7.49H8.82V5.497l-.558-.55V4.5h1.624l.612.309v2.68l6.323-.017.63.619-3.88 3.814c.236-.092.483-.15.734-.172.42 0 .891.132 1.416.396.53.257.937.613 1.222 1.065.286.447.47.877.55 1.29.082.36.126.729.132 1.099.005.709-.156 1.41-.472 2.044a3.028 3.028 0 01-1.432 1.409c-.649.31-1.36.47-2.079.464z"
  }));
}
XTZ.DefaultColor = DefaultColor;
var XTZ_default = XTZ;
//# sourceMappingURL=XTZ.js.map
