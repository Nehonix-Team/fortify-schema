import { Interface } from "../src";

// Patch console.log to see what's happening
const originalLog = console.log;
const logs: string[] = [];
console.log = (...args: any[]) => {
  const msg = args.join(' ');
  if (msg.includes('validating') || msg.includes('test')) {
    logs.push(msg);
  }
  originalLog(...args);
};

const schema = Interface({
  profile: {
    name: "string!",
  },
});

console.log("=== Starting validation ===");
const result = schema.safeParse({
  profile: {
    name: null,
  },
});

console.log("=== Validation complete ===");
console.log("\nLogs captured:");
logs.forEach(log => console.log("  -", log));

console.log("\nResult:", result.success);
if (!result.success) {
  console.log("Errors:", result.errors[0]?.message);
}
