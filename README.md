# Fortify Schema

[![npm version](https://badge.fury.io/js/fortify-schema.svg)](https://badge.fury.io/js/fortify-schema)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Build Status](https://github.com/Nehonix-Team/fortify-schema/workflows/CI/badge.svg)](https://github.com/Nehonix-Team/fortify-schema/actions)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/fortify-schema)](https://bundlephobia.com/package/fortify-schema)

<div align="center">
  <img src="https://dll.nehonix.com/sdks/assets/fortify%20schema.jpg" alt="Fortify Schema Logo" width="250" />
</div>

---

## Important: Migration to Reliant-Type

**The `fortify-schema` package is being deprecated and replaced by [`reliant-type`](https://www.npmjs.com/package/reliant-type).**

While `fortify-schema` will continue to receive critical security patches, all new features, performance improvements, and ongoing development are now focused exclusively on `reliant-type`. We strongly recommend migrating to `reliant-type` for:

- **Latest features and improvements** - All new capabilities are built into `reliant-type`
- **Active development** - Ongoing enhancements and optimizations
- **Long-term support** - Full maintenance and community support
- **Enhanced performance** - Significant speed and efficiency gains
- **Expanded ecosystem** - Growing tooling and integration support

**Migration is straightforward** - `reliant-type` maintains API compatibility with `fortify-schema` core features while introducing powerful new capabilities. See our [Migration Guide](./docs/MIGRATION-TO-RELIANT-TYPE.md) for step-by-step instructions.

### Quick Migration Example

```typescript
// Before (fortify-schema)
import { Interface } from "fortify-schema";

// After (reliant-type)
import { Interface } from "reliant-type";

// Your existing schemas work without modification
const UserSchema = Interface({
  id: "uuid",
  email: "email!",
  name: "string(2,50)",
});
```

---

## Overview

**Fortify Schema** is a TypeScript validation library featuring interface-like syntax and advanced conditional validation. Designed for TypeScript developers who value familiar patterns and powerful runtime validation capabilities.

<div align="center">
  <img src="https://dll.nehonix.com/sdks/assets/vscode-extension-preview.gif" alt="VSCode extension preview" width="500" />
</div>

### Key Capabilities

- **Interface-like Syntax** - Define schemas using TypeScript-style interface definitions
- **Advanced Conditionals** - Implement complex business logic with `when` expressions
- **Custom Error Messages** - Provide context-specific validation feedback using the `-->` operator
- **Complete Type Safety** - Full TypeScript inference with zero runtime overhead
- **High Performance** - Automatic precompilation and optimization
- **Professional Tooling** - VS Code extension with IntelliSense and real-time validation

## Installation

```bash
npm install fortify-schema
```

**Note:** For new projects, consider starting with `reliant-type` instead:

```bash
npm install reliant-type
```

## Quick Start

```typescript
import { Interface } from "fortify-schema";

// Define schemas with familiar TypeScript-like syntax
const UserSchema = Interface({
  id: "uuid",
  email: "email! --> Please provide a valid email address",
  name: "string(2,50) --> Name must be between 2 and 50 characters",
  age: "number(18,120)? --> Age must be between 18 and 120",
  role: "admin|user|guest --> Role must be admin, user, or guest",
  tags: "string[]",
  metadata: "record<string, any>",

  // Advanced conditional validation
  permissions: "when role=admin *? string[] : =[]",
});

// Validate with complete TypeScript inference
const result = UserSchema.safeParse(userData);
if (result.success) {
  console.log("Valid user:", result.data); // Fully typed
} else {
  console.log("Validation errors:", result.errors);
}
```

## Core Features

### Type System

Comprehensive support for primitive types, collections, and advanced formats:

- **Primitives** - `string`, `number`, `boolean`, `null`, `undefined`
- **Specialized** - `email`, `url`, `uuid`, `date`, `iso8601`
- **Collections** - Arrays (`string[]`), Records (`record<string, any>`)
- **Objects** - Generic object validation with `object` and `object?`
- **Unions** - Enumerated values with `admin|user|guest`

### Validation Modifiers

- **Optional** - Mark fields as optional with `?` suffix (e.g., `"string?"`)
- **Required** - Enforce non-empty values with `!` suffix (e.g., `"email!"`)
- **Constraints** - Apply ranges and limits with `(min,max)` syntax
- **Custom Messages** - Define user-friendly errors with `-->` operator

### Conditional Validation

Implement complex business rules based on runtime data:

```typescript
const ProductSchema = Interface({
  inStock: "boolean",
  discount: "when inStock=true *? number(0,100)? : =0",
  maxQuantity: "when inStock=true *? int(1,1000) : int(1,10)",
});
```

## Documentation

### Getting Started

- [Installation & Setup](./docs/INSTALLATION.md)
- [Core Features](./docs/CORE-FEATURES.md)
- [Quick Examples](./examples/)
- [Migration to Reliant-Type](./docs/MIGRATION-TO-RELIANT-TYPE.md)

### Core Concepts

- [Type System](./docs/CORE-FEATURES.md#comprehensive-type-support)
- [Constraints](./docs/CORE-FEATURES.md#constraints)
- [Modifiers](./docs/CORE-FEATURES.md#type-modifiers)
- [Custom Error Messages](./docs/CUSTOM-ERROR-MESSAGES.md)

### Advanced Features

- [Conditional Validation](./docs/CONDITIONAL-VALIDATION-GUIDE.md)
- [Utility Functions](./docs/CORE-FEATURES.md#utility-functions)
- [Schema Transformation](./docs/API-REFERENCE.md#mod-utilities)
- [Live Validation](./docs/LIVE-UTILITY.md)

### Reference

- [API Reference](./docs/API-REFERENCE.md)
- [Type Inference](./docs/TYPE-INFERENCE.md)
- [Error Handling](./docs/API-REFERENCE.md#error-handling)
- [Performance Guide](./docs/PERFORMANCE.md)

## Common Use Cases

### Form Validation

```typescript
const FormSchema = Interface({
  email: "email! --> Please enter a valid email",
  password: "string(8,)! --> Password must be at least 8 characters",
  confirmPassword: "string --> Passwords must match",
  terms: "boolean! --> You must accept the terms",
});
```

### API Request Validation

```typescript
const APIRequestSchema = Interface({
  method: "GET|POST|PUT|DELETE",
  endpoint: "url",
  headers: "record<string, string>",
  body: "object?",
});
```

### E-Commerce Products

```typescript
const ProductSchema = Interface({
  id: "uuid",
  name: "string(3,100)",
  price: "number(0.01,) --> Price must be greater than 0",
  category: "electronics|clothing|food",
  inStock: "boolean",
  discount: "when inStock=true *? number(0,100)? : =0",
});
```

### User Management

```typescript
const UserSchema = Interface({
  id: "uuid",
  email: "email!",
  role: "admin|user|guest",
  permissions: "when role=admin *? string[] : =[]",
  maxProjects: "when role=admin *? int(1,100) : int(1,3)",
});
```

## VS Code Extension

Enhance your development workflow with professional IDE integration:

- **Syntax Highlighting** - Comprehensive highlighting for schema types
- **IntelliSense** - Context-aware autocompletion
- **Hover Documentation** - Inline documentation and examples
- **Error Detection** - Real-time schema syntax validation
- **Code Snippets** - Pre-built templates for common patterns

[Download Extension](https://dll.nehonix.com/pkgs/mods/vscode/latest/fortify-schema.vsix) | [Extension Documentation](./vscode-extension/readme.md)

## Performance

Fortify Schema is optimized for production environments:

- **Fast Validation** - Optimized execution paths with schema precompilation
- **Memory Efficient** - Minimal overhead per schema instance
- **Scalable** - Predictable performance across data complexity levels
- **Benchmarked** - Continuous performance monitoring and optimization

Run benchmarks locally:

```bash
npm run benchmark
npm run benchmark:nestedObject
```

[View Benchmark Results](./src/bench/BENCHMARK-RESULTS.md)

## Comparison

| Feature                | Fortify Schema | Reliant-Type | Zod     | Yup     | Joi     |
| ---------------------- | -------------- | ------------ | ------- | ------- | ------- |
| Interface-like syntax  | Yes            | Yes          | No      | No      | No      |
| Conditional validation | Yes            | Enhanced     | Limited | No      | Limited |
| Custom error messages  | Yes            | Yes          | Yes     | Yes     | Yes     |
| TypeScript inference   | Full           | Full         | Full    | Limited | No      |
| VS Code extension      | Yes            | Yes          | No      | No      | No      |
| Active development     | Maintenance    | Active       | Active  | Active  | Active  |
| Bundle size            | Small          | Small        | Medium  | Large   | Large   |

**Note:** `reliant-type` represents the evolution of `fortify-schema` with enhanced capabilities and ongoing development.

## Community & Support

### Get Help

- [GitHub Issues](https://github.com/Nehonix-Team/fortify-schema/issues) - Bug reports and feature requests
- [Discord Community](https://discord.gg/nehonix) - Community discussions
- [Documentation](./docs/) - Comprehensive guides and API reference

### Contributing

Contributions are welcome. Please review our [Contributing Guide](./CONTRIBUTING.md) before submitting pull requests.

- Report bugs and request features
- Submit pull requests
- Improve documentation
- Share use cases and feedback

### Stay Updated

- Star us on [GitHub](https://github.com/Nehonix-Team/fortify-schema)
- Follow on [NPM](https://www.npmjs.com/package/fortify-schema)
- Join our [Discord](https://discord.gg/nehonix)

## License

MIT © [Nehonix Team](https://github.com/Nehonix-Team/fortify-schema)

## Acknowledgments

Developed by the Nehonix Team with contributions from the open-source community.

Special recognition to:

- The TypeScript team for language innovation
- The open-source community for feedback and contributions
- All contributors and users of Fortify Schema

---

<div align="center">
  <strong>Ready to get started?</strong>
  <br>
  <a href="./docs/MIGRATION-TO-RELIANT-TYPE.md">Migrate to Reliant-Type</a> •
  <a href="./docs/INSTALLATION.md">Installation Guide</a> •
  <a href="./docs/CORE-FEATURES.md">Core Features</a> •
  <a href="./docs/API-REFERENCE.md">API Reference</a>
</div>
