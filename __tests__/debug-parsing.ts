import { ConstraintParser } from "../src/core/schema/mode/interfaces/validators/ConstraintParser";

const testCases = [
  "string --> You provided other type than a string please fix it",
  "number(18,100) --> Age must be between 18 and 100",
  "email! --> Please provide a valid email address",
  "string? --> Phone number must be a string if provided",
];

testCases.forEach((testCase) => {
  console.log("\nInput:", testCase);
  try {
    const result = ConstraintParser.parseConstraints(testCase);
    console.log("Parsed:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.log("Error:", error);
  }
});
