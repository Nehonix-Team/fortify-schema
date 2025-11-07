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

- **Custom Error Messages (`-->`)**: Define user-friendly error messages with `"type --> Your custom message"`
- **Required Fields (`!`)**: Enforce non-empty strings and non-zero numbers with `"string!"` and `"number!"`
- **Object Types**: Validate generic object structures with `"object"` and `"object?"`
- **Enhanced Security**: All string operations now use secure regex patterns
- **Improved Performance**: Optimized validation paths with better caching and precompilation

## ✨ Quick Start

```bash
npm install fortify-schema
```

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
  console.log("Valid user:", result.data); // Fully typed!
} else {
  console.log("Validation errors:", result.errors);
  // Custom error messages appear here!
}
```

## 🎯 Key Features

### 🔤 Intuitive Syntax
Write schemas using TypeScript-like interface definitions that feel natural and familiar.

### ⚡ Advanced Conditionals
Unique runtime property validation and business logic with `when` expressions.

### 🎨 Custom Error Messages
Provide user-friendly, context-specific error messages with the `-->` operator.

### 🔒 Type Safety
Complete TypeScript inference and compile-time validation with zero compromises.

### 🚀 High Performance
Automatic precompilation and optimization for production-grade performance.

### 🛠️ VS Code Extension
Professional IDE integration with syntax highlighting, IntelliSense, and real-time validation.

## 📚 Documentation

### Getting Started
- [Installation & Setup](./docs/INSTALLATION.md) - Get up and running quickly
- [Core Features](./docs/CORE-FEATURES.md) - Learn all available types and validators
- [Quick Examples](./examples/) - Real-world usage examples

### Core Concepts
- [Type System](./docs/CORE-FEATURES.md#comprehensive-type-support) - All available types
- [Constraints](./docs/CORE-FEATURES.md#constraints) - Min/max, length, range validation
- [Modifiers](./docs/CORE-FEATURES.md#type-modifiers) - Optional (`?`), Required (`!`)
- [Custom Error Messages](./docs/CUSTOM-ERROR-MESSAGES.md) - User-friendly validation feedback

### Advanced Features
- [Conditional Validation](./docs/CONDITIONAL-VALIDATION-GUIDE.md) - Runtime business logic
- [Utility Functions](./docs/CORE-FEATURES.md#utility-functions) - Make.const(), Record types
- [Schema Transformation](./docs/API-REFERENCE.md#mod-utilities) - Pick, Omit, Merge, Partial
- [Live Validation](./docs/LIVE-UTILITY.md) - Real-time validation with EventEmitter

### Reference
- [API Reference](./docs/API-REFERENCE.md) - Complete API documentation
- [Type Inference](./docs/TYPE-INFERENCE.md) - TypeScript integration
- [Error Handling](./docs/API-REFERENCE.md#error-handling) - Error structure and patterns
- [Performance Guide](./docs/PERFORMANCE.md) - Optimization tips

## 🔥 Popular Use Cases

### Form Validation
```typescript
const FormSchema = Interface({
  email: "email! --> Please enter a valid email",
  password: "string(8,)! --> Password must be at least 8 characters",
  confirmPassword: "string --> Passwords must match",
  terms: "boolean! --> You must accept the terms",
});
```

### API Validation
```typescript
const APIRequestSchema = Interface({
  method: "GET|POST|PUT|DELETE",
  endpoint: "url",
  headers: "record<string, string>",
  body: "object?",
});
```

### E-Commerce
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

## 🎨 VS Code Extension

Enhance your development experience with our dedicated VS Code extension:

- **Syntax Highlighting** - Beautiful highlighting for all schema types
- **IntelliSense** - Smart autocompletion and suggestions
- **Hover Documentation** - Detailed docs and examples on hover
- **Error Detection** - Real-time validation of schema syntax
- **Code Snippets** - Pre-built templates for common patterns

[Download Extension](https://sdk.nehonix.space/pkgs/mods/vscode/latest/fortify-schema.vsix) | [Extension Docs](./vscode-extension/readme.md)

## 🚀 Performance

Fortify Schema is engineered for high-performance validation:

- **Fast Validation**: Optimized validation paths with precompilation
- **Memory Efficient**: Minimal memory overhead per schema instance
- **Scalable**: Performance scales predictably with data complexity
- **Benchmarked**: Continuous performance monitoring

Run benchmarks:
```bash
npm run benchmark
npm run benchmark:nestedObject
```

[View Benchmark Results](./src/bench/BENCHMARK-RESULTS.md)

## 🤝 Community & Support

### Get Help
- [GitHub Issues](https://github.com/Nehonix-Team/fortify-schema/issues) - Bug reports and feature requests
- [Discord Community](https://discord.gg/nehonix) - Chat with the community
- [Documentation](./docs/) - Comprehensive guides and references

### Contributing
We welcome contributions! See our [Contributing Guide](./CONTRIBUTING.md) for details.

- Report bugs and request features
- Submit pull requests
- Improve documentation
- Share your use cases

### Stay Updated
- ⭐ Star us on [GitHub](https://github.com/Nehonix-Team/fortify-schema)
- 📦 Follow on [NPM](https://www.npmjs.com/package/fortify-schema)
- 💬 Join our [Discord](https://discord.gg/nehonix)

## 📊 Comparison

| Feature | Fortify Schema | Zod | Yup | Joi |
|---------|---------------|-----|-----|-----|
| Interface-like syntax | ✅ | ❌ | ❌ | ❌ |
| Conditional validation | ✅ | ⚠️ Limited | ❌ | ⚠️ Limited |
| Custom error messages | ✅ | ✅ | ✅ | ✅ |
| TypeScript inference | ✅ | ✅ | ⚠️ Limited | ❌ |
| VS Code extension | ✅ | ❌ | ❌ | ❌ |
| Bundle size | Small | Medium | Large | Large |
| Performance | Excellent | Good | Good | Good |

## 📄 License

MIT © [Nehonix Team](https://github.com/Nehonix-Team/fortify-schema)

## 🙏 Acknowledgments

Built with ❤️ by the Nehonix Team and our amazing contributors.

Special thanks to:
- The TypeScript team for an amazing language
- The open-source community for inspiration and feedback
- All our contributors and users

---

<div align="center">
  <strong>Ready to get started?</strong>
  <br>
  <a href="./docs/INSTALLATION.md">Installation Guide</a> •
  <a href="./docs/CORE-FEATURES.md">Core Features</a> •
  <a href="./docs/API-REFERENCE.md">API Reference</a> •
  <a href="./examples/">Examples</a>
</div>
