import { Interface } from "../src";

const schema = Interface({
  profile: {
    name: "string!",
    bio: "string?",
  },
});

console.log("Test: null in non-nullable nested field");
const result = schema.safeParse({
  profile: {
    name: null, // non-nullable, should fail
    bio: "Developer",
  },
});

console.log("Success:", result.success);
if (!result.success) {
  console.log("Errors:", JSON.stringify(result.errors, null, 2));
} else {
  console.log("❌ BUG: Should have rejected null for non-nullable field!");
}
