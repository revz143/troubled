import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [".next-e2e/**", "supabase/.temp/**"],
  },
  ...nextVitals,
  ...nextTypescript,
];

export default eslintConfig;
