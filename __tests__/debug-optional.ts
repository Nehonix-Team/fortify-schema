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

console.log("Original schema definition:");
console.log((TestSchema as any).definition);

const OptionalSchema = Mod.makeOptional(TestSchema, ["modules"]);

console.log("\nAfter makeOptional:");
console.log((OptionalSchema as any).definition);

console.log("\nTesting validation:");
const result = OptionalSchema.safeParse({
  required: "test",
});

console.log("Success:", result.success);
if (!result.success) {
  console.log("Errors:", result.errors);
} else {
  console.log("Data:", result.data);
}
