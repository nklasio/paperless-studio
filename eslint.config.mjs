import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      // Request and browser-API effects intentionally coordinate local state.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  prettier,
  globalIgnores([
    ".next/**",
    ".next-e2e/**",
    "out/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
]);
