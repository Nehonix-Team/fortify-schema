import { Interface } from "../src";

const schema = Interface({
  profile: {
    name: "string!",
  },
});

console.log("Top-level compiled fields:");
const topFields = (schema as any).compiledFields;
topFields.forEach((f: any) => {
  console.log(`  ${f.key}:`, {
    isString: f.isString,
    parsedConstraints: f.parsedConstraints
  });
});

console.log("\nTop-level has precompiled validator:", !!(schema as any).precompiledValidator);

// Now check what happens when we validate
const profileDef = (schema as any).definition.profile;
console.log("\nProfile definition:", profileDef);

// Create a nested schema like the validation does
const { InterfaceSchema } = require("../src/core/schema/mode/interfaces/InterfaceSchema");
const nestedSchema = new InterfaceSchema(profileDef, {});

console.log("\nNested schema compiled fields:");
const nestedFields = nestedSchema.compiledFields;
nestedFields.forEach((f: any) => {
  console.log(`  ${f.key}:`, {
    isString: f.isString,
    parsedConstraints: f.parsedConstraints
  });
});

console.log("\nNested has precompiled validator:", !!nestedSchema.precompiledValidator);
