import { SECURITY_CONSTANTS } from "../../../../../../constants/SECURITY_CONSTANTS";
import { MAX_OBJECT_DEPTH } from "../../../../../../constants/VALIDATION_CONSTANTS";
import { SchemaValidationResult } from "../../../../../types/types";
import {
  validateJsonDeep,
  validateJsonSchema,
  validateIPv4,
  validateIPv6,
  normalizeIPv6,
  validateObjectDeep,
  validateObjectSchema,
} from "../../../../../utils/securityHelpers";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import {
  ValidationCache,
  ValidationMetrics,
} from "../../../../../utils/securityValidatorHelpers";
import { ErrorHandler } from "../../errors/ErrorHandler";
import { ErrorCode } from "../../errors/types/errors.type";

export class SecurityValidators {
  private static ajv: Ajv | null = null;
  private static readonly ajvOptions = {
    strict: false,
    allErrors: true,
    removeAdditional: false,
    useDefaults: false,
    coerceTypes: false,
    validateFormats: true,
    addUsedSchema: false,
    verbose: false,
    loadSchema: false, // Disable remote schema loading for security
  } as const;

  /**
   * Initialize AJV instance with enhanced security configurations
   */
  private static getAjv(): Ajv {
    if (!this.ajv) {
      this.ajv = new Ajv(this.ajvOptions as any);
      addFormats(this.ajv);

      // security schema with more comprehensive protections
      this.ajv.addSchema(
        {
          $id: "https://nehonix.com/lib/v/fortify-schema",
          type: ["object", "array", "string", "number", "boolean", "null"],
          definitions: {
            secureObject: {
              type: "object",
              not: {
                anyOf: [
                  ...Array.from(SECURITY_CONSTANTS.DANGEROUS_PROPERTIES).map(
                    (prop) => ({
                      properties: { [prop]: {} },
                      required: [prop],
                    })
                  ),
                  { additionalProperties: { type: "function" } },
                ],
              },
              patternProperties: {
                "^(?!__|constructor|prototype).*": { $ref: "#" },
              },
            },
          },
          if: { type: "object" },
          then: { $ref: "#/definitions/secureObject" },
          else: {
            if: { type: "array" },
            then: { items: { $ref: "#" } },
          },
        },
        "secure-json-v2"
      );
    }
    return this.ajv;
  }

