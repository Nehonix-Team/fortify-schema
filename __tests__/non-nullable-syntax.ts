import { Interface } from "../src";

console.log("🧪 Testing Non-Nullable (!) Syntax\n");

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error}`);
    failed++;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

// Test 1: Basic non-nullable field
test("Non-nullable string should reject null", () => {
  const schema = Interface({
    name: "string!",
  });

  const result = schema.safeParse({ name: null });
  assert(!result.success, "Should reject null for non-nullable field");
});

test("Non-nullable string should accept valid string", () => {
  const schema = Interface({
    name: "string!",
  });

  const result = schema.safeParse({ name: "John" });
  assert(result.success, "Should accept valid string");
});

// Test 2: Non-nullable number
test("Non-nullable number should reject null", () => {
  const schema = Interface({
    age: "number!",
  });

  const result = schema.safeParse({ age: null });
  assert(!result.success, "Should reject null for non-nullable number");
});

test("Non-nullable number should accept valid number", () => {
  const schema = Interface({
    age: "number!",
  });

  const result = schema.safeParse({ age: 25 });
  assert(result.success, "Should accept valid number");
});

// Test 3: Non-nullable with constraints
test("Non-nullable with length constraint should work", () => {
  const schema = Interface({
    username: "string(3,20)!",
  });

  const result1 = schema.safeParse({ username: "john" });
  assert(result1.success, "Should accept valid string with constraints");

  const result2 = schema.safeParse({ username: null });
  assert(!result2.success, "Should reject null");

  const result3 = schema.safeParse({ username: "ab" });
  assert(!result3.success, "Should reject string too short");
});

// Test 4: Non-nullable email
test("Non-nullable email should work", () => {
  const schema = Interface({
    email: "email!",
  });

  const result1 = schema.safeParse({ email: "john@example.com" });
  assert(result1.success, "Should accept valid email");

  const result2 = schema.safeParse({ email: null });
  assert(!result2.success, "Should reject null");
});

// Test 5: Non-nullable UUID
test("Non-nullable UUID should work", () => {
  const schema = Interface({
    id: "uuid!",
  });

  const result1 = schema.safeParse({
    id: "550e8400-e29b-41d4-a716-446655440000",
  });
  assert(result1.success, "Should accept valid UUID");

  const result2 = schema.safeParse({ id: null });
  assert(!result2.success, "Should reject null");
});

// Test 6: Non-nullable URL
test("Non-nullable URL should work", () => {
  const schema = Interface({
    website: "url!",
  });

  const result1 = schema.safeParse({ website: "https://example.com" });
  assert(result1.success, "Should accept valid URL");

  const result2 = schema.safeParse({ website: null });
  assert(!result2.success, "Should reject null");
});

// Test 7: Non-nullable date
test("Non-nullable date should work", () => {
  const schema = Interface({
    createdAt: "date!",
  });

  const result1 = schema.safeParse({ createdAt: new Date() });
  assert(result1.success, "Should accept valid date");

  const result2 = schema.safeParse({ createdAt: null });
  assert(!result2.success, "Should reject null");
});

// Test 8: Non-nullable boolean
test("Non-nullable boolean should work", () => {
  const schema = Interface({
    active: "boolean!",
  });

  const result1 = schema.safeParse({ active: true });
  assert(result1.success, "Should accept true");

  const result2 = schema.safeParse({ active: false });
  assert(result2.success, "Should accept false");

  const result3 = schema.safeParse({ active: null });
  assert(!result3.success, "Should reject null");
});

// Test 9: Non-nullable array
test("Non-nullable array should work", () => {
  const schema = Interface({
    tags: "string[]!",
  });

  const result1 = schema.safeParse({ tags: ["tag1", "tag2"] });
  assert(result1.success, "Should accept valid array");

  const result2 = schema.safeParse({ tags: [] });
  assert(result2.success, "Should accept empty array");

  const result3 = schema.safeParse({ tags: null });
  assert(!result3.success, "Should reject null");
});

// Test 10: Non-nullable with union types
test("Non-nullable union should work", () => {
  const schema = Interface({
    role: "admin|user|guest!",
  });

  const result1 = schema.safeParse({ role: "admin" });
  assert(result1.success, "Should accept valid union value");

  const result2 = schema.safeParse({ role: null });
  assert(!result2.success, "Should reject null");
});

// Test 11: Non-nullable with regex pattern
test("Non-nullable with regex should work", () => {
  const schema = Interface({
    zipCode: "string(/^\\d{5}$/)!",
  });

  const result1 = schema.safeParse({ zipCode: "12345" });
  assert(result1.success, "Should accept valid pattern");

  const result2 = schema.safeParse({ zipCode: null });
  assert(!result2.success, "Should reject null");
});

// Test 12: Mixed nullable and non-nullable fields
test("Mixed nullable and non-nullable fields should work", () => {
  const schema = Interface({
    id: "number!",
    name: "string!",
    nickname: "string?",
    email: "email!",
    phone: "string?",
  });

  const result1 = schema.safeParse({
    id: 1,
    name: "John",
    nickname: null, // nullable, should be ok
    email: "john@example.com",
    phone: null, // nullable, should be ok
  });
  assert(result1.success, "Should accept mixed nullable/non-nullable");

  const result2 = schema.safeParse({
    id: null, // non-nullable, should fail
    name: "John",
    email: "john@example.com",
  });
  assert(!result2.success, "Should reject null for non-nullable field");
});

// Test 13: Non-nullable with number range
test("Non-nullable with number range should work", () => {
  const schema = Interface({
    age: "number(18,120)!",
  });

  const result1 = schema.safeParse({ age: 25 });
  assert(result1.success, "Should accept valid number in range");

  const result2 = schema.safeParse({ age: null });
  assert(!result2.success, "Should reject null");

  const result3 = schema.safeParse({ age: 15 });
  assert(!result3.success, "Should reject number out of range");
});

// Test 14: Non-nullable nested object
test("Non-nullable nested object should work", () => {
  const schema = Interface({
    profile: {
      name: "string!",
      bio: "string?",
    },
  });

  const result1 = schema.safeParse({
    profile: {
      name: "John",
      // bio is optional, can be omitted (not null!)
    },
  });
  assert(result1.success, "Should accept valid nested object with optional field omitted");

  const result2 = schema.safeParse({
    profile: {
      name: null, // non-nullable, should fail
      bio: "Developer",
    },
  });
  assert(!result2.success, "Should reject null in non-nullable nested field");
});

// Test 15: Non-nullable array of objects
test("Non-nullable array of objects should work", () => {
  const schema = Interface({
    items: [
      {
        id: "string!",
        name: "string!",
        description: "string?",
      },
    ],
  });

  const result1 = schema.safeParse({
    items: [
      { id: "1", name: "Item 1", description: null },
      { id: "2", name: "Item 2", description: "Desc" },
    ],
  });
  assert(result1.success, "Should accept valid array of objects");

  const result2 = schema.safeParse({
    items: [{ id: null, name: "Item 1" }], // non-nullable id is null
  });
  assert(!result2.success, "Should reject null in non-nullable array element field");
});

// Test 16: Non-nullable with undefined (should still require the field)
test("Non-nullable should still require the field", () => {
  const schema = Interface({
    name: "string!",
  });

  const result = schema.safeParse({});
  assert(!result.success, "Should require the field even with ! syntax");
});

// Test 17: Non-nullable vs optional (? vs !)
test("Non-nullable (!) vs optional (?) behavior", () => {
  const schema = Interface({
    required: "string!",
    optional: "string?",
  });

  // Optional can be omitted
  const result1 = schema.safeParse({ required: "value" });
  assert(result1.success, "Optional field can be omitted");

  // Optional can be null
  const result2 = schema.safeParse({ required: "value", optional: null });
  assert(result2.success, "Optional field can be null");

  // Non-nullable cannot be null
  const result3 = schema.safeParse({ required: null, optional: "value" });
  assert(!result3.success, "Non-nullable field cannot be null");

  // Non-nullable is still required
  const result4 = schema.safeParse({ optional: "value" });
  assert(!result4.success, "Non-nullable field is still required");
});

// Summary
console.log(`\n${"=".repeat(50)}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total: ${passed + failed}`);
console.log(`${"=".repeat(50)}`);

if (failed > 0) {
  process.exit(1);
}
