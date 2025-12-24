# VS Code Extension Guide

Complete guide to the Fortify Schema VS Code extension - your professional development companion for TypeScript-first validation.

## 🚀 Installation

### Method 1: Direct Download

```bash
# Download the latest extension
curl -L https://dll.nehonix.com/pkgs/mods/vscode/latest/fortify-schema.vsix -o fortify-schema.vsix

# Install in VS Code
code --install-extension fortify-schema.vsix
```

### Method 2: VS Code Marketplace

The extension will be available on the VS Code Marketplace soon. For now, use the direct download method.

### Verification

After installation, you should see:

- ✅ "Fortify Schema extension loaded!" notification
- ✅ Enhanced syntax highlighting in TypeScript files
- ✅ IntelliSense suggestions in `Interface({...})` blocks

## ✨ Features Overview

### 🎨 Smart Syntax Highlighting

- **Context-aware highlighting** - Only activates within `Interface({...})` blocks
- **Semantic token support** - Rich colors for types, operators, and conditional logic
- **Professional color themes** - Multiple color schemes to choose from

### 🧠 Intelligent IntelliSense

- **Type autocompletion** - All Fortify Schema types with constraints
- **V2 method completion** - Smart suggestions for `.$method()` syntax
- **Property suggestions** - Auto-complete schema properties in conditionals
- **Context-aware** - Only suggests relevant completions

### 🔍 Real-time Validation

- **Instant error detection** - Catch syntax errors as you type
- **Detailed diagnostics** - Clear error messages with suggestions
- **@fortify-ignore support** - Suppress specific warnings
- **Performance optimized** - No impact on non-Fortify code

### 📖 Rich Documentation

- **Hover information** - Detailed docs for types and operators
- **Method documentation** - Complete V2 method reference on hover
- **Example snippets** - See usage examples without leaving your editor
- **Quick reference** - Access documentation instantly

### 🔗 Navigation Features

- **Go-to-definition** - Navigate to property definitions (Ctrl+click)
- **Variable highlighting** - Highlight conditional variables
- **Property references** - Find all uses of schema properties

## 🎯 Feature Details

### Syntax Highlighting

The extension provides professional syntax highlighting that activates only within Fortify Schema contexts:

```typescript
const UserSchema = Interface({
  // ✨ Rich highlighting for all these elements:
  id: "uuid", // Type highlighting
  email: "email", // Format highlighting
  name: "string(2,50)", // Constraint highlighting
  role: "admin|user|guest", // Union highlighting

  // V2 conditional syntax highlighting
  hasPermissions: "when config.permissions.$exists() *? boolean : =false",
  //              ^^^^                     ^^^^^^^^     ^^        ^
  //              keyword                  method       operator  literal
});
```

**Highlighted Elements:**

- **Keywords**: `when`, `Interface`
- **Types**: `string`, `number`, `boolean`, `email`, `uuid`, etc.
- **Operators**: `*?`, `:`, `=`, `|`, `&&`, `||`
- **Methods**: `$exists()`, `$empty()`, `$contains()`, etc.
- **Constraints**: `(min,max)`, `[array constraints]`
- **Literals**: `=value`, `=true`, `=false`

### IntelliSense & Autocompletion

#### Type Completion

Press `Ctrl+Space` to get intelligent type suggestions:

```typescript
const Schema = Interface({
  email: "em|", // Triggers: email, empty (if in conditional)
  //        ^ Cursor position - shows email completion
});
```

**Available Completions:**

- **Basic Types**: `string`, `number`, `boolean`, `date`, `any`
- **Format Types**: `email`, `url`, `uuid`, `phone`, `ip`, `json`
- **Constraint Types**: `positive`, `negative`, `int`
- **Array Types**: `string[]`, `number[]`, `boolean[]`, etc.

#### V2 Method Completion

Type `.$` to trigger V2 method completions:

```typescript
const Schema = Interface({
  config: "any?",
  hasData: "when config.data.$|", // Shows all 8 V2 methods
  //                        ^ Cursor - triggers method completion
});
```

**Available V2 Methods:**

- `$exists()` - Check if property exists
- `$empty()` - Check if property is empty
- `$null()` - Check if property is null
- `$contains(value)` - Check if contains value
- `$startsWith(prefix)` - Check if starts with prefix
- `$endsWith(suffix)` - Check if ends with suffix
- `$between(min,max)` - Check if value is in range
- `$in(val1,val2,...)` - Check if value is in list

