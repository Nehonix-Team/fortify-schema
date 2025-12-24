# Fortify Schema Reference Documentation

Fortify Schema is a TypeScript-first validation library designed around familiar interface syntax and powerful conditional validation. This reference documentation provides a comprehensive guide to all available types, modifiers, constraints, utility functions, union types, and conditional logic supported by Fortify Schema.

_Powered by [Nehonix](https://nehonix.com) - Empowering developers since 2025._
_See full documentation on [GitHub](https://github.com/Nehonix-Team/fortify-schema) or via [lab.nehonix.com](https://lab.nehonix.com)_

## 🆕 Latest Features

Fortify Schema is constantly evolving to provide the best developer experience. The latest features include:

- **Required Fields (`!`)**: Enforce non-empty strings and non-zero numbers
- **Object Types**: Validate generic object structures with `"object"`
- **Enhanced Security**: All string operations use secure regex patterns
- **Improved Conditional Syntax**: Better support for `$exists()` and other runtime methods

## Table of Contents

- [Basic Types](#basic-types)
- [Format Types](#format-types)
- [Numeric Types](#numeric-types)
- [Advanced Types](#advanced-types)
- [Modifiers](#modifiers)
- [Constraints](#constraints)
- [Utility Functions](#utility-functions)
- [Union Types](#union-types)
- [Conditional Logic](#conditional-logic)

---

## Basic Types

### `string`

**Description:** Validates string values.
**Example:** `"string"`, `"string?"`, `"string[]"`
**Use Cases:** Names, descriptions, text content

```typescript
const schema = Interface({
  name: "string",
  description: "string?",
});
```

### `int`

**Description:** Validates integer values.
**Example:** `"int"`, `"int(1,100)"`, `"int?"`, `"int[]"`
**Use Cases:** IDs, counts, measurements

```typescript
const schema = Interface({
  id: "int",
  age: "int(0,120)",
  quantity: "int?",
  scores: "int[]",
});
```

### `float`

**Description:** Validates floating-point values.
**Example:** `"float"`, `"float(1,100)"`, `"float?"`, `"float[]"`
**Use Cases:** IDs, counts, measurements

```typescript
const schema = Interface({
  id: "float",
  age: "float(0,120)",
  scores: "float[]",
});
```

### `double`

**Description:** Validates double-precision floating-point values.
**Example:** `"double"`, `"double(1,100)"`, `"double?"`, `"double[]"`
**Use Cases:** IDs, counts, measurements

```typescript
const schema = Interface({
  id: "double",
  age: "double(0,120)",
  scores: "double[]",
});
```

### `number`

**Description:** Validates numeric values (integers and floats).
**Example:** `"number"`, `"number(1,100)"`, `"number[]"`
**Use Cases:** IDs, counts, measurements

```typescript
const schema = Interface({
  id: "number",
  age: "number(0,120)",
  scores: "number[]",
});
```

### `boolean`

**Description:** Validates boolean values (true/false).
**Example:** `"boolean"`, `"boolean?"`
**Use Cases:** Flags, toggles, status indicators

```typescript
const schema = Interface({
  isActive: "boolean",
  hasPermission: "boolean?",
});
```

### `date`

**Description:** Validates Date objects and ISO date strings.
**Example:** `"date"`, `"date?"`, `"date[]"`
**Use Cases:** Timestamps, birthdays, deadlines

```typescript
const schema = Interface({
  createdAt: "date",
  updatedAt: "date?",
  milestones: "date[]",
});
```

### `any`

**Description:** Accepts any value type (use sparingly).
**Example:** `"any"`, `"any?"`
**Use Cases:** Dynamic content, migration scenarios

```typescript
const schema = Interface({
  metadata: "any",
  config: "record<string, any>",
});
```

---

## Format Types

### `email`

**Description:** Validates email addresses with proper format.
**Example:** `"email"`, `"email?"`, `"email[]"`
**Validation:** Must contain @ symbol and valid domain structure

```typescript
const schema = Interface({
  primaryEmail: "email",
  alternateEmails: "email[]",
});
```

### `url`

**Description:** Validates URL strings.
**Example:** `"url"`, `"url?"`, `"url.https"`
**Variants:** `url.http`, `url.https`, `url.dev`

```typescript
const schema = Interface({
  website: "url",
  apiEndpoint: "url.https",
  devUrl: "url.dev?",
});
```

### `ip`

**Description:** Validates IP address formats (IPv4 and IPv6).
**Example:** `"ip"`, `"ip?"`, `"ip[]"`
**Use Cases:** Network addresses, server configurations

```typescript
const schema = Interface({
  serverIp: "ip",
  clientIps: "ip[]",
});
```

### `json`

**Description:** Validates JSON strings.
**Example:** `"json"`, `"json?"`, `"json.fast"`, `"json.secure"`
**Variants:** `json.fast`, `json.secure`

```typescript
const schema = Interface({
  config: "json",
  data: "json.fast?",
});
```

### `hexcolor`

**Description:** Validates hex color codes.
**Example:** `"hexcolor"`, `"hexcolor?"`, `"hexcolor[]"`
**Validation:** Must be in #RGB, #RRGGBB, or #RRGGBBAA format

```typescript
const schema = Interface({
  primaryColor: "hexcolor",
  secondaryColors: "hexcolor[]",
});
```

### `base64`

**Description:** Validates Base64 encoded strings.
**Example:** `"base64"`, `"base64?"`, `"base64[]"`
**Validation:** Must be properly formatted Base64 string

```typescript
const schema = Interface({
  encodedData: "base64",
  attachments: "base64[]",
});
```

### `jwt`

**Description:** Validates JSON Web Token format.
**Example:** `"jwt"`, `"jwt?"`, `"jwt[]"`
**Validation:** Must have proper header, payload, and signature

```typescript
const schema = Interface({
  authToken: "jwt",
  refreshTokens: "jwt[]",
});
```

### `semver`

**Description:** Validates Semantic Versioning format.
**Example:** `"semver"`, `"semver?"`, `"semver[]"`
**Validation:** Must be in X.Y.Z format

```typescript
const schema = Interface({
  appVersion: "semver",
  compatibleVersions: "semver[]",
});
```

### `slug`

**Description:** Validates slug strings (URL-friendly).
**Example:** `"slug"`, `"slug?"`
**Validation:** Must contain only alphanumeric characters, dashes, and underscores

```typescript
const schema = Interface({
  username: "slug",
  postId: "slug?",
});
```

### `username`

**Description:** Validates username formats (alphanumeric, underscores, hyphens).
**Example:** `"username"`, `"username?"`
**Validation:** Must be 3-20 characters long

```typescript
const schema = Interface({
  username: "username",
  handle: "username?",
});
```

### `phone`

**Description:** Validates phone number formats.
**Example:** `"phone"`, `"phone?"`
**Use Cases:** Contact information

```typescript
const schema = Interface({
  mobile: "phone",
  landline: "phone?",
});
```

### `uuid`

**Description:** Validates UUID strings (v4 format).
**Example:** `"uuid"`, `"uuid?"`
**Use Cases:** Unique identifiers, database keys

```typescript
const schema = Interface({
  id: "uuid",
  sessionId: "uuid?",
});
```

### `password`

**Description:** Validates password formats (length, complexity).
**Example:** `"password"`, `"password?"`
**Use Cases:** User authentication

```typescript
const schema = Interface({
  password: "password",
  newPassword: "password?",
});
```

### `text`

**Description:** Validates multi-line text content.
**Example:** `"text"`, `"text?"`
**Use Cases:** Descriptions, comments, notes

```typescript
const schema = Interface({
  description: "text",
  comments: "text[]",
});
```

### `object`

**Description:** Validates object types.
**Example:** `"object"`, `"object?"`
**Use Cases:** Complex data structures

```typescript
const schema = Interface({
  profile: "object",
  settings: "object?",
});
```

---

## Numeric Types

### `positive`

**Description:** Validates positive numbers (> 0).
**Example:** `"positive"`, `"positive(1,100)"`
**Use Cases:** Quantities, prices, counts

```typescript
const schema = Interface({
  price: "positive",
  quantity: "positive(1,999)",
});
```

### `negative`

**Description:** Validates negative numbers (< 0).
**Example:** `"negative"`, `"negative(-100,-1)"`
**Use Cases:** Debts, temperature below zero

```typescript
const schema = Interface({
  debt: "negative",
  temperature: "negative(-50,0)",
});
```

### `double`

**Description:** Validates floating-point numbers with decimal precision.
**Example:** `"double"`, `"double(0.1,99.9)"`
**Use Cases:** Precise measurements, percentages

```typescript
const schema = Interface({
  percentage: "double(0,100)",
  measurement: "double",
});
```

---

## Advanced Types

### `record<K, V>`

**Description:** Validates objects with dynamic keys of type K and values of type V.
**Example:** `"record<string, any>"`, `"record<string, number>"`
**Use Cases:** Dynamic mappings, configuration objects

```typescript
const schema = Interface({
  settings: "record<string, string>",
  counters: "record<string, number>",
  metadata: "record<string, any>",
});
```

---

## Modifiers

### Optional (`?`)

**Description:** Makes a field optional (can be undefined).
**Example:** `"string?"`, `"number?"`, `"email?"`
**Usage:** Append `?` to any type

```typescript
const schema = Interface({
  required: "string",
  optional: "string?",
});
```

### Required (`!`)

**Description:** Makes a field required and non-empty (strings cannot be empty, numbers cannot be zero).
**Example:** `"string!"`, `"number!"`, `"email!"`
**Usage:** Append `!` to any type

```typescript
const schema = Interface({
  name: "string!", // Cannot be empty string
  count: "number!", // Cannot be zero
  email: "email!", // Cannot be empty email
  tags: "string[]!", // Array cannot be empty
});
```

### Arrays (`[]`)

**Description:** Validates arrays of the specified type.
**Example:** `"string[]"`, `"number[]"`, `"email[]"`
**Usage:** Append `[]` to any type

```typescript
const schema = Interface({
  tags: "string[]",
  scores: "number[]",
  contacts: "email[]",
});
```

### Array with Constraints (`[](min,max)`)

**Description:** Validates arrays with length constraints.
**Example:** `"string[](1,5)"`, `"number[](0,10)"`
**Usage:** Append `[](min,max)` to any type

```typescript
const schema = Interface({
  tags: "string[](1,10)",
  scores: "number[](3,5)",
});
```

---

## Constraints

### Numeric Constraints `(min,max)`

**Description:** Validates numbers within a specific range.
**Example:** `"number(1,100)"`, `"positive(0,999)"`
**Usage:** Works with all numeric types

```typescript
const schema = Interface({
  age: "number(0,120)",
  score: "positive(1,100)",
  temperature: "double(-50.0,50.0)",
});
```

### String Length Constraints `(min,max)`

**Description:** Validates string length within specified bounds.
**Example:** `"string(3,50)"`, `"string(1,255)"`
**Usage:** Append `(min,max)` to string type

```typescript
const schema = Interface({
  username: "string(3,20)",
  description: "string(0,500)",
});
```

### Regex Constraints `(/pattern/flags)`

**Description:** Validates strings against regular expressions.
**Example:** `"string(/^[A-Z]+$/)"`, `"string(/\\d{4}/g)"`
**Usage:** Append `(/regex/)` to string type

```typescript
const schema = Interface({
  code: "string(/^[A-Z]{3}$/)",
  version: "string(/^v\\d+\\.\\d+$/)",
});
```

---

## Utility Functions

### `Make.const(value)`

**Description:** Creates a constant value that must match exactly.
**Example:** `Make.const("admin")`, `Make.const(42)`
**Use Cases:** Literal values, enums, fixed configurations

```typescript
const schema = Interface({
  type: Make.const("user"),
  version: Make.const("1.0"),
  status: Make.const(200),
});
```

---

## Union Types

### Basic Unions (`type1|type2`)

**Description:** Validates against multiple possible types.
**Example:** `"string|number"`, `"email|phone"`
**Use Cases:** Flexible input types

```typescript
const schema = Interface({
  id: "string|number",
  contact: "email|phone",
  value: "string|number|boolean",
});
```

### Literal Unions (`"value1"|"value2"`)

**Description:** Validates against specific literal values.
**Example:** `"admin"|"user"`, `"light"|"dark"`
**Use Cases:** Enums, predefined options

```typescript
const schema = Interface({
  role: "admin" | "user" | "guest",
  theme: "light" | "dark",
  status: "active" | "inactive" | "pending",
});
```

---

## Conditional Logic

### `when` Conditions

**Description:** Applies conditional validation based on other field values.
**Syntax:** `when condition *? thenType : elseType`
**Example:** `when role === "admin" *? "string" : "string?"`
**Use Cases:** Dynamic validation, role-based schemas

```typescript
const schema = Interface({
  role: "admin" | "user",
  permissions: 'when role === "admin" *? "string[]" : "string[]?"',
  adminKey: 'when role === "admin" *? "string" : undefined',
});
```

### Nested Conditions

**Description:** Complex conditional logic with multiple branches.
**Example:** Nested when statements for complex business logic

```typescript
const schema = Interface({
  userType: "premium" | "basic" | "trial",
  features:
    'when userType === "premium" *? "string[]" : when userType === "basic" *? "string[](0,5)" : "string[](0,2)"',
});
```
