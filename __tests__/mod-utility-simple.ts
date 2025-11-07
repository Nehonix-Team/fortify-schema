import { Interface, Mod } from "../src";

console.log("🧪 Testing Mod Utility Methods\n");

// Base schemas
const UserSchema = Interface({
  id: "number",
  name: "string",
  email: "email",
  age: "number?",
});

const ProfileSchema = Interface({
  bio: "string?",
  avatar: "url?",
  social: {
    twitter: "string?",
    github: "string?",
  },
});

const CourseSchema = Interface({
  id: "string",
  title: "string",
  modules: [
    {
      id: "string",
      title: "string",
      duration: "number",
    },
  ],
});

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

// 1. merge()
test("Mod.merge() - should merge two schemas", () => {
  const merged = Mod.merge(UserSchema, ProfileSchema);
  const result = merged.safeParse({
    id: 1,
    name: "John",
    email: "john@example.com",
    social: {},
  });
  assert(result.success, "Merge should succeed");
});

// 2. mergeDeep()
test("Mod.mergeDeep() - should merge with strategy", () => {
  const Schema1 = Interface({ id: "number", name: "string" });
  const Schema2 = Interface({ id: "uuid", email: "email" });
  const merged = Mod.mergeDeep(Schema1, Schema2);
  const result = merged.safeParse({
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "John",
    email: "john@example.com",
  });
  assert(result.success, "MergeDeep should succeed");
});

// 3. pick()
test("Mod.pick() - should pick specific fields", () => {
  const picked = Mod.pick(UserSchema, ["id", "name"]);
  const result = picked.safeParse({ id: 1, name: "John" });
  assert(result.success, "Pick should succeed");
});

// 4. omit()
test("Mod.omit() - should omit specific fields", () => {
  const omitted = Mod.omit(UserSchema, ["email"]);
  const result = omitted.safeParse({ id: 1, name: "John" });
  assert(result.success, "Omit should succeed");
});

// 5. partial()
test("Mod.partial() - should make all fields optional", () => {
  const partial = Mod.partial(UserSchema);
  const result = partial.safeParse({});
  assert(result.success, "Partial should accept empty object");
});

test("Mod.partial() - should validate types when provided", () => {
  const partial = Mod.partial(UserSchema);
  const result = partial.safeParse({ id: "not a number" });
  assert(!result.success, "Partial should fail on wrong type");
});

// 6. required()
test("Mod.required() - should make all fields required", () => {
  const required = Mod.required(UserSchema);
  const result = required.safeParse({
    id: 1,
    name: "John",
    email: "john@example.com",
    age: 25,
  });
  assert(result.success, "Required should succeed with all fields");
});

// 7. makeOptional()
test("Mod.makeOptional() - should make specific fields optional", () => {
  const schema = Mod.makeOptional(UserSchema, ["email"]);
  const result = schema.safeParse({ id: 1, name: "John" });
  assert(result.success, "MakeOptional should succeed");
});

test("Mod.makeOptional() - should work with array-of-objects", () => {
  const schema = Mod.makeOptional(CourseSchema, ["modules"]);
  const result = schema.safeParse({
    id: "course-1",
    title: "TypeScript Course",
  });
  assert(result.success, "MakeOptional with arrays should succeed");
});

test("Mod.makeOptional() - should validate array when provided", () => {
  const schema = Mod.makeOptional(CourseSchema, ["modules"]);
  const result = schema.safeParse({
    id: "course-1",
    title: "TypeScript Course",
    modules: [{ id: "m1", title: "Intro", duration: 120 }],
  });
  assert(result.success, "MakeOptional should validate provided arrays");
});

test("Mod.makeOptional() - should fail on invalid array elements", () => {
  const schema = Mod.makeOptional(CourseSchema, ["modules"]);
  const result = schema.safeParse({
    id: "course-1",
    title: "TypeScript Course",
    modules: [{ id: "m1" }], // missing title and duration
  });
  assert(!result.success, "MakeOptional should fail on invalid array elements");
});

