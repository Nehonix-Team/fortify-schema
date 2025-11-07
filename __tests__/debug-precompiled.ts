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

console.log(
  "Original schema - has precompiled validator:",
  !!(TestSchema as any).precompiledValidator
);

const OptionalSchema = Mod.makeOptional(TestSchema, ["modules"]);

console.log(
  "After makeOptional - has precompiled validator:",
  !!(OptionalSchema as any).precompiledValidator
);
console.log("Optimization level:", (OptionalSchema as any).optimizationLevel);
