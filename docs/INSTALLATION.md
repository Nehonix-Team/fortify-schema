# Installation & Setup

## Requirements

- **TypeScript 4.5+**
- **Node.js 14+**
- **VS Code** (recommended for enhanced development experience)

## Installation

### NPM
```bash
npm install fortify-schema
```

### Yarn
```bash
yarn add fortify-schema
```

### Bun
```bash
bun add fortify-schema
```

## VS Code Extension

Enhance your development workflow with our dedicated VS Code extension featuring comprehensive developer tools.

### 🎨 Enhanced Features

- **Syntax Highlighting**: Full syntax highlighting for all Fortify Schema types and utilities
- **Hover Documentation**: Detailed type information, examples, and use cases on hover
- **IntelliSense**: Smart autocompletion for types, methods, and patterns
- **Error Detection**: Real-time validation of schema syntax
- **Code Snippets**: Pre-built templates for common schema patterns

### 📖 Interactive Documentation

When you hover over any type in `Interface({...})` blocks, you'll see:

- **Type Information**: What the type validates and its constraints
- **Examples**: Real-world usage examples
- **Use Cases**: When and where to use each type
- **Code Examples**: Complete working examples

### 🔧 Installation

```bash
# Download and install
code --install-extension fortify-schema-vscode-0.1.24.vsix

# Or just search for "fortify-schema" in the vscode marketplace
```

Download the latest extension from: [VS Code Extension](https://sdk.nehonix.space/pkgs/mods/vscode/latest/fortify-schema.vsix)

## Quick Start

```typescript
import { Interface } from "fortify-schema";

// Define your schema
const UserSchema = Interface({
  id: "uuid",
  email: "email --> Please provide a valid email address",
  name: "string(2,50) --> Name must be between 2 and 50 characters",
  age: "number(18,120)?",
  role: "admin|user|guest",
});

// Validate data
const result = UserSchema.safeParse(userData);

if (result.success) {
  console.log("Valid user:", result.data); // Fully typed!
} else {
  console.log("Validation errors:", result.errors);
}
```

## Next Steps

- [Core Features](./CORE-FEATURES.md) - Learn about all available types and validators
- [Conditional Validation](./CONDITIONAL-VALIDATION-GUIDE.md) - Advanced runtime validation
- [Custom Error Messages](./CUSTOM-ERROR-MESSAGES.md) - User-friendly error messages
- [API Reference](./API-REFERENCE.md) - Complete API documentation
- [Examples](../examples/) - Real-world usage examples

## TypeScript Configuration

For optimal TypeScript support, ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

## Troubleshooting

### Module Not Found

If you encounter module resolution issues:

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

Ensure you're using TypeScript 4.5 or higher:

```bash
npm install -D typescript@latest
```

### VS Code Extension Not Working

1. Restart VS Code
2. Check that the extension is enabled
3. Verify you're working in a TypeScript/JavaScript file
4. Check the Output panel for error messages

## Support

- [GitHub Issues](https://github.com/Nehonix-Team/fortify-schema/issues)
- [Discord Community](https://discord.gg/nehonix)
- [Documentation](https://github.com/Nehonix-Team/fortify-schema/tree/main/docs)
