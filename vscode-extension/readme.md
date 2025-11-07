# FortiFySchema VSCode Extension

[![Version](https://img.shields.io/visual-studio-marketplace/v/NEHONIX.fortify-schema-vscode)](https://marketplace.visualstudio.com/items?itemName=NEHONIX.fortify-schema-vscode)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/NEHONIX.fortify-schema-vscode)](https://marketplace.visualstudio.com/items?itemName=NEHONIX.fortify-schema-vscode)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/NEHONIX.fortify-schema-vscode)](https://marketplace.visualstudio.com/items?itemName=NEHONIX.fortify-schema-vscode)

**Professional TypeScript validation with intelligent IDE support**

The official VSCode extension for FortiFySchema - providing syntax highlighting, intelligent autocompletion, real-time validation, and comprehensive documentation for TypeScript schema validation.

## ✨ Key Features

### 🎨 **Smart Syntax Highlighting**

- **Context-aware highlighting** - Only activates within `Interface({...})` blocks
- **Semantic token support** - Rich colors for types, operators, and conditional logic
- **Multiple color themes** - Choose from professional color schemes

### 🧠 **Intelligent IntelliSense**

- **Type autocompletion** - All FortiFySchema types with constraints
- **Conditional syntax** - Smart suggestions for `when` expressions
- **Method completion** - `.in()`, `.exists`, `.contains()` and more
- **Context-aware** - Only suggests relevant completions

### ⚡ **Real-time Validation**

- **Instant error detection** - Catch syntax errors as you type
- **Detailed diagnostics** - Clear error messages with suggestions
- **Performance optimized** - No impact on non-FortiFySchema code

### 📚 **Rich Documentation**

- **Hover information** - Detailed docs for types and operators
- **Example snippets** - See usage examples on hover
- **Quick reference** - Access documentation without leaving your editor

## 🎯 Precision Targeting

This extension is designed to be **non-intrusive** and **context-aware**:

- ✅ **Activates ONLY** within `Interface({...})` function calls
- ✅ **Ignores** regular strings and other code
- ✅ **Zero interference** with your existing TypeScript/JavaScript workflow
- ✅ **Performance optimized** - No slowdown on large codebases

## 🚀 Quick Start

### 1. Install the Extension

**From VS Code Marketplace:**

1. Open VS Code Extensions (`Ctrl+Shift+X`)
2. Search for "FortiFySchema"
3. Click "Install"

**From Command Line:**

```bash
code --install-extension NEHONIX.fortify-schema-vscode
```

### 2. Install FortiFySchema

```bash
npm install fortify-schema
```

### 3. Start Using

```typescript
import { Interface } from "fortify-schema";

const UserSchema = Interface({
  id: "int(1,)", // 🎨 Syntax highlighted
  email: "email", // 💡 Hover for docs
  role: "admin|user|guest", // 🌈 Union types
  permissions: "when role=admin *? string[] : string[]?", // ⚡ Conditional validation
});

// ✅ Full TypeScript inference
const result = UserSchema.safeParse(userData);
```

## 📖 Supported Syntax

### Basic Types

```typescript
{
  name: "string",           // String type
  age: "int(18,120)",      // Integer with range
  email: "email",          // Email validation
  optional: "string?",     // Optional field
  required: "string!",     // Required (non-null, non-empty)
  tags: "string[]",        // Array type
  status: "active|inactive" // Union type
}
```

### Custom Error Messages

Define custom error messages for better user experience:

```typescript
{
  // Basic custom message
  name: "string --> Please provide a valid name",
  
  // With constraints
  age: "number(18,100) --> Age must be between 18 and 100",
  
  // With required marker
  email: "email! --> Please provide a valid email address",
  
  // With optional marker
  phone: "string? --> Phone number must be a string if provided",
  
  // Complex validation
  username: "string(3,20)! --> Username must be 3-20 characters and cannot be empty"
}
```

### Conditional Validation

```typescript
{
  // Complex business logic
  maxProjects: "when accountType=free *? int(1,3) : int(1,100)",

  // Method calls
  access: "when role.in(admin,manager) *? =granted : =denied",

  // Logical operators
  features: "when role=admin && status=active *? string[] : string[]?",
}
```

### Advanced Features

```typescript
{
  // Constraints
  password: "string(8,128)",
  score: "number(0,100)",

  // Array constraints
  items: "string[](1,10)",

  // Constants
  type: "=user",

  // Nested conditions
  access: "when status=active *? when role=admin *? =full : =limited : =none"
}
```

## ⚙️ Configuration

### Recommended Settings

Add to your VS Code `settings.json`:

```json
{
  "editor.semanticHighlighting.enabled": true,
  "typescript.suggest.autoImports": true,
  "typescript.preferences.quoteStyle": "double",
  "editor.quickSuggestions": {
    "strings": true
  }
}
```

### Color Themes

The extension includes multiple professional color themes:

- **Default** - Balanced colors for readability
- **Vibrant** - High contrast for better distinction
- **Minimal** - Subtle highlighting for clean aesthetics
- **Ocean** - Blue-teal palette for calm coding
- **Sunset** - Warm orange-purple gradient
- **Matrix** - Green-on-black hacker style
- **Cyberpunk** - Neon colors for futuristic feel
- **Pastel** - Soft colors for gentle highlighting

Access themes via: `Ctrl+Shift+P` → "FortiFySchema: Apply Color Scheme"

## 🔧 Commands

| Command                         | Description                    |
| ------------------------------- | ------------------------------ |
| `FortiFySchema: Validate Schema`    | Manually validate current file |
| `FortiFySchema: Apply Color Scheme` | Choose color theme             |
| `FortiFySchema: List Color Schemes` | View available themes          |

## 🐛 Troubleshooting

### Extension Not Working?

1. **Check file type** - Extension works with `.ts`, `.js`, `.tsx`, `.jsx`
2. **Verify syntax** - Must be inside `Interface({...})` blocks
3. **Restart VS Code** - Sometimes needed after installation
4. **Check settings** - Ensure semantic highlighting is enabled

### Performance Issues?

The extension is optimized for performance:

- Only processes `Interface({...})` blocks
- Ignores regular strings and comments
- Uses efficient parsing algorithms
- No impact on large codebases

## 📚 Documentation

- **[FortiFySchema Documentation](https://github.com/Nehonix-Team/fortify-schema)**
- **[Conditional Validation Guide](https://github.com/Nehonix-Team/fortify-schema/blob/main/docs/CONDITIONAL_VALIDATION_GUIDE.md)**
- **[Type Reference](https://github.com/Nehonix-Team/fortify-schema/blob/main/docs/OPERATIONS-REFERENCE.md)**

## 🤝 Contributing

We welcome contributions!

- **Report bugs**: [GitHub Issues](https://github.com/Nehonix-Team/fortify-schema/issues)
- **Feature requests**: [GitHub Discussions](https://github.com/Nehonix-Team/fortify-schema/discussions)
- **Pull requests**: [Contributing Guide](https://github.com/Nehonix-Team/fortify-schema/blob/main/CONTRIBUTING.md)

## 📄 License

MIT © [Nehonix Team](https://github.com/Nehonix-Team/fortify-schema)

---