#### Property Suggestions

When typing in conditional expressions, get property suggestions:

```typescript
const Schema = Interface({
  user: {
    profile: {
      name: "string",
      email: "email",
    },
  },

  // Type "user." to get property suggestions
  hasProfile: "when user.pr|", // Suggests: profile
  //                     ^ Shows property completions
});
```

### Real-time Validation

The extension provides instant feedback on schema syntax:

#### Error Detection

```typescript
const Schema = Interface({
  // ❌ Error: Invalid constraint syntax
  name: "string(,)", // Underlined in red

  // ❌ Error: Unknown type
  id: "unknowntype", // Underlined in red

  // ❌ Error: Invalid V2 method
  hasData: "when config.data.$invalid() *? boolean : =false",
  //                         ^^^^^^^^ Underlined in red
});
```

#### Warning Detection

```typescript
const Schema = Interface({
  // ⚠️ Warning: Consider using email type
  email: "string", // Underlined in yellow

  // ⚠️ Warning: Large array constraint
  items: "string[](1,10000)", // Performance warning
});
```

#### @fortify-ignore Support

Suppress specific warnings:

```typescript
const Schema = Interface({
  // @fortify-ignore - suppress email type warning
  email: "string", // No warning shown

  id: "string", // @fortify-ignore - inline ignore
});
```

### Hover Documentation

Hover over any Fortify Schema element for detailed information:

#### Type Documentation

```typescript
const Schema = Interface({
  email: "email", // Hover shows: Email validation with RFC 5322 compliance
  //     ^^^^^^^ Hover here for documentation
});
```

#### Method Documentation

```typescript
const Schema = Interface({
  config: "any?",
  hasData: "when config.data.$exists() *? boolean : =false",
  //                         ^^^^^^^^ Hover for method docs
});
```

**Hover Information Includes:**

- **Description** - What the type/method does
- **Syntax** - How to use it correctly
- **Examples** - Real usage examples
- **Parameters** - For methods with parameters
- **Return Type** - What the method returns

### Go-to-Definition

Navigate through your schemas with Ctrl+click:

```typescript
const UserSchema = Interface({
  profile: {
    name: "string",
    email: "email",
  },

  // Ctrl+click on "profile" jumps to definition above
  hasProfile: "when profile.$exists() *? boolean : =false",
  //                ^^^^^^^ Ctrl+click here
});
```

## 🎨 Color Themes

### Available Themes

The extension includes professional color schemes:

1. **Professional** (Default) - Clean, professional colors
2. **Dark Pro** - High contrast dark theme
3. **Light Clean** - Minimal light theme
4. **Vibrant** - Colorful, energetic theme
5. **Monochrome** - Subtle, minimal highlighting

### Applying Themes

```bash
# Command Palette (Ctrl+Shift+P)
> Fortify: Apply Color Scheme

# Or use the command
code --command fortify.applyColorScheme
```

### Custom Theme Configuration

Add to your VS Code `settings.json`:

```json
{
  "fortify.colorScheme": "professional",
  "editor.semanticHighlighting.enabled": true,
  "editor.tokenColorCustomizations": {
    "textMateRules": [
      {
        "scope": "fortify.type",
        "settings": {
          "foreground": "#4FC3F7"
        }
      }
    ]
  }
}
```

## ⚙️ Configuration

### Extension Settings

Configure the extension in VS Code settings:

```json
{
  // Enable/disable features
  "fortify.enableDiagnostics": true,
  "fortify.enableCompletion": true,
  "fortify.enableHover": true,
  "fortify.enableSemanticTokens": true,

  // Color scheme
  "fortify.colorScheme": "professional",

  // Validation settings
  "fortify.validateOnType": true,
  "fortify.showWarnings": true,
  "fortify.maxDiagnostics": 100,

  // Performance settings
  "fortify.debounceTime": 300,
  "fortify.maxFileSize": 1048576 // 1MB
}
```

### Workspace Settings

For project-specific settings, add to `.vscode/settings.json`:

```json
{
  "fortify.enableDiagnostics": true,
  "fortify.colorScheme": "dark-pro",
  "files.associations": {
    "*.fortify.ts": "typescript"
  }
}
```

## 🔧 Commands

### Available Commands

Access via Command Palette (`Ctrl+Shift+P`):

