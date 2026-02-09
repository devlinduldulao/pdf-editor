/**
 * Tests for the `cn` utility function.
 *
 * `cn` is a small helper that merges Tailwind CSS class names intelligently.
 * It combines `clsx` (conditional class joining) with `tailwind-merge`
 * (deduplicating conflicting Tailwind utilities like `p-2 p-4` → `p-4`).
 *
 * Why test a tiny utility?
 * It's used everywhere in the UI layer. If it breaks, every component
 * breaks. Small, focused tests here give you high confidence cheaply.
 */
import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("should merge class names correctly", () => {
    // Arrange & Act: Pass multiple string class names
    const result = cn("bg-red-500", "text-white");

    // Assert: Both classes should be present
    expect(result).toBe("bg-red-500 text-white");
  });

  it("should handle conditional classes (falsy values are excluded)", () => {
    // `clsx` accepts booleans — false/null/undefined values are stripped out.
    const isActive = false;
    const result = cn("base-class", isActive && "active-class");

    expect(result).toBe("base-class");
  });

  it("should include conditional class when truthy", () => {
    const isActive = true;
    const result = cn("base-class", isActive && "active-class");

    expect(result).toBe("base-class active-class");
  });

  it("should resolve conflicting Tailwind classes (last wins)", () => {
    // `tailwind-merge` knows that `p-2` and `p-4` conflict (both set padding).
    // It keeps only the last one so the output is deterministic.
    const result = cn("p-2", "p-4");

    expect(result).toBe("p-4");
  });

  it("should handle empty inputs gracefully", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
    expect(cn(undefined)).toBe("");
    expect(cn(null)).toBe("");
  });

  it("should merge object syntax correctly", () => {
    // clsx also accepts objects: { className: boolean }
    const result = cn({ "bg-primary": true, "text-white": false });

    expect(result).toBe("bg-primary");
  });

  it("should handle arrays of class names", () => {
    const result = cn(["flex", "items-center"]);

    expect(result).toBe("flex items-center");
  });

  it("should deduplicate identical classes", () => {
    const result = cn("flex", "flex");

    expect(result).toBe("flex");
  });
});
