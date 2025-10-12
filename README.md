# Fortify Schema

[![npm version](https://badge.fury.io/js/fortify-schema.svg)](https://badge.fury.io/js/fortify-schema)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Build Status](https://github.com/Nehonix-Team/fortify-schema/workflows/CI/badge.svg)](https://github.com/Nehonix-Team/fortify-schema/actions)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/fortify-schema)](https://bundlephobia.com/package/fortify-schema)
[![VS Code Extension](https://img.shields.io/badge/VS%20Code-Extension%20Available-blue)](https://sdk.nehonix.space/pkgs/mods/vscode/latest/fortify-schema.vsix)

<div align="center">
  <img src="https://sdk.nehonix.space/sdks/assets/fortify%20schema.jpg" alt="Fortify Schema Logo" width="250" />
</div>

<div align="center">
  <img src="https://sdk.nehonix.space/sdks/assets/vscode-extension-preview.gif" alt="VSCode extension preview" width="500" />
</div>

**TypeScript Schema Validation with Interface-Like Syntax**

A modern TypeScript validation library designed around familiar interface syntax and powerful conditional validation. Experience schema validation that feels natural to TypeScript developers while unlocking advanced runtime validation capabilities.

## 🆕 What's New

- **Required Fields (`!`)**: Enforce non-empty strings and non-zero numbers with `"string!"` and `"number!"`
- **Object Types**: Validate generic object structures with `"object"` and `"object?"`
- **Enhanced Security**: All string operations now use secure regex patterns instead of potentially vulnerable methods
- **Improved Performance**: Optimized validation paths with better caching and precompilation
- **Better Error Messages**: More descriptive validation errors with clear property paths

## Quick Start

```bash
npm install fortify-schema
```

```typescript
import { Interface } from "fortify-schema";

// Define schemas with familiar TypeScript-like syntax
const UserSchema = Interface({
  id: "uuid",
  email: "email", 
  name: "string(2,50)", 
  age: "number(18,120)?",
  role: "admin|user|guest",

  // 🆕 Object and array types
  profile: "object", // Any object structure
  tags: "string[]", // Array of strings
  metadata: "record<string, any>", // Dynamic key-value pairs

  // Advanced conditional validation based on runtime properties
  permissions: "when config.hasPermissions.$exists() *? string[] : =[]",
  adminTools: "when role=admin *? boolean : =false",
});

// Validate with complete TypeScript inference
const result = UserSchema.safeParse(userData);
if (result.success) {
  console.log("Valid user:", result.data); // Fully typed!
} else {
  console.log("Validation errors:", result.errors);
}
```

_Note: For nested objects, we recommend limiting depth to 50-100 or no more than 300 levels for performance and safety. Default depth limit is 500._

Test by running:

- bun src\_\_tests\_\_\test_nested_obj.ts note: you may have bun installed if using this command. "npm i -g bun" (recommanded because it's faster than node)

- npm run benchmark:nestedObject

_Note: you may have tsx installed if using this command. "npm i -g tsx"._

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Core Features](#core-features)
- [Utility Functions](#utility-functions)
- [Conditional Validation](#conditional-validation)
- [Live Utility - Real-time Validation](#live-utility---real-time-validation)
- [Real-World Applications](#real-world-applications)
- [Performance Excellence](#performance-excellence)
- [Advanced Capabilities](#advanced-capabilities)
- [Developer Experience](#developer-experience)
- [API Reference](#api-reference)

## Installation & Setup

### Requirements

- **TypeScript 4.5+**
- **Node.js 14+**
- **VS Code** (recommended for enhanced development experience)

### Installation

```bash
# NPM
npm install fortify-schema

# Yarn
yarn add fortify-schema

# PNPM
pnpm add fortify-schema

# Bun
bun add fortify-schema
```

### VS Code Extension

Enhance your development workflow with our dedicated VS Code extension featuring comprehensive developer tools:

#### **🎨 Enhanced Features**

- **Syntax Highlighting**: Full syntax highlighting for all Fortify Schema types and utilities
- **Hover Documentation**: Detailed type information, examples, and use cases on hover
- **Go-to-Definition**: Ctrl+Click on types to open comprehensive documentation
- **IntelliSense Support**: Smart autocomplete for schema definitions
- **Error Detection**: Real-time validation of schema syntax
- **Code Snippets**: Pre-built templates for common schema patterns

#### **📖 Interactive Documentation**

When you hover over any type in `Interface({...})` blocks, you'll see:

- **Type Description**: What the type validates
- **Usage Examples**: `"string"`, `"string?"`, `"string[]"`
- **Use Cases**: When and where to use each type
- **Code Examples**: Complete working examples

#### **🔧 Installation**

```bash
# Download and install
curl https://sdk.nehonix.space/pkgs/mods/vscode/latest/fortify-schema.vsix -o fortify-schema.vsix
code --install-extension fortify-schema.vsix

# Or just search for "fortify-schema" in the vscode marketplace
```

## Core Features

### Intuitive Schema Definition

```typescript
import { Interface } from "fortify-schema";

const ProductSchema = Interface({
  id: "uuid",
  name: "string(1,100)",
  price: "number(0.01,99999.99)",
  category: "electronics|books|clothing|home",
  inStock: "boolean",
  tags: "string[]?",
  description: "string(,500)?",
  createdAt: "date",
});

// Usage with full type safety
const product = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  name: "Wireless Headphones",
  price: 99.99,
  category: "electronics",
  inStock: true,
  tags: ["wireless", "audio", "bluetooth"],
  createdAt: new Date(),
};

const result = ProductSchema.safeParse(product);
console.log(result.success); // true
console.log(result.data); // Fully typed product data
```

### Comprehensive Type Support

```typescript
const ComprehensiveSchema = Interface({
  // Fundamental types
  name: "string",
  age: "number",
  active: "boolean",
  birthday: "date",

  // Optional fields
  nickname: "string?",
  bio: "string?",

  // 🆕 Required fields (cannot be empty/zero)
  requiredName: "string!", // Non-empty string required
  requiredCount: "number!", // Non-zero number required

  // Constraint validation
  username: "string(3,20)", // 3-20 characters
  password: "string(8,)", // Minimum 8 characters
  score: "number(0,100)", // Range 0-100

  // Format validation
  email: "email",
  website: "url",
  secureApi: "url.https", // HTTPS-only validation
  devServer: "url.dev", // Development mode (allows localhost and security features disabled)
  phone: "phone",
  userId: "uuid",

  // Array validation
  tags: "string[]", // Required array
  scores: "number[]?", // Optional array
  limitedTags: "string[](1,5)", // 1-5 items

  // Union types
  status: "active|inactive|pending",
  role: "user|admin|moderator",

  // 🆕 Object types
  profile: "object", // Any object
  config: "object?", // Optional object

  // Record types (dynamic key-value objects)
  settings: "record<string, any>", // String keys, any values
  counters: "record<string, number>", // String keys, number values
  metadata: "record<string, string>", // String keys, string values

  // Literal values
  version: "=2.0",
  type: "=user",
});
```

### Deep Object Validation

```typescript
const UserProfileSchema = Interface({
  user: {
    id: "uuid",
    email: "email",
    profile: {
      firstName: "string(1,50)",
      lastName: "string(1,50)",
      avatar: "url?",
      preferences: {
        theme: "light|dark|auto",
        language: "string(/^[a-z]{2}$/)",
        notifications: "boolean",
      },
    },
  },
  metadata: {
    createdAt: "date",
    lastLogin: "date?",
    loginCount: "number(0,)",
  },
});
```

### Utility Functions

Fortify Schema provides powerful utility functions for advanced schema definition:

#### **Make.const() - Constant Values**

Create schemas that validate against exact constant values:

```typescript
import { Interface, Make } from "fortify-schema";

const ConfigSchema = Interface({
  // Exact string constants
  apiVersion: Make.const("v2.1"),
  environment: Make.const("production"),

  // Numeric constants
  maxRetries: Make.const(3),
  timeout: Make.const(5000),

  // Boolean constants
  enableLogging: Make.const(true),

  // Complex constants
  defaultSettings: Make.const({
    theme: "dark",
    language: "en",
  }),

  // Array constants
  supportedFormats: Make.const(["json", "xml", "csv"]),
});

// Usage
const config = {
  apiVersion: "v2.1", // ✅ Valid
  environment: "staging", // ❌ Invalid - must be exactly "production"
  maxRetries: 3, // ✅ Valid
  timeout: 3000, // ❌ Invalid - must be exactly 5000
};
```

#### **Record Types - Dynamic Objects**

Validate objects with dynamic keys but consistent value types:

```typescript
const DynamicSchema = Interface({
  // String keys with any values
  metadata: "record<string, any>",

  // String keys with number values (counters, scores, etc.)
  scores: "record<string, number>",

  // String keys with string values (translations, labels, etc.)
  translations: "record<string, string>",

  // Optional record types
  optionalSettings: "record<string, boolean>?",
});

// Usage
const data = {
  metadata: {
    userId: "123",
    timestamp: new Date(),
    flags: ["active", "verified"],
  },
  scores: {
    math: 95,
    science: 87,
    english: 92,
  },
  translations: {
    hello: "Hola",
    goodbye: "Adiós",
    welcome: "Bienvenido",
  },
};
```

## Conditional Validation

Fortify Schema's standout feature: advanced conditional validation based on runtime properties and business logic.

```typescript
const SmartUserSchema = Interface({
  // Runtime context objects
  config: "any?",
  user: "any?",
  features: "any?",

  // Core user data
  id: "uuid",
  email: "email",
  role: "admin|user|guest",

  // Dynamic validation based on runtime state
  hasPermissions: "when config.permissions.$exists() *? boolean : =false",
  hasProfile: "when user.profile.$exists() *? boolean : =false",
  isListEmpty: "when config.items.$empty() *? boolean : =true",
  hasAdminRole: "when user.roles.$contains(admin) *? boolean : =false",

  // Smart default values
  defaultTags: 'when config.tags.$exists() *? string[] : =["default","user"]',
  defaultSettings:
    'when config.theme.$exists() *? any : ={"mode":"light","lang":"en"}',

  // Deep property access
  advancedFeature:
    "when user.profile.settings.advanced.$exists() *? boolean : =false",

  // Complex business rules
  isValidUser:
    "when user.email.$exists() && user.verified.$exists() *? boolean : =false",
});
```

### Runtime Validation Methods

```typescript
const RuntimeMethodsSchema = Interface({
  data: "any?",

  // Property existence checking
  hasData: "when data.field.$exists() *? boolean : =false",

  // Empty state validation
  isEmpty: "when data.list.$empty() *? boolean : =true",

  // Null checking
  isNull: "when data.value.$null() *? boolean : =false",

  // String pattern matching
  containsText:
    "when data.description.$contains(important) *? boolean : =false",
  startsWithPrefix: "when data.code.$startsWith(PRE) *? boolean : =false",
  endsWithSuffix: "when data.filename.$endsWith(.pdf) *? boolean : =false",

  // Numeric range validation
  inRange: "when data.score.$between(0,100) *? boolean : =false",

  // Value inclusion testing
  isValidStatus:
    "when data.status.$in(active,pending,inactive) *? boolean : =false",
});
```

## Live Utility - Real-time Validation (still in progress so not recommended for production use yet)

The Live utility transforms Fortify Schema into a powerful real-time validation system with EventEmitter-like interface, data transformation pipelines, and stream control methods. Perfect for modern applications requiring reactive validation.

### Key Features

- **Real-time Field Validation** - Validate form fields as users type
- **EventEmitter Interface** - Full `.on()`, `.emit()`, `.off()`, `.once()` support
- **Data Transformation Pipeline** - Chain `.transform()`, `.filter()`, `.map()` operations
- **Stream Control** - `.pause()`, `.resume()`, `.destroy()` for flow control
- **Stream Piping** - Connect validators with `.pipe()` for complex workflows
- **Performance Monitoring** - Built-in statistics and performance tracking
- **InterfaceSchema Sync** - Perfect synchronization with Interface validation

### Quick Example

```typescript
import { Live, Interface } from "fortify-schema";

const UserSchema = Interface({
  name: "string(2,50)",
  email: "email",
  age: "number(18,120)",
});

// Create stream validator with transformation pipeline
const validator = Live.stream(UserSchema)
  .transform((data) => ({ ...data, timestamp: Date.now() }))
  .filter((data) => data.age >= 21)
  .map((data) => ({ ...data, name: data.name.toUpperCase() }));

// Listen for results
validator.on("valid", (data) => console.log("✅ Valid:", data));
validator.on("invalid", (data, errors) => console.log("❌ Invalid:", errors));
validator.on("filtered", (data) => console.log("🚫 Filtered:", data));

// Process data
validator.validate({ name: "john", email: "john@example.com", age: 25 });
// Output: ✅ Valid: { name: "JOHN", email: "john@example.com", age: 25, timestamp: 1703123456789 }
```

### Stream Control Example

```typescript
const streamValidator = Live.stream(UserSchema);

// Pause stream (queues data)
streamValidator.pause();
streamValidator.validate(userData1); // Queued
streamValidator.validate(userData2); // Queued

console.log("Queue length:", streamValidator.queueLength); // 2

// Resume and process queue
streamValidator.resume(); // Processes both queued items

// Stream piping
const sourceValidator = Live.stream(InputSchema);
const destinationValidator = Live.stream(OutputSchema);

sourceValidator.pipe(destinationValidator);
// Valid data flows: source → destination
```

### Form Integration Example

```typescript
const formValidator = Live.form(UserSchema);

// Bind form fields
formValidator.bindField("email", emailInput);
formValidator.bindField("name", nameInput);

// Enable real-time validation
formValidator.enableAutoValidation();

// Handle form submission
formValidator.onSubmit((isValid, data, errors) => {
  if (isValid) {
    submitToAPI(data);
  } else {
    displayErrors(errors);
  }
});
```

The Live utility provides **100% coverage** of standard stream methods while maintaining **perfect synchronization** with InterfaceSchema validation logic.

## Real-World Applications

### E-Commerce Product Management

```typescript
const ECommerceProductSchema = Interface({
  // Product identification
  id: "uuid",
  sku: "string(/^[A-Z0-9-]{8,20}$/)",
  name: "string(1,200)",
  slug: "string(/^[a-z0-9-]+$/)",

  // Pricing structure
  price: "number(0.01,999999.99)",
  compareAtPrice: "number(0.01,999999.99)?",
  cost: "number(0,999999.99)?",

  // Inventory management
  inventory: {
    quantity: "number(0,)",
    trackQuantity: "boolean",
    allowBackorder: "boolean",
    lowStockThreshold: "number(0,)?"
  },

  // Content management
  description: "string(,5000)?",
  shortDescription: "string(,500)?",
  category: "electronics|clothing|books|home|sports|beauty",
  tags: "string[](0,20)",

  // Media assets
  images: {
    primary: "url",
    gallery: "url[](0,10)",
    alt: "string(,100)?"
  }?,

  // SEO optimization
  seo: {
    title: "string(,60)?",
    description: "string(,160)?",
    keywords: "string[](0,10)"
  }?,

  // Business logic with conditional validation
  config: "any?",

  // Product type-specific requirements
  shipping: "when config.isDigital.$exists() *? any? : ={weight:0,dimensions:{}}",
  subscription: "when config.isSubscription.$exists() *? any : =null",
  variants: "when config.hasVariants.$exists() *? any[] : =[]",

  // Publication workflow
  status: "draft|active|archived",
  publishedAt: "date?",
  createdAt: "date",
  updatedAt: "date"
});
```

## Performance Excellence

Fortify Schema is engineered for high-performance validation with multiple optimization strategies:

### Performance Architecture

```typescript
// Built-in performance optimizations
const performanceFeatures = {
  // Schema compilation
  precompilation: "Schemas optimized at creation time",
  caching: "Intelligent caching for union types and constraints",

  // Memory management
  memoryOptimized: "Minimal runtime overhead per validation",
  zeroAllocation: "Hot paths avoid unnecessary object creation",

  // Validation efficiency
  earlyTermination: "Fast-fail validation on first error",
  typeSpecialization: "Optimized validation paths per data type",
};
```

### Benchmark Highlights

Our continuous performance monitoring shows excellent results across all validation scenarios:

- **High Throughput**: Millions of operations per second for common validation patterns
- **Consistent Performance**: Low variation in execution times
- **Memory Efficient**: Minimal memory overhead per schema instance
- **Scalable**: Performance scales predictably with data complexity

### Performance Testing

Validate performance on your specific use cases:

```bash
# Run comprehensive benchmarks
bun run scripts/benchmark.js

```

View detailed [benchmark results](./src/bench/BENCHMARK-RESULTS.md) for comprehensive performance analysis.

## Advanced Capabilities

### Schema Transformation

```typescript
import { Mod } from "fortify-schema";

const BaseUserSchema = Interface({
  id: "uuid",
  email: "email",
  name: "string",
  password: "string",
  role: "user|admin",
  createdAt: "date",
});

// Powerful schema transformations
const PublicUserSchema = Mod.omit(BaseUserSchema, ["password"]);
const PartialUserSchema = Mod.partial(BaseUserSchema);
const RequiredUserSchema = Mod.required(PartialUserSchema);
const ExtendedUserSchema = Mod.extend(BaseUserSchema, {
  lastLogin: "date?",
  preferences: {
    theme: "light|dark",
    notifications: "boolean",
  },
});
```

### Comprehensive Error Handling

```typescript
const result = UserSchema.safeParse(invalidData);

if (!result.success) {
  // Rich error information for debugging
  result.errors.forEach((error) => {
    console.log(`Field: ${error.path.join(".")}`);
    console.log(`Message: ${error.message}`);
    console.log(`Code: ${error.code}`);
    console.log(`Expected: ${error.expected}`);
    console.log(`Received: ${error.received}`);
  });
}

// Exception-based validation
try {
  const data = UserSchema.parse(userData);
  // Process validated data
} catch (error) {
  if (error instanceof ValidationError) {
    console.log("Validation failed:", error.errors);
  }
}
```

## Developer Experience

### VS Code Extension Features

Our dedicated VS Code extension transforms your development experience:

- **Intelligent Syntax Highlighting** for schema definitions
- **Advanced IntelliSense** with type and method completion
- **Real-time Validation** with inline error detection
- **Rich Hover Documentation** for all types and methods
- **Multiple Theme Support** for different coding preferences

```typescript
const UserSchema = Interface({
  // IntelliSense provides comprehensive type suggestions
  email: "email", // Hover documentation explains validation rules

  // Smart constraint completion
  name: "string(2,50)", // Auto-suggests constraint syntax patterns

  // Conditional method IntelliSense
  hasProfile: "when user.profile.$exists() *? boolean : =false",
  //                            ^ Shows all 8 available runtime methods
});
```

## What Sets Fortify Schema Apart

### Design Philosophy

- **Developer-Centric**: Built around familiar TypeScript patterns and conventions
- **Interface Syntax**: Schema definitions that feel like native TypeScript interfaces
- **Conditional Intelligence**: Advanced runtime validation based on dynamic properties
- **Performance Focused**: Optimized for high-throughput production applications
- **Tooling Excellence**: Professional-grade development tools and IDE integration
- **Type Safety**: Complete TypeScript inference and compile-time validation

### Key Strengths

- **Familiar Syntax**: Write schemas using TypeScript-like interface definitions
- **Advanced Conditionals**: Unique runtime property validation and business logic
- **Rich Tooling**: Dedicated VS Code extension with comprehensive development support
- **Type Integration**: Seamless TypeScript integration with full type inference
- **Production Ready**: Battle-tested with comprehensive error handling and debugging

### Community and Growth

We're building Fortify Schema with transparency and community feedback at its core. We welcome:

- **Real-world usage feedback** and performance insights
- **Issue reports** with detailed reproduction cases
- **Feature requests** based on practical development needs
- **Performance benchmarking** on diverse use cases
- **Constructive feedback** on API design and developer experience

## API Reference

### Core Validation Methods

#### `Interface(schema, options?)`

Creates a new schema instance with comprehensive validation rules.

```typescript
const UserSchema = Interface(
  {
    id: "uuid",
    name: "string",
  },
  {
    strict: true, // Reject extra properties
    loose: false, // Disable automatic type coercion
    allowUnknown: false, // Reject unknown properties
  }
);
```

#### `schema.parse(data)`

Synchronous validation that returns validated data or throws detailed errors.

```typescript
try {
  const user = UserSchema.parse(userData);
  // user is fully typed and validated
} catch (error) {
  console.error(error.errors);
}
```

#### `schema.safeParse(data)`

Safe validation that returns a result object without throwing exceptions.

```typescript
const result = UserSchema.safeParse(userData);
if (result.success) {
  console.log(result.data); // Fully typed and validated
} else {
  console.error(result.errors); // Detailed validation errors
}
```

#### `schema.safeParseUnknown(data)`

Safe validation for unknown data types, ideal for testing and debugging.

```typescript
const result = UserSchema.safeParseUnknown(unknownData);
// Same return type as safeParse() but accepts any input type
```

#### `schema.parseAsync(data)`

Asynchronous validation with promise-based error handling.

```typescript
try {
  const user = await UserSchema.parseAsync(userData);
  console.log("Valid user:", user);
} catch (error) {
  console.error("Validation failed:", error.message);
}
```

#### `schema.safeParseAsync(data)`

Asynchronous safe validation that never throws exceptions.

```typescript
const result = await UserSchema.safeParseAsync(userData);
if (result.success) {
  console.log("Valid user:", result.data);
} else {
  console.error("Validation errors:", result.errors);
}
```

#### `schema.safeParseUnknownAsync(data)`

Asynchronous safe validation for unknown data types.

```typescript
const result = await UserSchema.safeParseUnknownAsync(unknownData);
if (result.success) {
  console.log("Valid data:", result.data);
} else {
  console.error("Validation errors:", result.errors);
}
```

### Schema Transformation Operations

#### `Mod.partial(schema)` - Optional Fields

```typescript
const PartialUserSchema = Mod.partial(UserSchema);
// Converts all fields to optional
```

#### `Mod.required(schema)` - Required Fields

```typescript
const RequiredUserSchema = Mod.required(PartialUserSchema);
// Makes all fields required
```

#### `Mod.pick(schema, keys)` - Field Selection

```typescript
const PublicUserSchema = Mod.pick(UserSchema, ["id", "name", "email"]);
// Creates schema with only specified fields
```

#### `Mod.omit(schema, keys)` - Field Exclusion

```typescript
const SafeUserSchema = Mod.omit(UserSchema, ["password", "internalId"]);
// Creates schema excluding specified fields
```

#### `Mod.extend(schema, extension)` - Schema Extension

```typescript
const ExtendedUserSchema = Mod.extend(UserSchema, {
  lastLogin: "date?",
  preferences: {
    theme: "light|dark",
  },
});
```

#### `Mod.merge(schema1, schema2)` - Schema Merging

```typescript
const CombinedSchema = Mod.merge(UserSchema, ProfileSchema);
// Combines two schemas into one
```

### Available Extensions

Fortify Schema provides powerful extensions for enhanced functionality:

```typescript
// Import extensions for advanced features
export {
  Smart, // Smart schema inference from samples and TypeScript types
  When, // Advanced conditional validation builder
  Live, // Real-time validation for forms and streaming data
  Docs, // Auto-documentation generation (OpenAPI, TypeScript, etc.)
  Extensions, // Extension utilities and helpers
  Quick, // Quick access utilities for common operations
  TypeScriptGenerator, // TypeScript code generation from schemas
} from "fortify-schema";
```

#### Smart Inference

```typescript
import { Smart } from "fortify-schema";

// Infer schema from sample data
const sampleUser = {
  id: 1,
  email: "user@example.com",
  name: "John Doe",
  tags: ["developer", "typescript"],
};

const UserSchema = Smart.fromSample(sampleUser);
// Generates: { id: "positive", email: "email", name: "string", tags: "string[]" }
```

#### Conditional Builder

```typescript
import { When } from "fortify-schema";

const OrderSchema = Interface({
  orderType: "pickup|delivery",
  address: "string?",

  // Advanced conditional validation
  deliveryFee: When.field("orderType")
    .is("delivery")
    .then("number(0,)")
    .default("number?"),
});
```

#### Real-time Validation with Live Utility

The Live utility provides comprehensive real-time validation with full EventEmitter-like interface, data transformation pipelines, and stream control methods. Perfect for forms, streaming data, and reactive applications.

```typescript
import { Live } from "fortify-schema";

const UserSchema = Interface({
  id: "number",
  name: "string(2,50)",
  email: "email",
  age: "number(18,120)",
});
```

##### Live Validator - Real-time Field Validation

```typescript
// Create live validator for real-time field validation
const liveValidator = Live.validator(UserSchema);

// Listen for validation changes
liveValidator.onValidation((result) => {
  console.log("Validation result:", result.isValid);
  console.log("Current errors:", result.errors);
  updateUI(result);
});

// Validate fields in real-time
liveValidator.validateField("email", "user@example.com");
liveValidator.validateField("name", "John Doe");

// Get current validation state
console.log("Is valid:", liveValidator.isValid);
console.log("All errors:", liveValidator.errors);

// Validate entire object
const fullResult = liveValidator.validateAll(userData);
```

##### Stream Validator - Advanced Stream Processing

The StreamValidator provides a complete EventEmitter-like interface with all standard stream methods:

```typescript
// Create stream validator
const streamValidator = Live.stream(UserSchema);

// ===== EVENT EMITTER METHODS =====

// Generic event listeners (.on, .once, .off, .emit)
streamValidator.on("valid", (data) => {
  console.log("Valid data received:", data);
});

streamValidator.once("invalid", (data, errors) => {
  console.log("First invalid data:", errors);
});

streamValidator.on("error", (error) => {
  console.error("Stream error:", error);
});

// Custom events
streamValidator.on("custom-event", (message) => {
  console.log("Custom event:", message);
});

streamValidator.emit("custom-event", "Hello from stream!");

// Remove listeners
streamValidator.off("valid", specificListener);
streamValidator.off("invalid"); // Remove all listeners for event
```

##### Data Transformation Pipeline

```typescript
// Build comprehensive data transformation pipeline
const transformValidator = Live.stream(UserSchema)
  .transform((data) => {
    // Add metadata
    return { ...data, timestamp: Date.now(), source: "api" };
  })
  .filter((data) => {
    // Filter by business rules
    return data.age >= 21; // Only adults
  })
  .map((data) => {
    // Transform data format
    return {
      ...data,
      name: data.name.toUpperCase(),
      email: data.email.toLowerCase(),
    };
  });

// Listen for pipeline results
transformValidator.on("valid", (data) => {
  console.log("Processed data:", data); // Transformed and validated
});

transformValidator.on("filtered", (data) => {
  console.log("Data filtered out:", data); // Failed filter conditions
});

transformValidator.on("invalid", (data, errors) => {
  console.log("Validation failed after transformation:", errors);
});

// Process data through pipeline
transformValidator.validate(rawUserData);
```

##### Stream Control Methods

```typescript
// Stream control with pause/resume/destroy
const controlValidator = Live.stream(UserSchema);

// Pause stream (queues incoming data)
controlValidator.pause();
console.log("Stream paused:", controlValidator.paused);

// Data sent while paused gets queued
controlValidator.validate(userData1); // Queued
controlValidator.validate(userData2); // Queued

console.log("Queue length:", controlValidator.queueLength);

// Resume stream (processes queued data)
controlValidator.resume();
console.log("Stream resumed, queue processed");

// Destroy stream (cleanup and prevent further use)
controlValidator.on("destroy", () => {
  console.log("Stream destroyed and cleaned up");
});

controlValidator.destroy();
console.log("Stream destroyed:", controlValidator.destroyed);
```

##### Stream Piping

```typescript
// Pipe data between stream validators
const sourceValidator = Live.stream(InputSchema);
const destinationValidator = Live.stream(OutputSchema);

// Pipe valid data from source to destination
sourceValidator.pipe(destinationValidator);

// Data flows: source → destination
sourceValidator.validate(inputData);
// If valid, automatically sent to destinationValidator

// Chain multiple streams
const pipeline = sourceValidator
  .pipe(transformValidator)
  .pipe(destinationValidator);
```

##### Form Validator - Advanced Form Integration

```typescript
// Create form validator with field binding
const formValidator = Live.form(UserSchema);

// Bind form fields to validator
formValidator.bindField("email", emailInput);
formValidator.bindField("name", nameInput);
formValidator.bindField("age", ageInput);

// Enable automatic validation on input changes
formValidator.enableAutoValidation();

// Handle form submission
formValidator.onSubmit((isValid, data, errors) => {
  if (isValid) {
    console.log("Form is valid, submitting:", data);
    submitToAPI(data);
  } else {
    console.log("Form has errors:", errors);
    displayErrors(errors);
  }
});

// Manual form validation
const formResult = formValidator.validateForm();
console.log("Form valid:", formResult.isValid);
```

##### Advanced Event Handling

```typescript
const streamValidator = Live.stream(UserSchema);

// Listen for all validation events
streamValidator.on("data", (data) => {
  console.log("Data received for validation:", data);
});

streamValidator.on("validated", (data, result) => {
  console.log("Validation completed:", result.isValid);
});

streamValidator.on("queued", (data) => {
  console.log("Data queued (stream paused):", data);
});

streamValidator.on("pause", () => {
  console.log("Stream paused");
});

streamValidator.on("resume", () => {
  console.log("Stream resumed");
});

// Error handling
streamValidator.on("error", (error) => {
  console.error("Stream error:", error.message);
  // Handle gracefully without crashing
});
```

##### Performance and Statistics

```typescript
// Monitor stream performance
streamValidator.onStats((stats) => {
  console.log("Validation Statistics:");
  console.log(`- Total validated: ${stats.totalValidated}`);
  console.log(`- Valid count: ${stats.validCount}`);
  console.log(`- Invalid count: ${stats.invalidCount}`);
  console.log(`- Error rate: ${(stats.errorRate * 100).toFixed(2)}%`);
  console.log(`- Running since: ${stats.startTime}`);
});

// Get current statistics
const currentStats = streamValidator.getStats();
console.log("Current performance:", currentStats);
```

##### Integration with InterfaceSchema

The Live utility is fully synchronized with InterfaceSchema modules, ensuring consistent validation behavior:

```typescript
const schema = Interface({
  email: "email",
  age: "number(18,120)",
  role: "admin|user|guest",
});

// Both produce identical validation results
const interfaceResult = schema.safeParse(userData);
const liveResult = Live.stream(schema).validate(userData);

// Perfect synchronization guaranteed
console.log("Results match:", interfaceResult.success === liveResult.isValid);
```

#### Documentation Generation

```typescript
import { Docs } from "fortify-schema"; //in beta

// Generate OpenAPI specification
const openApiSpec = Docs.openapi(UserSchema, {
  title: "User API",
  version: "1.0.0",
  servers: ["https://api.example.com"],
});

// Generate TypeScript definitions
const typeDefinitions = Docs.typescript(UserSchema, {
  exportName: "User",
  namespace: "API",
});
```

#### Quick Utilities

```typescript
import { Quick } from "fortify-schema";

// Quick schema inference
const schema = Quick.fromSample(sampleData);

// Quick conditional validation
const conditionalField = Quick.when("status").is("active").then("string");

// Quick documentation
const docs = Quick.docs(schema);
const typescript = Quick.typescript(schema);
```

### Validation Configuration

#### Method Chaining

```typescript
const FlexibleSchema = UserSchema.loose() // Enable automatic type coercion
  .allowUnknown() // Accept extra properties
  .min(1) // Set minimum constraints
  .max(100) // Set maximum constraints
  .unique() // Require unique array values
  .pattern(/^[A-Z]/) // Apply regex pattern validation
  .default("N/A"); // Set default value
```

## Contributing

By contributing to Fortify Schema, you help fortify-schema to:

- Improve the quality of TypeScript validation
- Expand the reach of TypeScript in the JavaScript ecosystem
- Provide a robust and reliable validation solution for developers
- Foster a community of developers who care about code quality and security

### Development Environment

```bash
# Repository setup
git clone https://github.com/Nehonix-Team/fortify-schema.git
cd fortify-schema

# Dependency installation
npm install

# Test suite execution
npm run test

# Performance benchmarking
npm run benchmark

# Project build
npm run build
```

### Quality Standards

- **TypeScript**: Strict mode with comprehensive type checking
- **Test Coverage**: 95%+ coverage requirement
- **Performance**: All benchmarks must pass performance thresholds
- **Documentation**: Complete JSDoc comments for all public APIs
- **Code Quality**: ESLint and Prettier configuration compliance

### Contribution Process

1. **Fork** the repository on GitHub
2. **Create** a feature branch: `git checkout -b feature/enhancement-name`
3. **Implement** changes with comprehensive test coverage
4. **Verify** all tests pass: `npm test`
5. **Validate** performance: `npm run benchmark`
6. **Commit** changes: `git commit -m 'Add enhancement: description'`
7. **Push** to branch: `git push origin feature/enhancement-name`
8. **Submit** a Pull Request with detailed description

### Issue Reporting

For effective issue resolution, please provide:

- **Environment Details**: Fortify Schema, TypeScript, and Node.js versions
- **Reproduction Case**: Minimal code example demonstrating the issue
- **Expected Behavior**: Clear description of intended functionality
- **Actual Behavior**: Detailed explanation of observed behavior
- **Error Information**: Complete error messages and stack traces

## Release History

See [CHANGELOG.md](./CHANGELOG.md) for comprehensive release notes and migration guides.

## License

MIT License - see [LICENSE](./LICENSE) file for complete terms.

## Support Resources

- **Complete Documentation**: [Full documentation](./docs/)
- **Issue Tracking**: [GitHub Issues](https://github.com/Nehonix-Team/fortify-schema/issues)
- **Community Discussions**: [GitHub Discussions](https://github.com/Nehonix-Team/fortify-schema/discussions)

---

**Development Status**: Fortify Schema is in active development with a focus on production readiness. We maintain transparency about capabilities and limitations while continuously improving based on community feedback and real-world usage patterns.

<div align="center">
  <p><strong>Built by Nehonix</strong></p>
  <p>
    <a href="https://nehonix.space">Website</a> •
    <a href="https://sdk.nehonix.space">SDK</a> •
    <a href="https://github.com/Nehonix-Team">GitHub</a>
  </p>
</div>