// 8. extend()
test("Mod.extend() - should extend schema with new fields", () => {
  const extended = Mod.extend(UserSchema, {
    role: "admin|user|guest",
  });
  const result = extended.safeParse({
    id: 1,
    name: "John",
    email: "john@example.com",
    role: "admin",
  });
  assert(result.success, "Extend should succeed");
});

// 9. deepPartial()
test("Mod.deepPartial() - should make nested fields optional", () => {
  const partial = Mod.deepPartial(ProfileSchema);
  const result = partial.safeParse({ social: { twitter: "@john" } });
  assert(result.success, "DeepPartial should succeed");
});

// 10. transform()
test("Mod.transform() - should transform field types", () => {
  const transformed = Mod.transform(UserSchema, (fieldType, fieldName) => {
    if (fieldName === "id") return "uuid";
    return fieldType;
  });
  const result = transformed.safeParse({
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "John",
    email: "john@example.com",
  });
  assert(result.success, "Transform should succeed");
});

// 11. rename()
test("Mod.rename() - should rename fields", () => {
  const renamed = Mod.rename(UserSchema, { id: "userId", name: "fullName" });
  const result = renamed.safeParse({
    userId: 1,
    fullName: "John",
    email: "john@example.com",
  });
  assert(result.success, "Rename should succeed");
});

// 12. defaults()
test("Mod.defaults() - should work with defaults", () => {
  const ProductSchema = Interface({
    id: "uuid",
    title: "string",
    price: "number",
  });
  const withDefaults = Mod.defaults(ProductSchema, { price: 0 });
  const result = withDefaults.safeParse({
    id: "550e8400-e29b-41d4-a716-446655440000",
    title: "Product",
    price: 99.99,
  });
  assert(result.success, "Defaults should succeed");
});

// 13. strict()
test("Mod.strict() - should create strict schema", () => {
  const strict = Mod.strict(UserSchema);
  const result = strict.safeParse({
    id: 1,
    name: "John",
    email: "john@example.com",
  });
  assert(result.success, "Strict should succeed with exact fields");
});

// 14. passthrough()
test("Mod.passthrough() - should allow additional properties", () => {
  const passthrough = Mod.passthrough(UserSchema);
  const result = passthrough.safeParse({
    id: 1,
    name: "John",
    email: "john@example.com",
    extra: "field",
  });
  assert(result.success, "Passthrough should succeed");
});

// 15. nullable()
test("Mod.nullable() - should allow null values", () => {
  const nullable = Mod.nullable(UserSchema);
  const result = nullable.safeParse({
    id: null,
    name: null,
    email: null,
    age: null,
  });
  assert(result.success, "Nullable should accept null values");
});

// Note: Mod.nullable() has issues with optional fields (creates "number?|null" which is invalid)
// This is a known limitation - nullable works best with schemas that have all required fields

// 16. info()
test("Mod.info() - should return schema information", () => {
  const info = Mod.info(UserSchema);
  assert(info.fieldCount === 4, "Field count should be 4");
  assert(info.requiredFields === 3, "Required fields should be 3");
  assert(info.optionalFields === 1, "Optional fields should be 1");
});

// 17. clone()
test("Mod.clone() - should create independent clone", () => {
  const cloned = Mod.clone(UserSchema);
  const result = cloned.safeParse({
    id: 1,
    name: "John",
    email: "john@example.com",
  });
  assert(result.success, "Clone should work");
});

// Complex combinations
test("Complex: partial + pick + extend", () => {
  const transformed = Mod.partial(
    Mod.pick(Mod.extend(UserSchema, { role: "admin|user" }), [
      "id",
      "name",
      "role",
    ])
  );
  const result = transformed.safeParse({ id: 1 });
  assert(result.success, "Complex transformation should succeed");
});

test("Complex: merge + makeOptional", () => {
  const SimpleProfile = Interface({ bio: "string?", role: "string" });
  const merged = Mod.merge(UserSchema, SimpleProfile);
  const optional = Mod.makeOptional(merged, ["email", "role"]);
  const result = optional.safeParse({ id: 1, name: "John" });
  assert(result.success, "Complex merge + makeOptional should succeed");
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
