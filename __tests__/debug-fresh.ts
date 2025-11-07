import { Interface } from "../src";

// Create a fresh schema each time
const schema1 = Interface({
  profile: {
    name: "string!",
  },
});

console.log("Test with fresh schema:");
const result = schema1.safeParse({
  profile: {
    name: null,
  },
});

console.log("Success:", result.success);
if (!result.success) {
  console.log("Errors:", result.errors);
} else {
  console.log("Data:", result.data);
}

// Try again with another fresh schema
const schema2 = Interface({
  user: {
    email: "email!",
  },
});

console.log("\nTest 2 with different schema:");
const result2 = schema2.safeParse({
  user: {
    email: null,
  },
});

console.log("Success:", result2.success);
if (!result2.success) {
  console.log("Errors:", result2.errors);
}
