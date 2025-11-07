import { Interface } from "../src";

// Enable debug mode by temporarily modifying the validation
const schema = Interface({
  videos: [
    {
      id: "string",
      title: "string",
    },
  ],
});

console.log("Schema definition:", schema);
console.log("\nTesting with invalid data...");

const result = schema.safeParse({
  videos: [
    {
      id: 123, // Wrong type
      // Missing title
    },
  ],
});

console.log("\nResult:", result);
console.log("Success:", result.success);
console.log("Errors:", result.errors);
console.log("Data:", result.data);
