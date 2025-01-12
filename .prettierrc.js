/** @type {import('prettier').Config} */
/** @typedef  {import("@ianvs/prettier-plugin-sort-imports").PluginConfig} SortImportsConfig*/
const config = {
  trailingComma: "es5",
  plugins: [require.resolve("prettier-plugin-tailwindcss")],
};

module.exports = config;
