import { Interface, Mod } from "../src";

const TestSchema = Interface({
  required: "string",
  modules: [
    {
      id: "string",
      title: "string",
    },
  ],
});

const OptionalSchema = Mod.makeOptional(TestSchema, ["modules"]);

// Check compiled fields
console.log("Compiled fields:");
const compiledFields = (OptionalSchema as any).compiledFields;
compiledFields.forEach((field: any) => {
  console.log(`  ${field.key}:`, {
    isOptional: field.isOptional,
    isString: field.isString,
    originalType:
      typeof field.originalType === "object"
        ? JSON.stringify(field.originalType, null, 2)
        : field.originalType,
  });
});

console.log("\nTesting validation with missing modules:");
const result = OptionalSchema.safeParse({
  required: "test",
});

console.log("Success:", result.success);
if (!result.success) {
  console.log("Errors:", JSON.stringify(result.errors, null, 2));
} else {
  console.log("Data:", result.data);
}
