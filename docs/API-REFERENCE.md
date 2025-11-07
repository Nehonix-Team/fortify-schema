# API Reference

Complete reference for all Fortify Schema APIs.

## Table of Contents

- [Core Validation Methods](#core-validation-methods)
- [Utility Functions](#utility-functions)
- [Schema Options](#schema-options)
- [Type Definitions](#type-definitions)
- [Error Handling](#error-handling)

## Core Validation Methods

### `Interface(schema, options?)`

Creates a new schema instance with comprehensive validation rules.

**Parameters:**
- `schema`: Object defining the validation schema
- `options?`: Optional configuration object

**Returns:** Schema instance with validation methods

**Example:**
```typescript
const UserSchema = Interface(
  {
    name: "string",
    email: "email",
    age: "number?",
  },
  {
    strict: true,
    loose: false,
  }
);
```

### `schema.parse(data)`

Synchronous validation that returns validated data or throws detailed errors.

**Parameters:**
- `data`: Data to validate

**Returns:** Validated and typed data

**Throws:** `ValidationError` if validation fails

**Example:**
```typescript
try {
  const user = UserSchema.parse(userData);
  console.log(user); // Fully typed
} catch (error) {
  console.error(error.errors);
}
```

### `schema.safeParse(data)`

Safe validation that returns a result object without throwing exceptions.

**Parameters:**
- `data`: Data to validate

**Returns:** `{ success: boolean, data?: T, errors?: ValidationError[] }`

**Example:**
```typescript
const result = UserSchema.safeParse(userData);
if (result.success) {
  console.log(result.data); // Fully typed
} else {
  console.log(result.errors);
}
```

### `schema.safeParseUnknown(data)`

Safe validation for unknown data types, ideal for testing and debugging.

**Parameters:**
- `data`: Any data type

**Returns:** Same as `safeParse()`

**Example:**
```typescript
const result = UserSchema.safeParseUnknown(unknownData);
// Same return type as safeParse() but accepts any input type
```

### `schema.parseAsync(data)`

Asynchronous validation with promise-based error handling.

**Parameters:**
- `data`: Data to validate

**Returns:** `Promise<T>` - Resolves with validated data or rejects with error

**Example:**
```typescript
try {
  const user = await UserSchema.parseAsync(userData);
  console.log(user);
} catch (error) {
  console.error(error.errors);
}
```

### `schema.safeParseAsync(data)`

Asynchronous safe validation that never throws.

**Parameters:**
- `data`: Data to validate

**Returns:** `Promise<{ success: boolean, data?: T, errors?: ValidationError[] }>`

**Example:**
```typescript
const result = await UserSchema.safeParseAsync(userData);
if (result.success) {
  console.log(result.data);
}
```

## Utility Functions

### `Make.const(value)`

Creates a constant value validator.

**Parameters:**
- `value`: The exact value to validate against

**Returns:** Constant validator

**Example:**
```typescript
import { Make, Interface } from "fortify-schema";

const schema = Interface({
  version: Make.const("1.0.0"),
  type: Make.const("user"),
});
```

### `Make.union(...values)`

Creates a union type validator.

**Parameters:**
- `...values`: Literal values for the union

**Returns:** Union validator

**Example:**
```typescript
const schema = Interface({
  role: Make.union("admin", "user", "guest"),
});
```

### `Make.unionOptional(...values)`

Creates an optional union type validator.

**Parameters:**
- `...values`: Literal values for the union

**Returns:** Optional union validator

**Example:**
```typescript
const schema = Interface({
  role: Make.unionOptional("admin", "user", "guest"),
  // Same as: role: "(admin|user|guest)?"
});
```

### `Mod` Utilities

Schema transformation and manipulation utilities.

#### `Mod.pick(schema, keys)`

Creates a new schema with only specified keys.

**Example:**
```typescript
import { Mod } from "fortify-schema";

const UserSchema = Interface({
  id: "number",
  name: "string",
  email: "email",
  age: "number?",
});

const PublicUserSchema = Mod.pick(UserSchema, ["name", "email"]);
// Only validates: { name: string, email: string }
```

#### `Mod.omit(schema, keys)`

Creates a new schema excluding specified keys.

**Example:**
```typescript
const UserWithoutId = Mod.omit(UserSchema, ["id"]);
// Validates everything except 'id'
```

#### `Mod.partial(schema)`

Makes all fields optional.

**Example:**
```typescript
const PartialUser = Mod.partial(UserSchema);
// All fields become optional
```

#### `Mod.required(schema)`

Makes all fields required.

**Example:**
```typescript
const RequiredUser = Mod.required(UserSchema);
// All fields become required (!)
```

#### `Mod.merge(schema1, schema2)`

Merges two schemas.

**Example:**
```typescript
const BaseSchema = Interface({ id: "number", name: "string" });
const ExtendedSchema = Interface({ email: "email", age: "number?" });

const MergedSchema = Mod.merge(BaseSchema, ExtendedSchema);
// Contains all fields from both schemas
```

## Schema Options

Configure schema behavior with options:

```typescript
const schema = Interface(
  { /* schema definition */ },
  {
    strict: true,        // Reject extra properties
    loose: false,        // Allow type coercion
    default: undefined,  // Default value for undefined fields
  }
);
```

### Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `strict` | `boolean` | `false` | Reject objects with extra properties |
| `loose` | `boolean` | `false` | Allow type coercion (e.g., "123" → 123) |
| `default` | `any` | `undefined` | Default value for undefined optional fields |

## Type Definitions

### ValidationResult

```typescript
type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
};
```

### ValidationError

```typescript
type ValidationError = {
  path: (string | number)[];
  message: string;
  code: ErrorCode;
  expected: string;
  received: any;
  receivedType: string;
  context?: any;
};
```

### ErrorCode

```typescript
enum ErrorCode {
  ETYPE = "ETYPE",
  EVALIDATION = "EVALIDATION",
  EMISSING = "EMISSING",
  EARRAY = "EARRAY",
  ESTRING = "ESTRING",
  ENUMBER = "ENUMBER",
  // ... more codes
}
```

## Error Handling

### Error Structure

All validation errors follow a consistent structure:

```typescript
{
  path: ["user", "email"],           // Path to the invalid field
  message: "Invalid email format",   // Human-readable message
  code: "EVALIDATION",               // Error code
  expected: "email",                 // Expected type/format
  received: "not-an-email",          // Actual value received
  receivedType: "String",            // Type of received value
  context: undefined                 // Additional context
}
```

### Custom Error Messages

Use the `-->` operator for custom error messages:

```typescript
const schema = Interface({
  email: "email --> Please provide a valid email address",
  age: "number(18,100) --> Age must be between 18 and 100",
});
```

### Error Handling Patterns

#### Try-Catch Pattern

```typescript
try {
  const data = schema.parse(input);
  // Use validated data
} catch (error) {
  if (error.errors) {
    error.errors.forEach(err => {
      console.log(`${err.path.join('.')}: ${err.message}`);
    });
  }
}
```

#### Safe Parse Pattern

```typescript
const result = schema.safeParse(input);

if (!result.success) {
  result.errors?.forEach(err => {
    console.log(`Field: ${err.path.join('.')}`);
    console.log(`Error: ${err.message}`);
  });
  return;
}

// Use result.data
```

#### Async Pattern

```typescript
const result = await schema.safeParseAsync(input);

if (result.success) {
  // Process result.data
} else {
  // Handle result.errors
}
```

## Type Inference

Fortify Schema provides full TypeScript type inference:

```typescript
const UserSchema = Interface({
  id: "number",
  name: "string",
  email: "email",
  role: "admin|user|guest",
  age: "number?",
});

// Inferred type:
type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user" | "guest";
  age?: number | null;
};

// Use InferSchemaType for explicit typing
import { InferSchemaType } from "fortify-schema";
type User = InferSchemaType<typeof UserSchema>;
```

## Advanced Features

### Conditional Validation

See [Conditional Validation Guide](./CONDITIONAL-VALIDATION-GUIDE.md) for details.

```typescript
const schema = Interface({
  accountType: "free|premium",
  maxProjects: "when accountType=free *? int(1,3) : int(1,100)",
});
```

### Live Validation

See [Live Utility Guide](./LIVE-UTILITY.md) for details.

```typescript
import { Live } from "fortify-schema";

const liveValidator = Live.stream(UserSchema);
liveValidator.on("valid", (data) => console.log("Valid:", data));
liveValidator.on("invalid", (errors) => console.log("Errors:", errors));
```

## Performance

### Precompilation

Fortify Schema automatically precompiles simple schemas for optimal performance:

```typescript
// Automatically precompiled
const FastSchema = Interface({
  name: "string",
  age: "number",
  email: "email",
});
```

### Benchmarking

Run performance tests:

```bash
npm run benchmark
npm run benchmark:nestedObject
```

## Related Documentation

- [Installation](./INSTALLATION.md)
- [Core Features](./CORE-FEATURES.md)
- [Conditional Validation](./CONDITIONAL-VALIDATION-GUIDE.md)
- [Custom Error Messages](./CUSTOM-ERROR-MESSAGES.md)
- [Performance Guide](./PERFORMANCE.md)

## Support

- [GitHub Issues](https://github.com/Nehonix-Team/fortify-schema/issues)
- [Discord Community](https://discord.gg/nehonix)
- [Examples](../examples/)
