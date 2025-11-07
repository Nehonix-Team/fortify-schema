# Custom Error Messages

**Introduced in version 1.x.x**

Custom error messages allow you to provide user-friendly, context-specific error messages for validation failures. Instead of generic error messages, you can guide users with clear, actionable feedback.

## Table of Contents

- [Syntax](#syntax)
- [Basic Usage](#basic-usage)
- [Advanced Examples](#advanced-examples)
- [Best Practices](#best-practices)
- [Type Inference](#type-inference)
- [Combining with Other Features](#combining-with-other-features)
- [FAQ](#faq)

## Syntax

The custom error message syntax uses the `-->` operator:

```typescript
"type --> Your custom error message"
```

**Key Points:**
- The `-->` operator separates the type definition from the error message
- Spaces around `-->` are optional: `"type-->message"`, `"type--> message"`, or `"type --> message"` all work
- Works with all type definitions, constraints, and modifiers
- TypeScript inference correctly strips the message and infers the actual type

## Basic Usage

### Simple Type Validation

```typescript
import { Interface } from "fortify-schema";

const schema = Interface({
  name: "string --> Please provide your name",
  age: "number --> Age must be a valid number",
  email: "email --> Please enter a valid email address",
});

const result = schema.safeParse({
  name: 123, // Wrong type
});

console.log(result.errors[0].message);
// Output: "Validation failed: Please provide your name in field \"name\""
```

### With Constraints

```typescript
const ProductSchema = Interface({
  price: "number(0.01,) --> Price must be greater than 0",
  quantity: "int(1,1000) --> Quantity must be between 1 and 1000",
  name: "string(3,100) --> Product name must be 3-100 characters",
});
```

### With Union Types

```typescript
const StatusSchema = Interface({
  status: "pending|approved|rejected --> Status must be pending, approved, or rejected",
  role: "admin|user|guest --> Invalid role selected",
});
```

## Advanced Examples

### Required Fields

Combine with the `!` (required) modifier:

```typescript
const FormSchema = Interface({
  email: "email! --> Email is required and must be valid",
  password: "string(8,)! --> Password must be at least 8 characters",
  terms: "boolean! --> You must accept the terms and conditions",
});

const result = FormSchema.safeParse({
  email: null, // Null value
});

console.log(result.errors[0].message);
// Output: "Validation failed: Email is required and must be valid in field \"email\""
```

### Optional Fields

Combine with the `?` (optional) modifier:

```typescript
const UserSchema = Interface({
  phone: "string? --> Phone number must be a string if provided",
  bio: "string(10,500)? --> Bio must be 10-500 characters if provided",
  website: "url? --> Please provide a valid URL if you have a website",
});
```

### Array Validation

```typescript
const PlaylistSchema = Interface({
  songs: "string[] --> Playlist must contain an array of song titles",
  tags: "string[](1,10) --> You must provide 1-10 tags",
});
```

### Nested Objects

```typescript
const ProfileSchema = Interface({
  user: {
    name: "string --> Name is required",
    email: "email --> Please provide a valid email",
    settings: {
      theme: "light|dark --> Theme must be light or dark",
      notifications: "boolean --> Notifications must be enabled or disabled",
    },
  },
});
```

### Complex Constraints

```typescript
const RegistrationSchema = Interface({
  username: "string(3,20)! --> Username must be 3-20 characters and cannot be empty",
  age: "number(18,100) --> You must be between 18 and 100 years old",
  email: "email! --> A valid email address is required",
  country: "string(2,2) --> Country code must be exactly 2 characters",
});
```

## Best Practices

### 1. Be Clear and Actionable

❌ **Bad:**
```typescript
name: "string --> Invalid"
```

✅ **Good:**
```typescript
name: "string --> Please provide your full name"
```

### 2. Include Constraint Details

❌ **Bad:**
```typescript
age: "number(18,65) --> Invalid age"
```

✅ **Good:**
```typescript
age: "number(18,65) --> Age must be between 18 and 65"
```

### 3. Use Consistent Tone

```typescript
const schema = Interface({
  email: "email --> Please enter a valid email address",
  phone: "string --> Please provide your phone number",
  address: "string --> Please enter your full address",
});
```

### 4. Consider Internationalization

For multi-language apps, consider using error codes:

```typescript
const schema = Interface({
  email: "email --> ERR_INVALID_EMAIL",
});

// Then map error codes to localized messages
const errorMessages = {
  en: { ERR_INVALID_EMAIL: "Please enter a valid email address" },
  es: { ERR_INVALID_EMAIL: "Por favor ingrese un correo electrónico válido" },
  fr: { ERR_INVALID_EMAIL: "Veuillez entrer une adresse e-mail valide" },
};
```

### 5. Keep Messages Concise

❌ **Too verbose:**
```typescript
name: "string --> We're sorry, but the name you provided doesn't meet our requirements. Please make sure to enter a valid name that contains only letters and is between 2 and 50 characters long."
```

✅ **Concise:**
```typescript
name: "string(2,50) --> Name must be 2-50 characters"
```

## Type Inference

TypeScript correctly infers types even with custom error messages:

```typescript
const schema = Interface({
  status: "pending|approved|rejected --> Invalid status",
  count: "number --> Count must be a number",
});

// TypeScript knows:
// status: "pending" | "approved" | "rejected"
// count: number

const data = schema.parse({
  status: "pending", // ✅ TypeScript accepts this
  // status: "invalid", // ❌ TypeScript error: not in union
  count: 42,
});
```

## Combining with Other Features

### With Conditional Validation

```typescript
const schema = Interface({
  accountType: "free|premium --> Account type must be free or premium",
  maxProjects: "when accountType=free *? int(1,3) --> Free accounts can have 1-3 projects : int(1,100) --> Premium accounts can have 1-100 projects",
});
```

### With Record Types

```typescript
const ConfigSchema = Interface({
  settings: "record<string, string> --> Settings must be a key-value object",
  metadata: "record<string, any> --> Metadata must be an object",
});
```

### With Required and Optional Together

```typescript
const FormSchema = Interface({
  // Required field with custom message
  email: "email! --> Email is required",
  
  // Optional field with custom message
  phone: "string? --> Phone is optional but must be valid if provided",
  
  // Required with constraints
  password: "string(8,)! --> Password must be at least 8 characters",
});
```

## FAQ

### Q: Can I use `-->` in the error message itself?

**A:** Yes, only the first `-->` is used as the separator:

```typescript
name: "string --> Use format: FirstName --> LastName"
// Type: string
// Message: "Use format: FirstName --> LastName"
```

### Q: What happens if I don't provide a custom message?

**A:** The default error message is used:

```typescript
name: "string" // Default: "Expected String, but received ..."
```

### Q: Can I use emojis in custom messages?

**A:** Yes! Emojis work perfectly:

```typescript
email: "email --> 📧 Please provide a valid email address",
age: "number(18,) --> 🔞 You must be 18 or older",
```

### Q: Do custom messages work with all validators?

**A:** Yes! Custom messages work with:
- ✅ Basic types (`string`, `number`, `boolean`, etc.)
- ✅ Format types (`email`, `url`, `uuid`, etc.)
- ✅ Constraints (`string(min,max)`, `number(min,max)`, etc.)
- ✅ Union types (`admin|user|guest`)
- ✅ Arrays (`string[]`, `number[]`, etc.)
- ✅ Required fields (`string!`, `number!`)
- ✅ Optional fields (`string?`, `number?`)
- ✅ Nested objects

### Q: Does this affect performance?

**A:** Minimal impact. The parser extracts the message once during schema creation. Validation performance is nearly identical to schemas without custom messages.

### Q: Can I change error messages dynamically?

**A:** Error messages are defined at schema creation time. For dynamic messages, consider:

```typescript
function createSchema(lang: string) {
  const messages = {
    en: "Please enter a valid email",
    es: "Por favor ingrese un correo válido",
  };
  
  return Interface({
    email: `email --> ${messages[lang]}`,
  });
}
```

## Examples Repository

Check out our [examples repository](https://github.com/Nehonix-Team/fortify-schema/tree/main/examples) for more real-world use cases:

- Form validation with custom messages
- API request validation
- Multi-language error messages
- E-commerce product validation
- User registration flows

## Related Documentation

- [Required Fields (`!` syntax)](./REQUIRED-FIELDS.md)
- [Optional Fields (`?` syntax)](./OPTIONAL-FIELDS.md)
- [Union Types](./UNION-TYPES.md)
- [Conditional Validation](./CONDITIONAL-VALIDATION-GUIDE.md)
- [Error Handling](./ERROR-HANDLING.md)

---

**Need help?** Join our [Discord community](https://discord.gg/nehonix) or [open an issue](https://github.com/Nehonix-Team/fortify-schema/issues).
