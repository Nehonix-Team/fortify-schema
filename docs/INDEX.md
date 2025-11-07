# Fortify Schema Documentation

Welcome to the Fortify Schema documentation! This guide will help you find exactly what you need.

## 📚 Documentation Structure

### Getting Started
Perfect for newcomers and quick reference.

- **[Installation & Setup](./INSTALLATION.md)** - Get up and running in minutes
  - Requirements
  - Installation methods (npm, yarn, bun)
  - VS Code extension setup
  - Quick start guide

### Core Documentation
Essential reading for all users.

- **[Core Features](./CORE-FEATURES.md)** - Complete guide to all types and validators
  - Basic types (string, number, boolean, etc.)
  - String formats (email, url, uuid, etc.)
  - Constraints (min/max, length, range)
  - Arrays, objects, and unions
  - Type modifiers (?, !, -->)
  
- **[API Reference](./API-REFERENCE.md)** - Complete API documentation
  - Validation methods (parse, safeParse, etc.)
  - Utility functions (Make.const, Make.union, etc.)
  - Schema options and configuration
  - Error handling patterns
  - Type definitions

### Advanced Features
Take your validation to the next level.

- **[Conditional Validation](./CONDITIONAL-VALIDATION-GUIDE.md)** - Advanced runtime validation
  - When expressions
  - Runtime methods
  - Complex business logic
  - Nested conditions
  
- **[Custom Error Messages](./CUSTOM-ERROR-MESSAGES.md)** - User-friendly validation feedback
  - Syntax and usage
  - Best practices
  - Internationalization
  - Examples

- **[Live Utility](./LIVE-UTILITY.md)** - Real-time validation (Beta)
  - EventEmitter interface
  - Stream control
  - Form integration
  - Performance monitoring

### Reference Guides

- **[Type Inference](./TYPE-INFERENCE.md)** - TypeScript integration
- **[Performance Guide](./PERFORMANCE.md)** - Optimization tips
- **[Error Handling](./ERROR-HANDLING.md)** - Error structure and patterns
- **[Migration Guide](./MIGRATION.md)** - Upgrading from older versions

### Feature Changelogs

- **[Custom Error Messages Changelog](./CHANGELOG-CUSTOM-ERRORS.md)** - Custom error messages feature details
- **[Required Fields](./REQUIRED-FIELDS.md)** - Non-nullable syntax (!)
- **[Optional Fields](./OPTIONAL-FIELDS.md)** - Optional syntax (?)

### Web Documentation

Interactive HTML documentation for better reading experience:

- **[Custom Error Messages (Web)](./web/custom-error-messages.html)** - Beautiful interactive guide

## 🎯 Quick Navigation

### By Use Case

**I want to...**

- **Validate form data** → [Core Features](./CORE-FEATURES.md) + [Custom Error Messages](./CUSTOM-ERROR-MESSAGES.md)
- **Validate API requests** → [Core Features](./CORE-FEATURES.md) + [Error Handling](./API-REFERENCE.md#error-handling)
- **Add business logic** → [Conditional Validation](./CONDITIONAL-VALIDATION-GUIDE.md)
- **Improve error messages** → [Custom Error Messages](./CUSTOM-ERROR-MESSAGES.md)
- **Optimize performance** → [Performance Guide](./PERFORMANCE.md)
- **Transform schemas** → [API Reference - Mod Utilities](./API-REFERENCE.md#mod-utilities)
- **Real-time validation** → [Live Utility](./LIVE-UTILITY.md)

### By Experience Level

**Beginner** (New to Fortify Schema)
1. [Installation](./INSTALLATION.md)
2. [Core Features](./CORE-FEATURES.md)
3. [Custom Error Messages](./CUSTOM-ERROR-MESSAGES.md)
4. [API Reference](./API-REFERENCE.md)

**Intermediate** (Familiar with basics)
1. [Conditional Validation](./CONDITIONAL-VALIDATION-GUIDE.md)
2. [Type Inference](./TYPE-INFERENCE.md)
3. [Performance Guide](./PERFORMANCE.md)
4. [Error Handling](./API-REFERENCE.md#error-handling)

**Advanced** (Power user)
1. [Live Utility](./LIVE-UTILITY.md)
2. [Schema Transformation](./API-REFERENCE.md#mod-utilities)
3. [Performance Optimization](./PERFORMANCE.md)
4. [Custom Validators](./ADVANCED.md) (Coming soon)

## 📖 Documentation Formats

- **Markdown (.md)** - GitHub-friendly, easy to read and search
- **HTML (.html)** - Interactive web documentation with better styling
- **Examples** - Real-world code examples in `/examples` directory

## 🔍 Search Tips

Use GitHub's search to find specific topics:

```
repo:Nehonix-Team/fortify-schema [your search term]
```

Or search within docs:
```
repo:Nehonix-Team/fortify-schema path:docs/ [your search term]
```

## 🤝 Contributing to Docs

Found a typo? Want to improve explanations? We welcome documentation contributions!

1. Fork the repository
2. Edit the relevant `.md` file in `/docs`
3. Submit a pull request

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## 📝 Documentation Standards

Our docs follow these principles:

- **Clear Examples** - Every feature has working code examples
- **Progressive Disclosure** - Start simple, add complexity gradually
- **Searchable** - Use clear headings and keywords
- **Up-to-date** - Docs are updated with every release
- **Accessible** - Written for developers of all skill levels

## 🆘 Need Help?

Can't find what you're looking for?

- **[GitHub Issues](https://github.com/Nehonix-Team/fortify-schema/issues)** - Report bugs or request features
- **[Discord Community](https://discord.gg/nehonix)** - Chat with the community
- **[Stack Overflow](https://stackoverflow.com/questions/tagged/fortify-schema)** - Ask questions

## 📅 Recent Updates

- **Nov 2025** - Custom error messages feature added
- **Nov 2025** - Modular documentation structure
- **Nov 2025** - Required fields (!) syntax
- **Oct 2025** - VS Code extension released

## 🗺️ Documentation Roadmap

Coming soon:

- [ ] Video tutorials
- [ ] Interactive playground
- [ ] More real-world examples
- [ ] Advanced patterns guide
- [ ] Testing guide
- [ ] Migration guides for other libraries

---

<div align="center">
  <strong>Ready to dive in?</strong>
  <br>
  Start with <a href="./INSTALLATION.md">Installation</a> or explore <a href="./CORE-FEATURES.md">Core Features</a>
</div>
