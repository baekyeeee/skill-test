import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// The hook persists to localStorage; keep tests isolated from each other.
afterEach(() => {
  localStorage.clear();
});
