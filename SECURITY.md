# Security Policy

## Supported Versions

We are committed to maintaining the security of Fortify Schema. The following versions are currently supported with security updates:

| Version | Supported          | Status                 |
| ------- | ------------------ | ---------------------- |
| 2.1.x   | :white_check_mark: | Current stable (2.1.2) |
| 2.0.x   | :white_check_mark: | LTS support            |
| 1.x.x   | :x:                | End of life            |
| < 1.0   | :x:                | End of life            |

**Note**: As Fortify Schema is actively developed, we maintain support for the current minor version series (2.1.x) and the most recent major version (2.0.x) for long-term support. The current stable release is **2.1.2**.

## Security Features

Fortify Schema incorporates several built-in security measures:

- **Secure Regex Patterns**: All string operations use secure regex patterns instead of potentially vulnerable methods
- **Input Sanitization**: Automatic validation prevents common injection attacks
- **Type Safety**: Runtime validation ensures data integrity and prevents type confusion attacks
- **Depth Limiting**: Built-in protection against deeply nested objects (default limit: 500 levels, configurable)
- **Memory Safety**: Optimized validation paths prevent memory exhaustion attacks

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability in Fortify Schema, please follow these steps:

### Where to Report

- **Email**: Send details to `fortifyschema@gmail.com`
- **GitHub**: For non-critical issues, you may also use [GitHub Security Advisories](https://github.com/Nehonix-Team/fortify-schema/security/advisories)

### What to Include

Please include the following information in your report:

1. **Description**: Clear description of the vulnerability
2. **Steps to Reproduce**: Detailed steps to reproduce the issue
3. **Impact Assessment**: Potential security impact and affected components
4. **Proof of Concept**: Code example demonstrating the vulnerability (if applicable)
5. **Suggested Fix**: If you have ideas for remediation (optional)
6. **Environment**: Fortify Schema version, Node.js version, TypeScript version

### Response Timeline

- **Initial Response**: Within 48 hours of report submission
- **Vulnerability Assessment**: Within 5 business days
- **Fix Development**: Within 14 days for critical issues, 30 days for moderate issues
- **Release Schedule**: Security patches are released as soon as possible after validation

### What to Expect

**If the vulnerability is accepted:**

- We will acknowledge the issue and provide a timeline for resolution
- We will work on a fix and coordinate disclosure with you
- Credit will be given to the reporter (unless anonymity is requested)
- A security advisory will be published after the fix is released

**If the vulnerability is declined:**

- We will provide a clear explanation of why the issue doesn't qualify as a security vulnerability
- We may suggest alternative approaches or clarifications
- You are welcome to discuss the decision or provide additional information

## Security Best Practices

When using Fortify Schema in production:

1. **Keep Updated**: Always use the latest stable version
2. **Validate Depth**: Configure appropriate depth limits for nested objects
3. **Monitor Performance**: Watch for unusual validation patterns that might indicate attacks
4. **Sanitize Inputs**: Use Fortify Schema as part of a comprehensive input validation strategy
5. **Error Handling**: Implement proper error handling to prevent information leakage

## Responsible Disclosure

We follow responsible disclosure practices:

- Security vulnerabilities are not publicly disclosed until fixes are available
- We coordinate with security researchers to ensure proper timeline and communication
- We maintain transparency about security issues through our security advisories
- We provide migration guides when security fixes require breaking changes

## Contact Information

For security-related questions or concerns:

- **Security Team**: `support@nehonix.com`
- **General Issues**: [GitHub Issues](https://github.com/Nehonix-Team/fortify-schema/issues)
- **Community Discussion**: [GitHub Discussions](https://github.com/Nehonix-Team/fortify-schema/discussions)

---

**Last Updated**: July 2025  
**Policy Version**: 1.0
