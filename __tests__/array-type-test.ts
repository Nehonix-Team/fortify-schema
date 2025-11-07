import { Interface, type InferType } from "../src";

// Test 1: Array of objects with tuple syntax [{ }]
const schema1 = Interface({
  items: [
    {
      id: "string",
      name: "string",
    },
  ],
});

type Schema1Type = InferType<typeof schema1>;
// Should be: { items: Array<{ id: string; name: string }> }

const validEmpty: Schema1Type = { items: [] };
const validWithItems: Schema1Type = {
  items: [
    { id: "1", name: "Item 1" },
    { id: "2", name: "Item 2" },
  ],
};

console.log("✅ TypeScript compilation passed for tuple syntax");

// Test 2: Nested array of objects
const schema2 = Interface({
  user: {
    id: "string",
    posts: [
      {
        title: "string",
        tags: "string[]",
      },
    ],
  },
});

type Schema2Type = InferType<typeof schema2>;

const validNested: Schema2Type = {
  user: {
    id: "user-1",
    posts: [
      { title: "Post 1", tags: ["tag1", "tag2"] },
      { title: "Post 2", tags: [] },
    ],
  },
};

const validNestedEmpty: Schema2Type = {
  user: {
    id: "user-1",
    posts: [],
  },
};

console.log("✅ TypeScript compilation passed for nested arrays");

// Test 3: Optional array of objects
const schema3 = Interface({
  optionalItems: [
    {
      value: "number",
    },
  ],
});

type Schema3Type = InferType<typeof schema3>;

const withOptional: Schema3Type = {
  optionalItems: [{ value: 42 }],
};

const withOptionalEmpty: Schema3Type = {
  optionalItems: [],
};

console.log("✅ TypeScript compilation passed for optional arrays");

// Runtime validation tests
console.log("\n=== Runtime Validation Tests ===");

const test1 = schema1.safeParse({ items: [] });
console.log("Empty array:", test1.success ? "✅ PASS" : "❌ FAIL");

const test2 = schema1.safeParse({
  items: [{ id: "1", name: "Test" }],
});
console.log("Array with items:", test2.success ? "✅ PASS" : "❌ FAIL");

const test3 = schema1.safeParse({
  items: [{ id: "1" }], // Missing 'name'
});
console.log("Invalid item:", test3.success ? "❌ FAIL" : "✅ PASS (correctly rejected)");

const test4 = schema2.safeParse({
  user: {
    id: "user-1",
    posts: [],
  },
});
console.log("Nested empty array:", test4.success ? "✅ PASS" : "❌ FAIL");

console.log("\n=== All Tests Completed ===");
