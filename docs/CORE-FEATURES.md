# Core Features

## Table of Contents

- [Intuitive Schema Definition](#intuitive-schema-definition)
- [Comprehensive Type Support](#comprehensive-type-support)
- [Deep Object Validation](#deep-object-validation)
- [Utility Functions](#utility-functions)
- [Type Modifiers](#type-modifiers)

## Intuitive Schema Definition

Define schemas with familiar TypeScript-like syntax:

```typescript
import { Interface } from "fortify-schema";

const ProductSchema = Interface({
  id: "uuid",
  name: "string(3,100)",
  price: "number(0.01,)",
  inStock: "boolean",
  category: "electronics|clothing|food",
  tags: "string[]",
  metadata: "object?",
});

// Validate with full type inference
const result = ProductSchema.safeParse(productData);
if (result.success) {
  console.log(result.data); // Fully typed product data
}
```

## Comprehensive Type Support

### Basic Types

```typescript
const BasicTypes = Interface({
  // Primitives
  text: "string",
  count: "number",
  active: "boolean",
  created: "date",
  
  // Any type (use sparingly)
  metadata: "any",
});
```

### String Formats

```typescript
const StringFormats = Interface({
  email: "email",
  website: "url",
  userId: "uuid",
  phone: "phone",
  slug: "slug",
  username: "username",
});
```

### Number Types

```typescript
const NumberTypes = Interface({
  age: "int",
  score: "integer",
  temperature: "float",
  precision: "double",
  profit: "positive",
  debt: "negative",
});
```

### Constraints

```typescript
const WithConstraints = Interface({
  // String length
  username: "string(3,20)",
  bio: "string(10,500)",
  
  // Number range
  age: "number(18,120)",
  score: "int(0,100)",
  price: "float(0.01,)",
  
  // Array length
  tags: "string[](1,10)",
});
```

### Union Types

```typescript
const UnionTypes = Interface({
  // Literal unions
  status: "pending|approved|rejected",
  role: "admin|user|guest",
  
  // Type unions
  value: "string|number",
  id: "string|int",
});
```

### Arrays

```typescript
const ArrayTypes = Interface({
  // Simple arrays
  tags: "string[]",
  scores: "number[]",
  flags: "boolean[]",
  
  // Arrays with constraints
  limitedTags: "string[](1,5)",
  
  // Arrays of objects
  users: [{
    name: "string",
    email: "email",
  }],
});
```

### Optional and Required

```typescript
const Modifiers = Interface({
  // Optional (can be null/undefined)
  nickname: "string?",
  age: "number?",
  
  // Required (non-null, non-empty, non-zero)
  email: "email!",
  password: "string(8,)!",
  termsAccepted: "boolean!",
});
```

## Deep Object Validation

Validate nested object structures:

```typescript
const UserProfileSchema = Interface({
  id: "uuid",
  personal: {
    firstName: "string(2,50)",
    lastName: "string(2,50)",
    email: "email",
    phone: "phone?",
  },
  address: {
    street: "string",
    city: "string",
    country: "string(2,2)", // ISO country code
    zipCode: "string",
  },
  preferences: {
    theme: "light|dark",
    notifications: "boolean",
    language: "string(2,5)",
  },
});
```

## Utility Functions

### Make.const() - Constant Values

Create schemas that validate against exact constant values:

```typescript
import { Interface, Make } from "fortify-schema";

const ConfigSchema = Interface({
  version: Make.const("1.0.0"),
  environment: Make.const("production"),
  apiVersion: Make.const("v2"),
});

// Only accepts exact values
ConfigSchema.parse({ version: "1.0.0" }); // ✅ Valid
ConfigSchema.parse({ version: "2.0.0" }); // ❌ Invalid
```

**Alternative Syntax:**
```typescript
const ConfigSchema = Interface({
  version: "=1.0.0",
  environment: "=production",
});
```

### Make.union() - Union Types

Create union types programmatically:

```typescript
const StatusSchema = Interface({
  status: Make.union("pending", "approved", "rejected"),
  role: Make.union("admin", "user", "guest"),
});

// Alternative syntax
const StatusSchema2 = Interface({
  status: "pending|approved|rejected",
});
```

### Make.unionOptional() - Optional Unions

Create optional union types:

```typescript
const UserSchema = Interface({
  role: Make.unionOptional("admin", "user", "guest"),
  // Same as: role: "(admin|user|guest)?"
});
```

### Record Types - Dynamic Objects

Validate objects with dynamic keys but consistent value types:

```typescript
const ConfigSchema = Interface({
  // String keys, string values
  settings: "record<string, string>",
  
  // String keys, number values
  scores: "record<string, number>",
  
  // String keys, any values
  metadata: "record<string, any>",
});

// Valid data
const config = {
  settings: {
    theme: "dark",
    language: "en",
    timezone: "UTC",
  },
  scores: {
    math: 95,
    science: 87,
    history: 92,
  },
  metadata: {
    lastLogin: new Date(),
    preferences: { notifications: true },
    count: 42,
  },
};
```

## Type Modifiers

### Optional (`?`)

Fields can be `null`, `undefined`, or the specified type:

```typescript
const schema = Interface({
  nickname: "string?",    // string | null | undefined
  age: "number?",         // number | null | undefined
  tags: "string[]?",      // string[] | null | undefined
});
```

### Required (`!`)

Fields cannot be `null`, `undefined`, empty strings, or zero:

```typescript
const schema = Interface({
  email: "email!",        // Must be valid email, not null/undefined
  password: "string(8,)!", // Must be 8+ chars, not empty
  age: "number!",         // Must be number, not zero
  accepted: "boolean!",   // Must be true or false, not null
});
```

### Custom Error Messages (`-->`)

Provide user-friendly error messages:

```typescript
const schema = Interface({
  email: "email! --> Please provide a valid email address",
  age: "number(18,100) --> Age must be between 18 and 100",
  role: "admin|user|guest --> Invalid role selected",
});
```

## Object Types

Validate generic object structures:

```typescript
const schema = Interface({
  // Any object structure
  config: "object",
  
  // Optional object
  metadata: "object?",
  
  // Required object (non-null)
  settings: "object!",
});
```

## Performance Tips

1. **Reuse Schemas**: Create schemas once and reuse them
2. **Avoid Deep Nesting**: Limit nesting to 50-100 levels for optimal performance
3. **Use Precompilation**: Fortify Schema automatically precompiles simple schemas
4. **Batch Validation**: Validate multiple items efficiently

```typescript
// ✅ Good: Reuse schema
const userSchema = Interface({ name: "string", email: "email" });
users.forEach(user => userSchema.safeParse(user));

// ❌ Bad: Create schema in loop
users.forEach(user => {
  const schema = Interface({ name: "string", email: "email" });
  schema.safeParse(user);
});
```

## Related Documentation

- [Conditional Validation](./CONDITIONAL-VALIDATION-GUIDE.md) - Advanced runtime validation
- [Custom Error Messages](./CUSTOM-ERROR-MESSAGES.md) - User-friendly error messages
- [API Reference](./API-REFERENCE.md) - Complete API documentation
- [Type Inference](./TYPE-INFERENCE.md) - TypeScript type inference
- [Performance](./PERFORMANCE.md) - Performance optimization guide

## Examples

Check out our [examples directory](../examples/) for real-world use cases:

- Form validation
- API request/response validation
- Configuration validation
- E-commerce product schemas
- User authentication flows
