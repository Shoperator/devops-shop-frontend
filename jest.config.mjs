import nextJest from "next/jest.js";

// Reads next.config.ts and the tsconfig paths, so tests compile the same way
// the app does — including the `@/` alias and the SWC transform.
// Written as .mjs rather than .ts on purpose: a TypeScript jest config would
// drag ts-node into the dependency tree just to read this file.
const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jest-environment-jsdom",
  setupFiles: ["<rootDir>/jest.polyfills.ts"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    // next/jest rewrites the `@/` alias inside import statements while
    // compiling, but `jest.mock("@/…")` takes a plain runtime string that the
    // compiler never sees. Jest has to be able to resolve it too.
    "^@/(.*)$": "<rootDir>/src/$1",
    // See the module itself for why the real package cannot be loaded here.
    "^next-runtime-env$": "<rootDir>/src/test-utils/nextRuntimeEnv.tsx",
  },
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],
};

export default createJestConfig(config);
