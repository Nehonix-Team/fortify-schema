import { Interface } from "../src";

const schema = Interface({
  profile: {
    name: "string!",
  },
});

console.log("Testing nested validation flow...\n");

// This should fail
const result = schema.safeParse({
  profile: {
    name: null,
  },
});

console.log("Result:", result.success);
if (!result.success) {
  console.log("Errors:", JSON.stringify(result.errors, null, 2));
} else {
  console.log("Data:", result.data);
}
