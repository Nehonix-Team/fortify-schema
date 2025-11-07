import { Interface } from "../src";

// Test with no space before -->
const schema1 = Interface({
  type: "number--> bro you've broke schema rules",
});

// Test with space before -->
const schema2 = Interface({
  type: "number --> bro you've broke schema rules",
});

// Test with no space at all
const schema3 = Interface({
  type: "number-->bro you've broke schema rules",
});

console.log("Testing type inference with different spacing...\n");

// All should infer type as number and catch this error
// @ts-expect-error - string is not assignable to number
const test1 = schema1.safeParse({ type: "other" });

// @ts-expect-error - string is not assignable to number
const test2 = schema2.safeParse({ type: "other" });

// @ts-expect-error - string is not assignable to number
const test3 = schema3.safeParse({ type: "other" });

console.log("Test 1 (no space before -->):", !test1.success ? "✅ PASS" : "❌ FAIL");
console.log("Test 2 (space before -->):", !test2.success ? "✅ PASS" : "❌ FAIL");
console.log("Test 3 (no spaces at all):", !test3.success ? "✅ PASS" : "❌ FAIL");

if (!test1.success) {
  console.log("\nCustom error message:", test1.errors[0]?.message);
}
