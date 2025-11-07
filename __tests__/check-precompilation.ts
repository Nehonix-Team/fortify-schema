import { Interface } from "../src";

const schema = Interface({
  videos: [
    {
      id: "string",
      title: "string",
    },
  ],
});

// Access internal properties to check if precompilation is being used
const schemaAny = schema as any;
console.log("Has precompiled validator:", !!schemaAny.precompiledValidator);
console.log("Is optimized:", schemaAny.isOptimized);
console.log("Optimization level:", schemaAny.optimizationLevel);
console.log("Compiled fields:", schemaAny.compiledFields);
