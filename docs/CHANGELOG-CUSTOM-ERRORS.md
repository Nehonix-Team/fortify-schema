# Custom Error Messages Feature - Changelog

## Overview

Custom error messages allow developers to provide user-friendly, context-specific validation feedback using the `-->` operator syntax.

## What's New

### Syntax
```typescript
"type --> Your custom error message"
```

### Features Added

1. **Custom Error Message Operator (`-->`)**
   - Separates type definition from custom error message
   - Flexible spacing: `"type-->msg"`, `"type--> msg"`, or `"type --> msg"`
   - Works with all validators and modifiers

2. **Full Type Inference Support**
   - TypeScript correctly strips custom messages from type inference
   - Union types properly inferred: `"admin|user --> message"` → `"admin" | "user"`
   - No impact on type safety

3. **Universal Compatibility**
   - ✅ Basic types (`string`, `number`, `boolean`, etc.)
   - ✅ Format types (`email`, `url`, `uuid`, etc.)
   - ✅ Constraints (`string(min,max)`, `number(min,max)`)
   - ✅ Union types (`value1|value2|value3`)
   - ✅ Arrays (`string[]`, `number[]`)
   - ✅ Required fields (`type!`)
   - ✅ Optional fields (`type?`)
   - ✅ Nested objects
   - ✅ Conditional validation

4. **VSCode Extension Support**
   - Syntax highlighting for `-->` operator
   - Validation recognizes custom error message syntax
   - No false errors for valid custom message syntax

## Files Modified

### Core Library
- `src/core/types/parser.type.ts` - Added `customErrorMessage` field to `ParsedConstraints`
- `src/core/schema/mode/interfaces/validators/ConstraintParser.ts` - Parse `-->` syntax
- `src/core/schema/mode/interfaces/validators/TypeValidators.ts` - Use custom messages in validation
- `src/core/schema/mode/interfaces/validators/ValidationHelpers.ts` - Pass custom messages through validation chain
- `src/core/schema/mode/interfaces/InterfaceSchema.ts` - Extract and pass custom messages, skip precompilation
- `src/core/schema/mode/interfaces/typescript/TypeInference.ts` - Strip custom messages from type inference

### VSCode Extension
- `vscode-extension/syntaxes/fortify-embedded.tmGrammar.json` - Syntax highlighting patterns
- `vscode-extension/src/providers/FortifyDiagnostics.ts` - Validation recognizes custom messages
- `vscode-extension/readme.md` - Documentation

### Documentation
- `README.md` - Updated with custom error message examples
- `docs/CUSTOM-ERROR-MESSAGES.md` - Comprehensive guide
- `docs/web/custom-error-messages.html` - Web documentation

## Examples

### Basic Usage
```typescript
const schema = Interface({
  email: "email --> Please provide a valid email address",
  age: "number(18,100) --> Age must be between 18 and 100",
});
```

### With Required Fields
```typescript
const schema = Interface({
  password: "string(8,)! --> Password must be at least 8 characters",
});
```

### With Union Types
```typescript
const schema = Interface({
  role: "admin|user|guest --> Invalid role selected",
});
```

### Nested Objects
```typescript
const schema = Interface({
  user: {
    name: "string --> Name is required",
    settings: {
      theme: "light|dark --> Theme must be light or dark",
    },
  },
});
```

## Breaking Changes

None. This is a backward-compatible addition.

## Migration Guide

No migration needed. Existing schemas continue to work without changes.

To add custom error messages:
1. Add `-->` after your type definition
2. Write your custom message
3. That's it!

```typescript
// Before
email: "email"

// After
email: "email --> Please provide a valid email address"
```

## Performance Impact

Minimal. Custom error messages are extracted once during schema creation. Runtime validation performance is nearly identical to schemas without custom messages.

## Testing

All tests passing:
- ✅ Type validation with custom messages
- ✅ Constraint validation with custom messages
- ✅ Union validation with custom messages
- ✅ Required field validation with custom messages
- ✅ Optional field validation with custom messages
- ✅ TypeScript type inference
- ✅ VSCode extension validation

## Future Enhancements

Potential future additions:
- Template variables in error messages (e.g., `"number(${min},${max}) --> Value must be between ${min} and ${max}"`)
- Error message localization helpers
- Error message formatting options

## Credits

Developed by the Nehonix Team with community feedback.

## Related Documentation

- [Custom Error Messages Guide](./CUSTOM-ERROR-MESSAGES.md)
- [Required Fields Documentation](./REQUIRED-FIELDS.md)
- [Type Inference Documentation](./TYPE-INFERENCE.md)
- [VSCode Extension Guide](../vscode-extension/readme.md)

---

**Version:** 1.x.x  
**Release Date:** November 2025  
**Status:** ✅ Stable
