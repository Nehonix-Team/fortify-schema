import { Interface } from "../src";

console.log("Testing empty string with ! syntax\n");

const schema1 = Interface({
  name: "string!",
});

console.log("Test 1: Empty string");
const result1 = schema1.safeParse({ name: "" });
console.log("Success:", result1.success);
if (!result1.success) {
  console.log("Errors:", result1.errors[0]?.message);
}

console.log("\nTest 2: Valid string");
const result2 = schema1.safeParse({ name: "John" });
console.log("Success:", result2.success);

console.log("\n" + "=".repeat(50));
console.log("Testing zero with ! syntax\n");

const schema2 = Interface({
  age: "number!",
});

console.log("Test 3: Zero");
const result3 = schema2.safeParse({ age: 0 });
console.log("Success:", result3.success);
if (!result3.success) {
  console.log("Errors:", result3.errors[0]?.message);
}

console.log("\nTest 4: Valid number");
const result4 = schema2.safeParse({ age: 25 });
console.log("Success:", result4.success);

console.log("\n" + "=".repeat(50));
console.log("Testing false with ! syntax\n");

const schema3 = Interface({
  active: "boolean!",
});

console.log("Test 5: False");
const result5 = schema3.safeParse({ active: false });
console.log("Success:", result5.success);
if (!result5.success) {
  console.log("Errors:", result5.errors[0]?.message);
}

console.log("\nTest 6: True");
const result6 = schema3.safeParse({ active: true });
console.log("Success:", result6.success);
