import { Interface } from "../src";

// Test that TypeScript correctly infers union types even with custom error messages
const schema = Interface({
  type: "course|ebook --> bro you've broke schema rules",
  level: "string?",
});

// This should be valid - TypeScript should infer type as "course" | "ebook"
const validData1 = schema.safeParse({
  type: "course",
});

const validData2 = schema.safeParse({
  type: "ebook",
});

// This should fail at runtime but TypeScript should catch it
// @ts-expect-error - "other" is not in the union
const invalidData = schema.safeParse({
  type: "other",
});

console.log("✅ Test 1 (course):", validData1.success ? "PASS" : "FAIL");
console.log("✅ Test 2 (ebook):", validData2.success ? "PASS" : "FAIL");
console.log("✅ Test 3 (other - should fail):", !invalidData.success ? "PASS" : "FAIL");

if (!invalidData.success) {
  console.log("Custom error message:", invalidData.errors[0]?.message);
}
