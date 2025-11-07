import { Interface } from "../src";

console.log("🧪 Testing Custom Error Messages\n");

// Test 1: Basic custom error message
const schema1 = Interface({
  name: "string --> You provided other type than a string please fix it",
});

console.log("Test 1: Wrong type with custom message");
const result1 = schema1.safeParse({ name: 123 });
console.log("Success:", result1.success);
if (!result1.success) {
  console.log("Error message:", result1.errors[0]?.message);
}

console.log("\n" + "=".repeat(50) + "\n");

// Test 2: Custom message with constraints
const schema2 = Interface({
  age: "number(18,100) --> Age must be between 18 and 100",
});

console.log("Test 2: Out of range with custom message");
const result2 = schema2.safeParse({ age: 15 });
console.log("Success:", result2.success);
if (!result2.success) {
  console.log("Error message:", result2.errors[0]?.message);
}

console.log("\n" + "=".repeat(50) + "\n");

// Test 3: Custom message with required field
const schema3 = Interface({
  email: "email! --> Please provide a valid email address",
});

console.log("Test 3: Null value with custom message");
const result3 = schema3.safeParse({ email: null });
console.log("Success:", result3.success);
if (!result3.success) {
  console.log("Error message:", result3.errors[0]?.message);
}

console.log("\n" + "=".repeat(50) + "\n");

// Test 4: Custom message with optional field
const schema4 = Interface({
  phone: "string? --> Phone number must be a string if provided",
});

console.log("Test 4: Wrong type for optional field with custom message");
const result4 = schema4.safeParse({ phone: 123 });
console.log("Success:", result4.success);
if (!result4.success) {
  console.log("Error message:", result4.errors[0]?.message);
}

console.log("\n" + "=".repeat(50) + "\n");

// Test 5: Valid data should pass
const schema5 = Interface({
  username: "string --> Username must be a string",
});

console.log("Test 5: Valid data should pass");
const result5 = schema5.safeParse({ username: "john_doe" });
console.log("Success:", result5.success);
if (result5.success) {
  console.log("Data:", result5.data);
}
