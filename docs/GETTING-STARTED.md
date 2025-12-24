# Getting Started with Fortify Schema

Welcome to Fortify Schema! This guide will get you up and running in minutes with TypeScript-first validation using interface-native syntax.

## 🚀 Installation

### Requirements

- **TypeScript 4.5+** or **JavaScript ES2020+**
- **Node.js 14+** (for Node.js projects)
- **Modern browser** (for browser projects)

### Install Fortify Schema

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

### Optional: VS Code Extension

For the best development experience, install our VS Code extension:

```bash
# Download and install
curl -L https://dll.nehonix.com/pkgs/mods/vscode/latest/fortify-schema.vsix -o fortify-schema.vsix
code --install-extension fortify-schema.vsix
```

## 🎯 Your First Schema

Let's create your first Fortify Schema in just 3 steps:

### Step 1: Import Fortify Schema

```typescript
import { Interface } from "fortify-schema";
```

### Step 2: Define Your Schema

```typescript
const UserSchema = Interface({
  id: "number",
  email: "email",
  name: "string",
  age: "number?", // Optional field
  isActive: "boolean",
});
```

### Step 3: Validate Data

```typescript
// Valid data
const userData = {
  id: 1,
  email: "john@example.com",
  name: "John Doe",
  age: 30,
  isActive: true,
};

// Validate with safeParse (recommended)
const result = UserSchema.safeParse(userData);

if (result.success) {
  console.log("✅ Valid data:", result.data);
  // result.data is fully typed!
} else {
  console.log("❌ Validation errors:", result.errors);
}
```

That's it! You've created and used your first Fortify Schema.

## 🎓 Core Concepts

### Interface-Native Syntax

Fortify Schema uses familiar TypeScript interface syntax:

```typescript
// Looks like a TypeScript interface!
const ProductSchema = Interface({
  id: "uuid", // UUID validation
  name: "string(1,100)", // String with length constraints
  price: "number(0.01,9999.99)", // Number with range constraints
  category: "electronics|books|clothing", // Union types
  inStock: "boolean",
  tags: "string[]?", // Optional array
  createdAt: "date", // Date validation
});
```

### Type Safety

Full TypeScript integration with perfect type inference:

```typescript
const result = ProductSchema.safeParse(productData);

if (result.success) {
  // TypeScript knows the exact types!
  const productName: string = result.data.name;
  const productPrice: number = result.data.price;
  const isInStock: boolean = result.data.inStock;
}
```

### Error Handling

Two ways to handle validation:

```typescript
// 1. Safe parsing (recommended)
const result = UserSchema.safeParse(data);
if (result.success) {
  // Use result.data
} else {
  // Handle result.errors
}

// 2. Direct parsing (throws on error)
try {
  const validData = UserSchema.parse(data);
  // Use validData
} catch (error) {
  // Handle validation error
}
```

## 📝 Basic Field Types

### Primitive Types

```typescript
const BasicSchema = Interface({
  // Basic types
  name: "string",
  age: "number",
  active: "boolean",
  birthday: "date",

  // Optional types (add ?)
  nickname: "string?",
  bio: "string?",

  // Arrays
  tags: "string[]",
  scores: "number[]?",

  // Any type (use sparingly)
  metadata: "any",
});
```

### Constrained Types

```typescript
const ConstrainedSchema = Interface({
  // String constraints
  username: "string(3,20)", // 3-20 characters
  password: "string(8,)", // Minimum 8 characters
  code: "string(6,6)", // Exactly 6 characters

  // Number constraints
  age: "number(0,120)", // Range 0-120
  price: "number(0.01,)", // Minimum 0.01
  discount: "number(,0.5)", // Maximum 0.5

  // Array constraints
  tags: "string[](1,5)", // 1-5 items
  scores: "number[](,10)", // Maximum 10 items
});
```

### Format Validation

```typescript
const FormatSchema = Interface({
  email: "email",
  website: "url",
  phone: "phone",
  userId: "uuid",

  // Custom regex patterns
  zipCode: "string(/^\\d{5}(-\\d{4})?$/)",
  productCode: "string(/^[A-Z]{2}\\d{4}$/)",
});
```

### Union Types

```typescript
const UnionSchema = Interface({
  status: "active|inactive|pending",
  role: "admin|user|guest|moderator",
  theme: "light|dark|auto",

  // Mixed type unions
  id: "string|number",
  value: "string|number|boolean",
});
```

## 🔥 V2 Conditional Validation