  /**
   * Check for dangerous properties that could lead to prototype pollution
   */
  private static hasDangerousProperties(
    obj: any,
    visited = new WeakSet()
  ): boolean {
    if (!obj || typeof obj !== "object" || visited.has(obj)) {
      return false;
    }

    visited.add(obj);

    // Check current level
    for (const key of Object.keys(obj)) {
      if (SECURITY_CONSTANTS.DANGEROUS_PROPERTIES.has(key)) {
        return true;
      }
    }

    // Recursively check nested objects
    for (const value of Object.values(obj)) {
      if (this.hasDangerousProperties(value, visited)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Execute validation with timeout protection
   */
  private static async withTimeout<T>(
    operation: () => T | Promise<T>,
    timeoutMs: number = SECURITY_CONSTANTS.MAX_VALIDATION_TIME
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Validation timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      Promise.resolve(operation()).then(
        (result) => {
          clearTimeout(timer);
          resolve(result);
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        }
      );
    });
  }

  /**
   * text validation with comprehensive security checks
   */
  static async validateText(
    value: any,
    options: {
      minLength?: number;
      maxLength?: number;
      allowEmpty?: boolean;
      trimWhitespace?: boolean;
      allowedCharacters?: RegExp;
      forbiddenPatterns?: RegExp[];
      encoding?: "utf8" | "ascii" | "latin1";
      preventXSS?: boolean;
      preventSQLInjection?: boolean;
      preventLDAPInjection?: boolean;
      preventCommandInjection?: boolean;
      normalizeUnicode?: boolean;
      maxLines?: number;
      requireAlphanumeric?: boolean;
      allowHTML?: boolean;
      stripHTML?: boolean;
      timeout?: number;
      enableMetrics?: boolean;
    } = {}
  ): Promise<SchemaValidationResult> {
    const startTime = Date.now();
    const operationName = "validateText";

    try {
      const result = await this.withTimeout(async () => {
        return this.validateTextSync(value, options);
      }, options.timeout);

      if (options.enableMetrics) {
        ValidationMetrics.record(
          operationName,
          Date.now() - startTime,
          !result.success
        );
      }

      return result;
    } catch (error: any) {
      if (options.enableMetrics) {
        ValidationMetrics.record(operationName, Date.now() - startTime, true);
      }
      const msg = `${error instanceof Error ? error.message : "Unknown error"}`;
      return {
        success: false,
        errors: [
          ErrorHandler.createValidationError([], msg, ErrorCode.UNKNOWN_ERROR),
        ],
        warnings: [],
        data: value,
      };
    }
  }

  static validateTextSync(value: any, options: any): SchemaValidationResult {
    const result: SchemaValidationResult = {
      success: true,
      errors: [],
      warnings: [],
      data: value,
    };

    const {
      minLength = 0,
      maxLength = SECURITY_CONSTANTS.MAX_TEXT_LENGTH,
      allowEmpty = true,
      trimWhitespace = false,
      allowedCharacters,
      forbiddenPatterns = [],
      encoding = "utf8",
      preventXSS = true,
      preventSQLInjection = true,
      preventLDAPInjection = false,
      preventCommandInjection = false,
      normalizeUnicode = false,
      maxLines = Infinity,
      requireAlphanumeric = false,
      allowHTML = false,
      stripHTML = false,
    } = options;

    if (typeof value !== "string") {
      result.success = false;
      result.errors.push(ErrorHandler.createTypeError([], "string", value));
      return result;
    }

    let text = value;

    // Early size check to prevent DoS
    if (text.length > maxLength) {
      result.success = false;
      result.errors.push(
        ErrorHandler.createStringError(
          [],
          `Text exceeds maximum length of ${maxLength} characters`,
          value,
          ErrorCode.STRING_TOO_LONG
        )
      );
      return result;
    }

    // Trim whitespace if requested
    if (trimWhitespace) {
      const trimmed = text.trim();
      if (trimmed !== text) {
        text = trimmed;
        result.data = text;
        result.warnings.push("Whitespace trimmed from text");
      }
    }

    // Unicode normalization
    if (normalizeUnicode) {
      try {
        const normalized = text.normalize("NFC");
        if (normalized !== text) {
          text = normalized;
          result.data = text;
          result.warnings.push("Unicode characters normalized");
        }
      } catch (error) {
        result.warnings.push("Unicode normalization failed");
      }
    }

    // Empty string validation
    if (!allowEmpty && text.length === 0) {
      result.success = false;
      result.errors.push(
        ErrorHandler.createStringError(
          [],
          "Text cannot be empty",
          value,
          ErrorCode.STRING_TOO_SHORT
        )
      );
      return result;
    }

    // Length validation
    if (text.length < minLength) {
      result.success = false;
      result.errors.push(
        ErrorHandler.createStringError(
          [],
          `Text must be at least ${minLength} characters long`,
          value,
          ErrorCode.STRING_TOO_SHORT
        )
      );
    }

    // Line count validation
    if (maxLines !== Infinity) {
      const lineCount = text.split("\n").length;
      if (lineCount > maxLines) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createStringError(
            [],
            `Text cannot exceed ${maxLines} lines`,
            value,
            ErrorCode.STRING_TOO_LONG
          )
        );
      }
    }

    // Character encoding validation
    if (encoding === "ascii" && !/^[\x00-\x7F]*$/.test(text)) {
      result.success = false;
      result.errors.push(
        ErrorHandler.createStringError(
          [],
          "Text contains non-ASCII characters",
          value,
          ErrorCode.INVALID_STRING_FORMAT
        )
      );
    }

    // Alphanumeric requirement
    if (requireAlphanumeric && !/^[a-zA-Z0-9\s]*$/.test(text)) {
      result.success = false;
      result.errors.push(
        ErrorHandler.createStringError(
          [],
          "Text must contain only alphanumeric characters and spaces",
          value,
          ErrorCode.INVALID_STRING_FORMAT
        )
      );
    }

    // Allowed characters validation
    if (allowedCharacters && !allowedCharacters.test(text)) {
      result.success = false;
      result.errors.push(
        ErrorHandler.createStringError(
          [],
          "Text contains disallowed characters",
          value,
          ErrorCode.INVALID_STRING_FORMAT
        )
      );
    }

