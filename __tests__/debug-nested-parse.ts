import { Interface } from "../src";

// Check how the nested schema definition is stored
const schema = Interface({
  profile: {
    name: "string!",
    bio: "string?",
  },
});

console.log("Schema definition:");
console.log(JSON.stringify((schema as any).definition, null, 2));

console.log("\nCompiled fields:");
const compiledFields = (schema as any).compiledFields;
compiledFields.forEach((field: any) => {
  console.log(`  ${field.key}:`, {
    isString: field.isString,
    isOptional: field.isOptional,
    originalType: typeof field.originalType === 'object' ? 
      JSON.stringify(field.originalType, null, 2) : field.originalType
  });
});
