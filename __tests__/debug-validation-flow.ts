import { Interface } from "../src";

const schema = Interface({
  name: "string --> Custom error message",
});

console.log("Schema definition:", (schema as any).definition);
console.log("Has precompiled validator:", !!(schema as any).precompiledValidator);

console.log("\nCompiled fields:");
const fields = (schema as any).compiledFields;
fields.forEach((f: any) => {
  console.log(`  ${f.key}:`, {
    isString: f.isString,
    originalType: f.originalType,
    parsedConstraints: f.parsedConstraints,
  });
});

console.log("\n--- Testing with number (should fail) ---");
const result = schema.safeParse({ name: 123 });
console.log("Success:", result.success);
if (!result.success) {
  console.log("Errors:", result.errors);
} else {
  console.log("Data:", result.data);
}
