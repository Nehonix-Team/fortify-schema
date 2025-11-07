import { Interface } from "../src";

const schema = Interface({
  profile: {
    name: "string!",
  },
});

// Debug the nested schema
const nestedSchema = (schema as any).definition.profile;
console.log("Nested schema definition:", nestedSchema);
console.log("Nested schema type:", typeof nestedSchema);

// Let's see if we can access the compiled fields
const interfaceSchema = schema as any;
if (interfaceSchema.compiledFields) {
  const profileField = interfaceSchema.compiledFields.find((f: any) => f.key === 'profile');
  console.log("Profile field compiled:", profileField);
}