Fortify Schema V2 introduces powerful conditional validation with runtime property checking:

### Basic Conditional Validation

```typescript
const ConditionalSchema = Interface({
  role: "admin|user|guest",
  config: "any?",

  // V2 Runtime Methods
  hasPermissions: "when config.permissions.$exists() *? boolean : =false",
  isAdmin: "when role=admin *? boolean : =false",
  canEdit: "when role.$in(admin,moderator) *? boolean : =false",
});
```

### Available V2 Runtime Methods

```typescript
const V2MethodsSchema = Interface({
  data: "any?",

  // Property existence
  hasData: "when data.field.$exists() *? boolean : =false",

  // Empty checking
  isEmpty: "when data.list.$empty() *? boolean : =true",

  // Null checking
  isNull: "when data.value.$null() *? boolean : =false",

  // String methods
  containsText:
    "when data.description.$contains(important) *? boolean : =false",
  startsWithPrefix: "when data.code.$startsWith(PRE) *? boolean : =false",
  endsWithSuffix: "when data.filename.$endsWith(.pdf) *? boolean : =false",

  // Numeric range
  inRange: "when data.score.$between(0,100) *? boolean : =false",

  // Value inclusion
  isValidStatus:
    "when data.status.$in(active,pending,inactive) *? boolean : =false",
});
```

## 🏗️ Real-World Example

Let's build a complete user registration schema:

```typescript
import { Interface } from "fortify-schema";

const UserRegistrationSchema = Interface({
  // Basic information
  email: "email",
  password: "string(8,128)",
  confirmPassword: "string(8,128)",

  // Profile
  profile: {
    firstName: "string(1,50)",
    lastName: "string(1,50)",
    dateOfBirth: "date?",
    avatar: "url?",
  },

  // Preferences
  preferences: {
    theme: "light|dark|auto",
    language: "string(/^[a-z]{2}$/)",
    notifications: {
      email: "boolean",
      push: "boolean",
      sms: "boolean",
    },
  },

  // Terms and conditions
  acceptedTerms: "boolean",
  acceptedPrivacy: "boolean",

  // Optional marketing consent
  marketingConsent: "boolean?",

  // Runtime configuration for conditional validation
  config: "any?",

  // Conditional fields based on configuration
  betaFeatures: "when config.beta.$exists() *? string[] : =[]",
  premiumFeatures: "when config.premium.$exists() *? any : =null",
});

// Usage
const registrationData = {
  email: "user@example.com",
  password: "securePassword123",
  confirmPassword: "securePassword123",
  profile: {
    firstName: "John",
    lastName: "Doe",
    dateOfBirth: new Date("1990-01-01"),
  },
  preferences: {
    theme: "dark",
    language: "en",
    notifications: {
      email: true,
      push: false,
      sms: false,
    },
  },
  acceptedTerms: true,
  acceptedPrivacy: true,
  marketingConsent: false,
};

const result = UserRegistrationSchema.safeParse(registrationData);

if (result.success) {
  console.log("✅ Registration data is valid!");
  // Process registration with result.data
} else {
  console.log("❌ Validation errors:");
  result.errors.forEach((error) => {
    console.log(`- ${error.path.join(".")}: ${error.message}`);
  });
}
```

## 🛠️ Development Setup

### TypeScript Configuration

Add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### VS Code Settings

For the best experience with the VS Code extension, add to your `.vscode/settings.json`:

```json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "editor.semanticHighlighting.enabled": true,
  "editor.suggest.showWords": false,
  "fortify.enableDiagnostics": true,
  "fortify.colorScheme": "professional"
}
```

## 🎯 Next Steps

Now that you have the basics, explore more advanced features:

1. **[Field Types Reference](./FIELD-TYPES.md)** - Complete guide to all field types
2. **[Conditional Validation](./CONDITIONAL-VALIDATION.md)** - Advanced business logic validation
3. **[VS Code Extension](./VSCODE-EXTENSION.md)** - Enhanced development experience
4. **[Examples Collection](./EXAMPLES.md)** - Real-world usage patterns

## 🤝 Need Help?

- **[GitHub Issues](https://github.com/Nehonix-Team/fortify-schema/issues)** - Bug reports and feature requests
- **[GitHub Discussions](https://github.com/Nehonix-Team/fortify-schema/discussions)** - Community Q&A
- **[Documentation](./README.md)** - Complete documentation index

Welcome to the Fortify Schema community! 🎉
