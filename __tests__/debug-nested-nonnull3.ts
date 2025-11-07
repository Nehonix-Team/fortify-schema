import { Interface } from "../src";

const schema = Interface({
  name: "string!",  // Top level
});

console.log("Test 1: Top-level string! with null");
const result1 = schema.safeParse({ name: null });
console.log("Success:", result1.success);
if (!result1.success) {
  console.log("Error:", result1.errors[0]?.message);
}

console.log("\n" + "=".repeat(50));

const schema2 = Interface({
  profile: {
    name: "string!",  // Nested
  },
});

console.log("\nTest 2: Nested string! with null");
const result2 = schema2.safeParse({
  profile: {
    name: null,
  },
});
console.log("Success:", result2.success);
if (!result2.success) {
  console.log("Error:", result2.errors[0]?.message);
} else {
  console.log("❌ BUG: Should have failed!");
}