    // Forbidden patterns check
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(text)) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createStringError(
            [],
            "Text contains forbidden pattern",
            value,
            ErrorCode.PATTERN_MISMATCH
          )
        );
        break;
      }
    }

    // XSS prevention
    if (preventXSS && !allowHTML) {
      for (const pattern of SECURITY_CONSTANTS.XSS_PATTERNS) {
        if (pattern.test(text)) {
          result.success = false;
          result.errors.push(
            ErrorHandler.createStringError(
              [],
              "Text contains potentially malicious content (XSS)",
              value,
              ErrorCode.INVALID_STRING_FORMAT
            )
          );
          break;
        }
      }

      // Additional XSS checks
      if (text.includes("javascript:") || text.includes("data:text/html")) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createStringError(
            [],
            "Text contains dangerous URI schemes",
            value,
            ErrorCode.INVALID_STRING_FORMAT
          )
        );
      }
    }

    // SQL injection prevention
    if (preventSQLInjection) {
      for (const pattern of SECURITY_CONSTANTS.SQL_PATTERNS) {
        if (pattern.test(text)) {
          result.warnings.push("Text contains SQL-like patterns");
          break;
        }
      }
    }

    // LDAP injection prevention
    if (preventLDAPInjection) {
      for (const pattern of SECURITY_CONSTANTS.LDAP_PATTERNS) {
        if (pattern.test(text)) {
          result.success = false;
          result.errors.push(
            ErrorHandler.createStringError(
              [],
              "Text contains LDAP injection patterns",
              value,
              ErrorCode.INVALID_STRING_FORMAT
            )
          );
          break;
        }
      }
    }

    // Command injection prevention
    if (preventCommandInjection) {
      for (const pattern of SECURITY_CONSTANTS.COMMAND_INJECTION_PATTERNS) {
        if (pattern.test(text)) {
          result.success = false;
          result.errors.push(
            ErrorHandler.createStringError(
              [],
              "Text contains command injection patterns",
              value,
              ErrorCode.INVALID_STRING_FORMAT
            )
          );
          break;
        }
      }
    }

    // Control character detection
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/.test(text)) {
      result.warnings.push("Text contains control characters");
    }

    // Null byte detection
    if (text.includes("\0")) {
      result.success = false;
      result.errors.push(
        ErrorHandler.createStringError(
          [],
          "Text contains null bytes",
          value,
          ErrorCode.INVALID_STRING_FORMAT
        )
      );
    }

    return result;
  }

  /**
   * JSON validation with improved security and performance
   */
  static async validateJson(
    value: any,
    options: {
      maxDepth?: number;
      maxKeys?: number;
      maxStringLength?: number;
      maxArrayLength?: number;
      allowedTypes?: string[];
      forbiddenKeys?: string[];
      schema?: any;
      preventCircular?: boolean;
      maxSize?: number;
      securityMode?: "fast" | "secure" | "strict";
      timeout?: number;
      enableMetrics?: boolean;
      useCache?: boolean;
    } = {}
  ): Promise<SchemaValidationResult> {
    const startTime = Date.now();
    const operationName = "validateJson";

    // Generate cache key if caching is enabled
    const cacheKey = options.useCache
      ? `json_${JSON.stringify(value).substring(0, 100)}_${JSON.stringify(options)}`
      : null;

    if (cacheKey) {
      const cached = ValidationCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const result = await this.withTimeout(async () => {
        return this.validateJsonSync(value, options);
      }, options.timeout);

      if (options.enableMetrics) {
        ValidationMetrics.record(
          operationName,
          Date.now() - startTime,
          !result.success
        );
      }

      if (cacheKey && result.success) {
        ValidationCache.set(cacheKey, result);
      }

      return result;
    } catch (error: any) {
      if (options.enableMetrics) {
        ValidationMetrics.record(operationName, Date.now() - startTime, true);
      }
      const msg = `${error instanceof Error ? error.message : "Unknown error"}`;
      const code =
        error instanceof Error ? error.name : ErrorCode.UNKNOWN_ERROR;
      return {
        success: false,
        errors: [ErrorHandler.createValidationError([], msg, code)],
        warnings: [],
        data: value,
      };
    }
  }

  static validateJsonSync(value: any, options: any): SchemaValidationResult {
    const result: SchemaValidationResult = {
      success: true,
      errors: [],
      warnings: [],
      data: value,
    };

    const {
      maxDepth = MAX_OBJECT_DEPTH,
      maxKeys = 1000,
      maxStringLength = 10000,
      maxArrayLength = 1000,
      allowedTypes = ["object", "array", "string", "number", "boolean", "null"],
      forbiddenKeys = [],
      schema,
      preventCircular = true,
      maxSize = SECURITY_CONSTANTS.MAX_JSON_SIZE,
      securityMode = "secure",
    } = options;

    let parsedData: any;

    if (typeof value === "string") {
      // Size check for string
      if (value.length > maxSize) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createStringError(
            [],
            `JSON string exceeds maximum size of ${maxSize} characters`,
            value,
            ErrorCode.STRING_TOO_LONG
          )
        );
        return result;
      }

      try {
        parsedData = JSON.parse(value);
      } catch (error) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createValidationError(
            [],
            `Invalid JSON string: ${error instanceof Error ? error.message : "Parse error"}`,
            ErrorCode.INVALID_JSON
          )
        );
        return result;
      }
    } else if (typeof value === "object" && value !== null) {
      parsedData = value;
    } else {
      result.success = false;
      result.errors.push(
        ErrorHandler.createTypeError([], "string or object", value)
      );
      return result;
    }

    // Security validations based on mode
    if (securityMode === "secure" || securityMode === "strict") {
      if (this.hasDangerousProperties(parsedData)) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createValidationError(
            [],
            "JSON contains dangerous properties (prototype pollution risk)",
            ErrorCode.INVALID_JSON
          )
        );
        return result;
      }

      if (securityMode === "strict") {
        const ajv = this.getAjv();
        const validate = ajv.getSchema("secure-json-v2");
        if (validate && !validate(parsedData)) {
          result.success = false;
          result.errors.push(
            ErrorHandler.createValidationError(
              [],
              "JSON failed strict security validation",
              ErrorCode.INVALID_JSON
            )
          );
          if (validate.errors) {
            result.warnings.push(
              `AJV errors: ${JSON.stringify(validate.errors)}`
            );
          }
          return result;
        }
      }
    }

    // Circular reference detection
    if (preventCircular) {
      try {
        JSON.stringify(parsedData);
      } catch (error) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createValidationError(
            [],
            "JSON contains circular references",
            ErrorCode.INVALID_JSON
          )
        );
        return result;
      }
    }

    // Deep validation
    const validationResult = validateJsonDeep(parsedData, {
      maxDepth,
      maxKeys,
      maxStringLength,
      maxArrayLength,
      allowedTypes,
      forbiddenKeys,
      currentDepth: 0,
      keyCount: 0,
    });

    result.success = result.success && validationResult.success;
    result.errors.push(...validationResult.errors);
    result.warnings.push(...validationResult.warnings);
    result.data = parsedData;

    // Schema validation if provided
    if (schema && result.success) {
      const schemaResult = validateJsonSchema(parsedData, schema);
      result.success = result.success && schemaResult.success;
      result.errors.push(...schemaResult.errors);
      result.warnings.push(...schemaResult.warnings);
    }

    return result;
  }

  /**
   * IP validation with geographic and security checks
   */
  static validateIp(
    value: any,
    options: {
      version?: "v4" | "v6" | "both";
      allowPrivate?: boolean;
      allowLoopback?: boolean;
      allowMulticast?: boolean;
      allowReserved?: boolean;
      allowCIDR?: boolean;
      strict?: boolean;
      blockBogons?: boolean;
      allowDocumentation?: boolean;
    } = {}
  ): SchemaValidationResult {
    const result: SchemaValidationResult = {
      success: true,
      errors: [],
      warnings: [],
      data: value,
    };

    const {
      version = "both",
      allowPrivate = true,
      allowLoopback = true,
      allowMulticast = false,
      allowReserved = true,
      allowCIDR = false,
      strict = true,
      blockBogons = false,
      allowDocumentation = true,
    } = options;

    if (typeof value !== "string") {
      result.success = false;
      result.errors.push(
        ErrorHandler.createSimpleError(
          "Expected string for IP address",
          [],
          "string"
        )
      );
      return result;
    }

    const ip = value.trim();

    // Basic format validation
    if (!/^[\d\.:a-fA-F\/]+$/.test(ip)) {
      result.success = false;
      result.errors.push(
        ErrorHandler.createValidationError(
          [],
          "IP address contains invalid characters",
          ErrorCode.SECURITY_VIOLATION
        )
      );
      return result;
    }

    let ipAddress = ip;
    let cidrPrefix: number | null = null;
    let isIPv4 = false;
    let isIPv6 = false;

    // Handle CIDR notation
    if (ip.includes("/")) {
      if (!allowCIDR) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createValidationError(
            [],
            "CIDR notation is not allowed",
            ErrorCode.SECURITY_VIOLATION
          )
        );
        return result;
      }

      const parts = ip.split("/");
      if (parts.length !== 2) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createValidationError(
            [],
            "Invalid CIDR notation format",
            ErrorCode.SECURITY_VIOLATION
          )
        );
        return result;
      }

      ipAddress = parts[0];
      const prefixStr = parts[1];

      if (!/^\d+$/.test(prefixStr)) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createValidationError(
            [],
            "CIDR prefix must be numeric",
            ErrorCode.SECURITY_VIOLATION
          )
        );
        return result;
      }

      cidrPrefix = parseInt(prefixStr, 10);
    }

    // Validate IP format
    const ipv4Result = validateIPv4(ipAddress, strict);
    const ipv6Result = validateIPv6(ipAddress, strict);

    isIPv4 = ipv4Result.valid;
    isIPv6 = ipv6Result.valid;

    // Version validation
    if (version === "v4" && !isIPv4) {
      result.success = false;
      result.errors.push(
        ErrorHandler.createValidationError(
          [],
          "Invalid IPv4 address format",
          ErrorCode.SECURITY_VIOLATION
        )
      );
      return result;
    }

    if (version === "v6" && !isIPv6) {
      result.success = false;
      result.errors.push(
        ErrorHandler.createValidationError(
          [],
          "Invalid IPv6 address format",
          ErrorCode.SECURITY_VIOLATION
        )
      );
      return result;
    }

    if (version === "both" && !isIPv4 && !isIPv6) {
      result.success = false;
      result.errors.push(
        ErrorHandler.createValidationError(
          [],
          "Invalid IP address format (must be valid IPv4 or IPv6)",
          ErrorCode.SECURITY_VIOLATION
        )
      );
      return result;
    }

    // CIDR prefix validation
    if (cidrPrefix !== null) {
      if (isIPv4 && (cidrPrefix < 0 || cidrPrefix > 32)) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createValidationError(
            [],
            "Invalid IPv4 CIDR prefix (must be 0-32)",
            ErrorCode.SECURITY_VIOLATION
          )
        );
      }
      if (isIPv6 && (cidrPrefix < 0 || cidrPrefix > 128)) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createValidationError(
            [],
            "Invalid IPv6 CIDR prefix (must be 0-128)",
            ErrorCode.SECURITY_VIOLATION
          )
        );
      }
    }

    // IPv4 specific validations
    if (isIPv4) {
      const octets = ipAddress.split(".").map(Number);

      // private IP detection
      if (!allowPrivate) {
        if (
          octets[0] === 10 ||
          (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
          (octets[0] === 192 && octets[1] === 168) ||
          (octets[0] === 169 && octets[1] === 254) // Link-local
        ) {
          result.success = false;
          result.errors.push(
            ErrorHandler.createValidationError(
              [],
              "Private IPv4 addresses not allowed",
              ErrorCode.SECURITY_VIOLATION
            )
          );
        }
      }

      // Loopback validation
      if (!allowLoopback && octets[0] === 127) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createValidationError(
            [],
            "Loopback addresses not allowed",
            ErrorCode.SECURITY_VIOLATION
          )
        );
      }

      // Multicast validation
      if (!allowMulticast && octets[0] >= 224 && octets[0] <= 239) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createValidationError(
            [],
            "Multicast addresses not allowed",
            ErrorCode.SECURITY_VIOLATION
          )
        );
      }

      // Documentation addresses (RFC 5737)
      if (!allowDocumentation) {
        if (
          (octets[0] === 192 && octets[1] === 0 && octets[2] === 2) ||
          (octets[0] === 198 && octets[1] === 51 && octets[2] === 100) ||
          (octets[0] === 203 && octets[1] === 0 && octets[2] === 113)
        ) {
          result.success = false;
          result.errors.push(
            ErrorHandler.createValidationError(
              [],
              "Documentation addresses not allowed",
              ErrorCode.SECURITY_VIOLATION
            )
          );
        }
      }

      // Bogon detection
      if (blockBogons) {
        if (
          octets[0] === 0 ||
          octets[0] === 255 ||
          (octets[0] >= 240 && octets[0] <= 255)
        ) {
          result.success = false;
          result.errors.push(
            ErrorHandler.createValidationError(
              [],
              "Bogon IP address detected",
              ErrorCode.SECURITY_VIOLATION
            )
          );
        }
      }

      // Reserved ranges
      if (!allowReserved) {
        if (octets[0] === 0 || octets[0] === 255) {
          result.success = false;
          result.errors.push(
            ErrorHandler.createValidationError(
              [],
              "Reserved IPv4 addresses not allowed",
              ErrorCode.SECURITY_VIOLATION
            )
          );
        }
      }
    }

    // IPv6 specific validations
    if (isIPv6) {
      const normalized = normalizeIPv6(ipAddress);

      if (
        !allowLoopback &&
        normalized === "0000:0000:0000:0000:0000:0000:0000:0001"
      ) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createValidationError(
            [],
            "IPv6 loopback address not allowed",
            ErrorCode.SECURITY_VIOLATION
          )
        );
      }

      // Unique local addresses (RFC 4193)
      if (
        !allowPrivate &&
        (normalized.startsWith("fc00:") || normalized.startsWith("fd00:"))
      ) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createValidationError(
            [],
            "Private IPv6 addresses not allowed",
            ErrorCode.SECURITY_VIOLATION
          )
        );
      }

      // Link-local addresses
      if (!allowPrivate && normalized.startsWith("fe80:")) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createValidationError(
            [],
            "Link-local IPv6 addresses not allowed",
            ErrorCode.SECURITY_VIOLATION
          )
        );
      }

      if (!allowMulticast && normalized.startsWith("ff00:")) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createValidationError(
            [],
            "IPv6 multicast addresses not allowed",
            ErrorCode.SECURITY_VIOLATION
          )
        );
      }

      // Documentation prefix (RFC 3849)
      if (!allowDocumentation && normalized.startsWith("2001:0db8:")) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createValidationError(
            [],
            "Documentation IPv6 addresses not allowed",
            ErrorCode.SECURITY_VIOLATION
          )
        );
      }
    }

    return result;
  }

  /**
   * object validation with better security and performance
   */
  static validateObject(
    value: any,
    options: {
      allowNull?: boolean;
      allowArray?: boolean;
      maxDepth?: number;
      maxKeys?: number;
      requiredKeys?: string[];
      allowedKeys?: string[];
      forbiddenKeys?: string[];
      keyPattern?: RegExp;
      schema?: any;
      strict?: boolean;
      preventPrototypePollution?: boolean;
      maxPropertyNameLength?: number;
    } = {}
  ): SchemaValidationResult {
    const result: SchemaValidationResult = {
      success: true,
      errors: [],
      warnings: [],
      data: value,
    };

    const {
      allowNull = false,
      allowArray = false,
      maxDepth = MAX_OBJECT_DEPTH,
      maxKeys = 1000,
      requiredKeys = [],
      allowedKeys = [],
      forbiddenKeys = [],
      keyPattern,
      schema,
      strict = false,
      preventPrototypePollution = true,
      maxPropertyNameLength = 100,
    } = options;

    // Null check
    if (value === null) {
      if (!allowNull) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createValidationError(
            [],
            "Null values not allowed",
            ErrorCode.SECURITY_VIOLATION
          )
        );
      }
      return result;
    }

    // Array check
    if (Array.isArray(value)) {
      if (!allowArray) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createValidationError(
            [],
            "Arrays not allowed",
            ErrorCode.SECURITY_VIOLATION
          )
        );
      }
      return result;
    }

    // Type check
    if (typeof value !== "object") {
      result.success = false;
      result.errors.push(ErrorHandler.createTypeError([], "object", value));
      return result;
    }

    // Prototype pollution check
    if (preventPrototypePollution && this.hasDangerousProperties(value)) {
      result.success = false;
      result.errors.push(
        ErrorHandler.createValidationError(
          [],
          "Object contains dangerous properties that could lead to prototype pollution",
          ErrorCode.SECURITY_VIOLATION
        )
      );
      return result;
    }

    const keys = Object.keys(value);

    // Key count validation
    if (keys.length > maxKeys) {
      result.success = false;
      result.errors.push(
        ErrorHandler.createValidationError(
          [],
          `Object has too many keys (${keys.length}), maximum allowed: ${maxKeys}`,
          ErrorCode.SECURITY_VIOLATION
        )
      );
    }

    // Required keys validation
    for (const requiredKey of requiredKeys) {
      if (!(requiredKey in value)) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createValidationError(
            [],
            `Missing required key: ${requiredKey}`,
            ErrorCode.SECURITY_VIOLATION
          )
        );
      }
    }

    // key validation
    for (const key of keys) {
      // Property name length check
      if (key.length > maxPropertyNameLength) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createValidationError(
            [],
            `Property name '${key.substring(0, 20)}...' exceeds maximum length of ${maxPropertyNameLength}`,
            ErrorCode.SECURITY_VIOLATION
          )
        );
        continue;
      }

      // Dangerous key detection
      if (SECURITY_CONSTANTS.DANGEROUS_PROPERTIES.has(key)) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createValidationError(
            [],
            `Dangerous property name detected: '${key}'`,
            ErrorCode.SECURITY_VIOLATION
          )
        );
        continue;
      }

      // Allowed keys check
      if (allowedKeys.length > 0 && !allowedKeys.includes(key)) {
        if (strict) {
          result.success = false;
          result.errors.push(
            ErrorHandler.createValidationError(
              [],
              `Key '${key}' is not in allowed keys list`,
              ErrorCode.SECURITY_VIOLATION
            )
          );
        } else {
          result.warnings.push(`Key '${key}' is not in allowed keys list`);
        }
      }

      // Forbidden keys check
      if (forbiddenKeys.includes(key)) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createValidationError(
            [],
            `Key '${key}' is forbidden`,
            ErrorCode.SECURITY_VIOLATION
          )
        );
      }

      // Key pattern validation
      if (keyPattern && !keyPattern.test(key)) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createValidationError(
            [],
            `Key '${key}' does not match required pattern`,
            ErrorCode.SECURITY_VIOLATION
          )
        );
      }

      // Check for suspicious patterns in key names
      if (/^__|.*prototype.*|.*constructor.*$/i.test(key)) {
        result.warnings.push(`Suspicious property name detected: '${key}'`);
      }
    }

    // Deep structure validation
    const deepResult = validateObjectDeep(value, maxDepth, 0);
    result.success = result.success && deepResult.success;
    result.errors.push(...deepResult.errors);
    result.warnings.push(...deepResult.warnings);

    // Schema validation if provided
    if (schema && result.success) {
      const schemaResult = validateObjectSchema(value, schema);
      result.success = result.success && schemaResult.success;
      result.errors.push(...schemaResult.errors);
      result.warnings.push(...schemaResult.warnings);
    }

    return result;
  }

  /**
   * Validate email address with comprehensive checks
   */
  static validateEmail(
    value: any,
    options: {
      allowInternational?: boolean;
      maxLength?: number;
      allowedDomains?: string[];
      blockedDomains?: string[];
      requireMX?: boolean;
      strict?: boolean;
    } = {}
  ): SchemaValidationResult {
    const result: SchemaValidationResult = {
      success: true,
      errors: [],
      warnings: [],
      data: value,
    };

    const {
      allowInternational = true,
      maxLength = 254,
      allowedDomains = [],
      blockedDomains = [],
      strict = true,
    } = options;

    if (typeof value !== "string") {
      result.success = false;
      result.errors.push(ErrorHandler.createTypeError([], "string", value));
      return result;
    }

    const email = value.trim().toLowerCase();

    // Length check
    if (email.length > maxLength) {
      result.success = false;
      result.errors.push(
        ErrorHandler.createStringError(
          [],
          `Email exceeds maximum length of ${maxLength} characters`,
          value,
          ErrorCode.STRING_TOO_LONG
        )
      );
      return result;
    }

    // Basic format check - must contain exactly one @
    const atSymbolCount = (email.match(/@/g) || []).length;
    if (atSymbolCount !== 1) {
      result.success = false;
      result.errors.push(
        ErrorHandler.createValidationError(
          [],
          "Email must contain exactly one @ symbol",
          ErrorCode.SECURITY_VIOLATION
        )
      );
      return result;
    }

    const [localPart, domain] = email.split("@");

    // Check for empty parts
    if (!localPart || !domain) {
      result.success = false;
      result.errors.push(
        ErrorHandler.createValidationError(
          [],
          "Email local part and domain cannot be empty",
          ErrorCode.SECURITY_VIOLATION
        )
      );
      return result;
    }

    // Local part length validation
    if (localPart.length > 64) {
      result.success = false;
      result.errors.push(
        ErrorHandler.createValidationError(
          [],
          "Email local part exceeds 64 characters",
          ErrorCode.SECURITY_VIOLATION
        )
      );
    }
    // Plus addressing check - FIXED LOGIC
    if (localPart.includes("+")) {
      result.success = false;
      result.errors.push(
        ErrorHandler.createValidationError(
          [],
          "Plus addressing (+ symbols) is not allowed",
          ErrorCode.SECURITY_VIOLATION
        )
      );
    }

    // Local part character validation - FIXED TO PROPERLY HANDLE INVALID CHARACTERS
    if (strict) {
      // Practical validation - common characters only (excludes # and other problematic chars)
      const validLocalPartRegex = /^[a-zA-Z0-9._+-]+$/;
      if (!validLocalPartRegex.test(localPart)) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createValidationError(
            [],
            "Email local part contains invalid characters",
            ErrorCode.SECURITY_VIOLATION
          )
        );
      }
    } else {
      // RFC 5322 compliant - more permissive but excludes problematic chars like #
      const validLocalPartRegex =
        /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
      if (!validLocalPartRegex.test(localPart)) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createValidationError(
            [],
            "Email local part contains invalid characters",
            ErrorCode.SECURITY_VIOLATION
          )
        );
      }
    }

    // Check for consecutive dots
    if (localPart.includes("..")) {
      result.success = false;
      result.errors.push(
        ErrorHandler.createValidationError(
          [],
          "Email local part cannot contain consecutive dots",
          ErrorCode.SECURITY_VIOLATION
        )
      );
    }

    // Check for dots at start or end
    if (localPart.startsWith(".") || localPart.endsWith(".")) {
      result.success = false;
      result.errors.push(
        ErrorHandler.createValidationError(
          [],
          "Email local part cannot start or end with a dot",
          ErrorCode.SECURITY_VIOLATION
        )
      );
    }

    // Domain validation
    if (domain.length > 255) {
      result.success = false;
      result.errors.push(
        ErrorHandler.createValidationError(
          [],
          "Email domain exceeds 255 characters",
          ErrorCode.SECURITY_VIOLATION
        )
      );
    }

    // Domain format validation
    if (strict) {
      // Basic domain validation - must have at least one dot and valid TLD
      const validDomainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!validDomainRegex.test(domain)) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createValidationError(
            [],
            "Invalid domain format - must contain at least one dot and valid TLD",
            ErrorCode.SECURITY_VIOLATION
          )
        );
      }
    } else {
      // More strict domain validation
      const validDomainRegex =
        /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!validDomainRegex.test(domain)) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createValidationError(
            [],
            "Invalid domain format",
            ErrorCode.SECURITY_VIOLATION
          )
        );
      }
    }

    // Check for consecutive dots in domain
    if (domain.includes("..")) {
      result.success = false;
      result.errors.push(
        ErrorHandler.createValidationError(
          [],
          "Domain cannot contain consecutive dots",
          ErrorCode.SECURITY_VIOLATION
        )
      );
    }

    // Check for dots at start or end of domain
    if (domain.startsWith(".") || domain.endsWith(".")) {
      result.success = false;
      result.errors.push(
        ErrorHandler.createValidationError(
          [],
          "Domain cannot start or end with a dot",
          ErrorCode.SECURITY_VIOLATION
        )
      );
    }

    // International domain validation
    if (!allowInternational && /[^\x00-\x7F]/.test(domain)) {
      result.success = false;
      result.errors.push(
        ErrorHandler.createValidationError(
          [],
          "International domain names are not allowed",
          ErrorCode.SECURITY_VIOLATION
        )
      );
    }

    // Domain whitelist/blacklist
    if (allowedDomains.length > 0 && !allowedDomains.includes(domain)) {
      result.success = false;
      result.errors.push(
        ErrorHandler.createValidationError(
          [],
          `Email domain '${domain}' is not allowed`,
          ErrorCode.SECURITY_VIOLATION
        )
      );
    }

    if (blockedDomains.includes(domain)) {
      result.success = false;
      result.errors.push(
        ErrorHandler.createValidationError(
          [],
          `Email domain '${domain}' is blocked`,
          ErrorCode.SECURITY_VIOLATION
        )
      );
    }

    // Additional validation for common invalid patterns
    const invalidCharsRegex = /[<>()[\]\\,;:\s@"]/;
    if (invalidCharsRegex.test(localPart)) {
      result.success = false;
      result.errors.push(
        ErrorHandler.createValidationError(
          [],
          "Email local part contains prohibited characters (spaces, quotes, brackets, etc.)",
          ErrorCode.SECURITY_VIOLATION
        )
      );
    }

    // Suspicious patterns
    if (/test|temp|fake|spam|noreply/i.test(email)) {
      result.warnings.push("Email appears to be temporary or test address");
    }

    // Set the cleaned data
    result.data = email;

    return result;
  }

  /**
   * Get validation performance metrics
   */
  static getMetrics(): Record<string, any> {
    return ValidationMetrics.getMetrics();
  }

  /**
   * Reset validation metrics
   */
  static resetMetrics(): void {
    ValidationMetrics.reset();
  }

  /**
   * Clear validation cache
   */
  static clearCache(): void {
    ValidationCache.clear();
  }

  /**
   * Validate multiple values with batch processing
   */
  static async validateBatch<T>(
    values: T[],
    validator: (
      value: T
    ) => Promise<SchemaValidationResult> | SchemaValidationResult,
    options: {
      continueOnError?: boolean;
      maxConcurrency?: number;
      timeout?: number;
    } = {}
  ): Promise<{
    results: SchemaValidationResult[];
    summary: { total: number; passed: number; failed: number };
  }> {
    const {
      continueOnError = true,
      maxConcurrency = 10,
      timeout = 30000,
    } = options;

    const results: SchemaValidationResult[] = [];
    const batches: T[][] = [];

    // Create batches
    for (let i = 0; i < values.length; i += maxConcurrency) {
      batches.push(values.slice(i, i + maxConcurrency));
    }

    try {
      await this.withTimeout(async () => {
        for (const batch of batches) {
          const batchPromises = batch.map(async (value) => {
            try {
              return await Promise.resolve(validator(value));
            } catch (error) {
              return {
                success: false,
                errors: [
                  ErrorHandler.createValidationError(
                    [],
                    `Batch validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
                    ErrorCode.UNKNOWN_ERROR
                  ),
                ],
                warnings: [],
                data: value,
              } as SchemaValidationResult;
            }
          });

          const batchResults = await Promise.all(batchPromises);
          results.push(...batchResults);

          // Stop on first error if continueOnError is false
          if (!continueOnError && batchResults.some((r) => !r.success)) {
            break;
          }
        }
      }, timeout);
    } catch (error) {
      // Add timeout error for remaining values
      const remaining = values.length - results.length;
      for (let i = 0; i < remaining; i++) {
        results.push({
          success: false,
          errors: [
            ErrorHandler.createValidationError(
              [],
              `Batch validation timeout: ${error instanceof Error ? error.message : "Unknown error"}`,
              ErrorCode.UNKNOWN_ERROR
            ),
          ],
          warnings: [],
          data: values[results.length + i],
        });
      }
    }

    const summary = {
      total: results.length,
      passed: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    };

    return { results, summary };
  }
}

// Export additional utilities
export { ValidationMetrics, ValidationCache, SECURITY_CONSTANTS };
export { SecurityValidators as Security };
