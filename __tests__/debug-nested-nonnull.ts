import { Interface } from "../src";

const schema = Interface({
  profile: {
    name: "string!",
    bio: "string?",
  },
});

console.log("Schema definition:", (schema as any).definition);

const data = {
  profile: {
    name: "John",
    bio: null,
  },
};

console.log("Input data:", JSON.stringify(data, null, 2));

const result = schema.safeParse(data);

console.log("Success:", result.success);
if (!result.success) {
  console.log("Errors:", JSON.stringify(result.errors, null, 2));
} else {
  console.log("Data:", JSON.stringify(result.data, null, 2));
}

// Try with bio as string
console.log("\n--- Try with bio as string ---");
const result2 = schema.safeParse({
  profile: {
    name: "John",
    bio: "Developer",
  },
});
console.log("Success:", result2.success);
if (!result2.success) {
  console.log("Errors:", JSON.stringify(result2.errors, null, 2));
}