| Command                       | Description                             |
| ----------------------------- | --------------------------------------- |
| `Fortify: Validate Schema`    | Manually validate current file          |
| `Fortify: Apply Color Scheme` | Choose and apply color theme            |
| `Fortify: List Color Schemes` | View available themes                   |
| `Fortify: Cleanup Themes`     | Reset theme settings                    |
| `Fortify: Generate Types`     | Generate TypeScript types (coming soon) |
| `Fortify: Format Schema`      | Format schema syntax (coming soon)      |

### Keyboard Shortcuts

Default shortcuts (can be customized):

| Shortcut       | Command            |
| -------------- | ------------------ |
| `Ctrl+Shift+V` | Validate Schema    |
| `Ctrl+Shift+T` | Apply Color Scheme |
| `F12`          | Go to Definition   |
| `Ctrl+Space`   | Trigger Completion |

## 🐛 Troubleshooting

### Extension Not Working?

1. **Check file type** - Extension works with `.ts`, `.js`, `.tsx`, `.jsx`
2. **Verify syntax** - Must be inside `Interface({...})` blocks
3. **Restart VS Code** - Sometimes needed after installation
4. **Check settings** - Ensure semantic highlighting is enabled

### No Syntax Highlighting?

```json
// Add to settings.json
{
  "editor.semanticHighlighting.enabled": true,
  "fortify.enableSemanticTokens": true
}
```

### IntelliSense Not Working?

1. **Check trigger characters** - Type `"`, `:`, `.$` to trigger
2. **Verify context** - Must be inside `Interface({...})`
3. **Check settings** - Ensure completion is enabled
4. **Restart TypeScript service** - `Ctrl+Shift+P` > "TypeScript: Restart TS Server"

### Performance Issues?

```json
// Optimize performance
{
  "fortify.debounceTime": 500,
  "fortify.maxFileSize": 524288, // 512KB
  "fortify.maxDiagnostics": 50
}
```

### Diagnostics Not Showing?

1. **Check diagnostics setting** - `"fortify.enableDiagnostics": true`
2. **Verify file size** - Large files may be skipped
3. **Check ignore comments** - `@fortify-ignore` suppresses diagnostics

## 🧹 Manual Cleanup

If you uninstall the extension and want to clean up settings:

### Remove Extension Settings

1. Open VS Code Settings (`Ctrl+,`)
2. Search for "fortify"
3. Reset any custom settings to default

### Clean Up Theme Settings

```bash
# Command Palette (Ctrl+Shift+P)
> Fortify: Cleanup Themes

# Or manually remove from settings.json:
# - Remove "fortify.*" settings
# - Remove custom tokenColorCustomizations
```

### Reset Workspace Settings

Remove from `.vscode/settings.json`:

```json
{
  // Remove these lines:
  "fortify.enableDiagnostics": true,
  "fortify.colorScheme": "professional"
}
```

## 🚀 Tips & Tricks

### Productivity Tips

1. **Use snippets** - Type `interface` for quick schema template
2. **Leverage hover** - Hover for instant documentation
3. **Use go-to-definition** - Navigate large schemas easily
4. **Apply themes** - Choose colors that match your workflow

### Advanced Usage

1. **Multi-cursor editing** - Edit multiple schema fields simultaneously
2. **Folding** - Collapse large nested objects
3. **Search** - Use `Ctrl+F` to find schema properties
4. **Refactoring** - Rename properties across conditionals

### Integration Tips

1. **Git integration** - Extension works with Git diffs
2. **Live Share** - Syntax highlighting works in collaborative sessions
3. **Remote development** - Full support for remote containers/SSH

## 🔗 Related Documentation

- **[Getting Started](./GETTING-STARTED.md)** - Basic Fortify Schema usage
- **[Field Types Reference](./FIELD-TYPES.md)** - Complete type reference
- **[Conditional Validation](./CONDITIONAL-VALIDATION.md)** - V2 conditional syntax
- **[Quick Reference](./QUICK-REFERENCE.md)** - Syntax cheat sheet

## 🤝 Support

- **[GitHub Issues](https://github.com/Nehonix-Team/fortify-schema/issues)** - Bug reports and feature requests
- **[GitHub Discussions](https://github.com/Nehonix-Team/fortify-schema/discussions)** - Community Q&A
- **Email**: support@nehonix.com
