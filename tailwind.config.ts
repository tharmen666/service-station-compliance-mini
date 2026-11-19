import type { Config } from "tailwindcss";

// Colours are CSS variables so the Tenant Theme Configurator can swap palettes at runtime.
const v = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: v("primary"),
        accent: v("accent"),
        ink: v("ink"),
        muted: v("muted"),
        surface: v("surface"),
        canvas: v("canvas"),
        danger: v("danger"),
        ok: v("ok"),
      },
      fontSize: {
        base: ["1.0625rem", "1.5rem"],
      },
    },
  },
  plugins: [],
};

export default config;
