const {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} = require("@tanstack/react-table");
const passthrough = require("@support/jest/shared/mocks/passthrough-web");

function useLumenDataTable(options) {
  return useReactTable({
    ...options,
    getCoreRowModel: options.getCoreRowModel ?? getCoreRowModel(),
    getFilteredRowModel: options.getFilteredRowModel ?? getFilteredRowModel(),
    getSortedRowModel: options.getSortedRowModel ?? getSortedRowModel(),
  });
}

module.exports = new Proxy(passthrough, {
  get(target, prop, receiver) {
    if (prop === "useLumenDataTable") return useLumenDataTable;
    return Reflect.get(target, prop, receiver);
  },
});
