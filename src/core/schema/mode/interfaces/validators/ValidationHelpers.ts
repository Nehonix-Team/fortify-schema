/**
 * Validation Helpers Module
 *
 * Contains optimized helper functions for validation operations
 * extracted from InterfaceSchema to improve maintainability.
 */

import {
  SchemaValidationResult,
  ValidationError,
} from "../../../../types/types";
import { VALIDATOR_TYPES } from "../../../../types/ValidatorTypes";
import {
  UrlArgArray,
  UrlArgsEnum,
  UrlArgType,
} from "../../../../utils/UrlArgs";
import { SchemaOptions } from "../Interface";
import { TypeValidators } from "./TypeValidators";
import { OptimizedUnionValidator as OUV } from "./UnionCache";
import { ErrorHandler } from "../errors/ErrorHandler";
import { ErrorCode } from "../errors/types/errors.type";

// Cache for parsed constant values with LRU eviction
const MAX_CACHE_SIZE = 1000;
const constantCache = new Map<string, any>();

// Pre-compiled regex patterns for better performance
const NUMERIC_PATTERN = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/;
const BOOLEAN_PATTERN = /^(true|false|TRUE|FALSE|True|False)$/i;
const HEX_COLOR_PATTERN = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
const BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/;
const JWT_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/**
 * Helper functions for validation operations
 */
export class ValidationHelpers {
  /**
   * Validate constant types (e.g., "=admin", "=user")
   * with better caching, type safety, and deep equality checks
   */
  static validateConstantType(
    constantValue: string,
    value: any
  ): SchemaValidationResult {
    // Validate constant types with caching
    // Implement LRU cache behavior
    if (constantCache.size >= MAX_CACHE_SIZE) {
      const firstKey = constantCache.keys().next().value;
      constantCache.delete(firstKey || "");
    }

    let expectedValue = constantCache.get(constantValue);

    if (expectedValue === undefined) {
      try {
        expectedValue = this.parseConstantValue(constantValue);
        constantCache.set(constantValue, expectedValue);
      } catch (error) {
        return this.createErrorResult(
          `Invalid constant value format: ${constantValue}`,
          value
        );
      }
    }

    // equality check including deep object/array comparison
    if (!this.deepEquals(value, expectedValue)) {
      return this.createErrorResult(
        `Expected constant value: ${JSON.stringify(expectedValue)}, got ${JSON.stringify(value)}`,
        value
      );
    }

    return this.createSuccessResult(value);
  }

  /**
   * deep equality check for constants
   */
  static deepEquals(a: any, b: any): boolean {
    if (a === b) return true;

    if (a == null || b == null) return a === b;

    if (typeof a !== typeof b) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, index) => this.deepEquals(val, b[index]));
    }

    if (typeof a === "object" && typeof b === "object") {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every(
        (key) => keysB.includes(key) && this.deepEquals(a[key], b[key])
      );
    }

    return false;
  }

  /**
   * constant value parser with better error handling and type support
   */
  private static parseConstantValue(constantValue: string): any {
    if (!constantValue || typeof constantValue !== "string") {
      throw new Error("Invalid constant value");
    }

    // Handle quoted strings (remove quotes and return as string)
    if (
      (constantValue.startsWith('"') && constantValue.endsWith('"')) ||
      (constantValue.startsWith("'") && constantValue.endsWith("'"))
    ) {
      return constantValue.slice(1, -1);
    }

    // numeric check with scientific notation support
    if (NUMERIC_PATTERN.test(constantValue)) {
      const num = parseFloat(constantValue);
      if (isNaN(num) || !isFinite(num)) {
        throw new Error("Invalid numeric constant");
      }
      return num;
    }

    // boolean check (case insensitive)
    if (BOOLEAN_PATTERN.test(constantValue)) {
      return constantValue.toLowerCase() === "true";
    }

    // Array check with validation
    if (constantValue.startsWith("[") && constantValue.endsWith("]")) {
      try {
        const parsed = JSON.parse(constantValue);
        if (!Array.isArray(parsed)) {
          throw new Error("Invalid array format");
        }
        return parsed;
      } catch (error) {
        throw new Error("Invalid JSON array format");
      }
    }

    // Object check with validation
    if (constantValue.startsWith("{") && constantValue.endsWith("}")) {
      try {
        const parsed = JSON.parse(constantValue);
        if (typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Invalid object format");
        }
        return parsed;
      } catch (error) {
        throw new Error("Invalid JSON object format");
      }
    }

    // special values
    switch (constantValue.toLowerCase()) {
      case "null":
        return null;
      case "undefined":
        return undefined;
      case "nan":
        return NaN;
      case "infinity":
        return Infinity;
      case "-infinity":
        return -Infinity;
      default:
        return constantValue;
    }
  }

  /**
   * union type validation with better error messages and nested union support
   */
  static validateUnionType(
    unionType: string,
    value: any,
    customErrorMessage?: string
  ): SchemaValidationResult {
    if (!unionType || typeof unionType !== "string") {
      return this.createErrorResult(
        customErrorMessage || "Invalid union type definition",
        value
      );
    }

    try {
      // Split union into parts
      const unionParts = unionType.split("|").map((part) => part.trim());

      // Check if this is a type union (contains basic types) or literal union
      const basicTypes = new Set([
        "string",
        "number",
        "boolean",
        "date",
        "any",
        "null",
        "undefined",
      ]);
      const isTypeUnion = unionParts.some((part) => basicTypes.has(part));

      if (isTypeUnion) {
        // Handle type union - validate that value matches one of the types
        for (const type of unionParts) {
          const typeResult = this.validateSingleType(type, value);
          if (typeResult.success) {
            return this.createSuccessResult(value);
          }
        }

        // None of the types matched
        return this.createErrorResult(
          customErrorMessage ||
            `Expected one of types: ${unionParts.join(", ")}, got ${typeof value}`,
          value
        );
      } else {
        // Handle literal union - use the optimized literal validator
        const result = OUV.validateUnion(unionType, value);

        if (!result.isValid) {
          return this.createErrorResult(
            customErrorMessage ||
              result.error ||
              `Expected one of: ${unionParts.join(", ")}, got ${value}`,
            value
          );
        }

        return this.createSuccessResult(value);
      }
    } catch (error) {
      return this.createErrorResult(
        customErrorMessage ||
          `Union type validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
        value
      );
    }
  }

  /**
   * Validate a single type (helper for type unions)
   */
  private static validateSingleType(
    type: string,
    value: any
  ): SchemaValidationResult {
    switch (type) {
      case "string":
        return typeof value === "string"
          ? this.createSuccessResult(value)
          : this.createErrorResult(
              `Expected string, got ${typeof value}`,
              value
            );

      case "number":
        return typeof value === "number" && !isNaN(value)
          ? this.createSuccessResult(value)
          : this.createErrorResult(
              `Expected number, got ${typeof value}`,
              value
            );

      case "boolean":
        return typeof value === "boolean"
          ? this.createSuccessResult(value)
          : this.createErrorResult(
              `Expected boolean, got ${typeof value}`,
              value
            );

      case "date":
        return value instanceof Date
          ? this.createSuccessResult(value)
          : this.createErrorResult(
              `Expected Date object, got ${typeof value}`,
              value
            );

      case "any":
        return this.createSuccessResult(value);

      case "null":
        return value === null
          ? this.createSuccessResult(value)
          : this.createErrorResult(`Expected null, got ${typeof value}`, value);

      case "undefined":
        return value === undefined
          ? this.createSuccessResult(value)
          : this.createErrorResult(
              `Expected undefined, got ${typeof value}`,
              value
            );

      default:
        // For other types, delegate to the type validation system
        return this.routeTypeValidation(type, value, {}, {});
    }
  }

  /**
   * record type validation with better type safety and performance
   */
  static validateRecordType(
    type: string,
    value: any,
    validateFieldType: (fieldType: string, value: any) => SchemaValidationResult
  ): SchemaValidationResult {
    if (!type || typeof type !== "string") {
      return this.createErrorResult("Invalid record type definition", value);
    }

    const recordMatch = type.match(/^record<([^,]+),(.+)>$/);

    if (!recordMatch) {
      return this.createErrorResult(
        `Invalid Record type format: ${type}. Expected format: record<KeyType,ValueType>`,
        value
      );
    }

    if (value === null || value === undefined) {
      return this.createErrorResult(
        "Record cannot be null or undefined",
        value
      );
    }

    if (typeof value !== "object" || Array.isArray(value)) {
      return this.createErrorResult(
        `Expected object for Record type, got ${Array.isArray(value) ? "array" : typeof value}`,
        value
      );
    }

    const [, keyType, valueType] = recordMatch;
    const trimmedKeyType = keyType.trim();
    const trimmedValueType = valueType.trim();
    const errors: ValidationError[] = [];
    const validatedRecord: Record<string, any> = {};

    // validation with proper key type checking
    for (const [key, val] of Object.entries(value)) {
      // Validate key type more comprehensively
      if (!this.validateKeyType(key, trimmedKeyType)) {
        errors.push(
          ErrorHandler.createError(
            [key],
            `Record key "${key}" must be of type ${trimmedKeyType}, got ${typeof key}`,
            ErrorCode.TYPE_ERROR,
            trimmedKeyType,
            key
          )
        );
        continue;
      }

      // Validate value type
      const valueResult = validateFieldType(trimmedValueType, val);
      if (!valueResult.success) {
        // Add path context to nested errors
        const nestedErrors = valueResult.errors.map((error) => ({
          ...error,
          path: [key, ...error.path],
        }));
        errors.push(...nestedErrors);
      } else {
        validatedRecord[key] = valueResult.data;
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
        warnings: [],
        data: value,
      };
    }

    return this.createSuccessResult(validatedRecord);
  }

  /**
   * key type validation for records
   */
  private static validateKeyType(key: string, keyType: string): boolean {
    switch (keyType) {
      case "string":
        return typeof key === "string";
      case "number":
        return !isNaN(Number(key)) && isFinite(Number(key));
      case "int":
      case "integer":
        return Number.isInteger(Number(key));
      default:
        return typeof key === "string"; // Default to string for unknown key types
    }
  }

  /**
   * array validation with better constraint handling and performance
   */
  static validateArrayWithConstraints(
    value: any,
    elementType: string,
    constraints: any,
    validateElementType: (
      elementType: string,
      value: any
    ) => SchemaValidationResult
  ): SchemaValidationResult {
    if (!Array.isArray(value)) {
      return this.createErrorResult(
        `Expected array, got ${value === null ? "null" : typeof value}`,
        value
      );
    }

    // constraint validation
    const constraintErrors = this.validateArrayConstraints(value, constraints);
    if (constraintErrors.length > 0) {
      return {
        success: false,
        errors: constraintErrors,
        warnings: [],
        data: value,
      };
    }

    // Validate elements with better error aggregation
    const validatedArray: any[] = [];
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < value.length; i++) {
      const elementResult = validateElementType(elementType, value[i]);
      if (!elementResult.success) {
        // Add index to error paths
        const indexedErrors = elementResult.errors.map((error) => ({
          ...error,
          path: [i.toString(), ...error.path],
        }));
        errors.push(...indexedErrors);
      } else {
        validatedArray.push(elementResult.data);
        if (elementResult.warnings.length > 0) {
          warnings.push(
            `Element at index ${i}: ${elementResult.warnings.join(", ")}`
          );
        }
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
        warnings,
        data: value,
      };
    }

    // uniqueness check
    if (constraints.unique) {
      const uniqueCheck = this.checkArrayUniqueness(validatedArray);
      if (!uniqueCheck.success) {
        return uniqueCheck;
      }
    }

    return this.createSuccessResult(validatedArray, warnings);
  }

  /**
   * array constraints validation with more constraint types
   */
  private static validateArrayConstraints(
    value: any[],
    constraints: any
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!constraints) return errors;

    if (
      constraints.minItems !== undefined &&
      value.length < constraints.minItems
    ) {
      errors.push(
        ErrorHandler.createArrayError(
          [],
          `must have at least ${constraints.minItems} items, got ${value.length}`,
          value,
          ErrorCode.ARRAY_TOO_SHORT
        )
      );
    }

    if (
      constraints.maxItems !== undefined &&
      value.length > constraints.maxItems
    ) {
      errors.push(
        ErrorHandler.createArrayError(
          [],
          `must have at most ${constraints.maxItems} items, got ${value.length}`,
          value,
          ErrorCode.ARRAY_TOO_LONG
        )
      );
    }

    if (
      constraints.exactItems !== undefined &&
      value.length !== constraints.exactItems
    ) {
      errors.push(
        ErrorHandler.createArrayError(
          [],
          `must have exactly ${constraints.exactItems} items, got ${value.length}`,
          value,
          ErrorCode.ARRAY_TOO_SHORT
        )
      );
    }

    return errors;
  }

  /**
   * array uniqueness check with better performance and type handling
   */
  private static checkArrayUniqueness(array: any[]): SchemaValidationResult {
    const seen = new Set();
    const duplicates: any[] = [];

    for (let i = 0; i < array.length; i++) {
      const item = array[i];
      let key: string;

      try {
        key =
          typeof item === "object" && item !== null
            ? JSON.stringify(item, Object.keys(item).sort()) // Consistent object serialization
            : String(item);
      } catch (error) {
        // Handle circular references or non-serializable objects
        key = `[object-${i}]`;
      }

      if (seen.has(key)) {
        duplicates.push(item);
      } else {
        seen.add(key);
      }
    }

    if (duplicates.length > 0) {
      return this.createErrorResult(
        `Array values must be unique. Duplicate values found: ${duplicates.map((d) => JSON.stringify(d)).join(", ")}`,
        array
      );
    }

    return this.createSuccessResult(array);
  }

  /**
   * optional value handling with better default value support
   */
  static handleOptionalValue(
    value: any,
    isOptional: boolean,
    defaultValue?: any
  ): SchemaValidationResult | null {
    if (value === undefined) {
      if (isOptional) {
        return this.createSuccessResult(
          defaultValue !== undefined ? defaultValue : undefined
        );
      } else {
        return this.createErrorResult("Required field is missing or undefined");
      }
    }

    if (value === null) {
      if (isOptional) {
        return this.createSuccessResult(null);
      } else {
        return this.createErrorResult("Required field cannot be null");
      }
    }

    return null; // Continue with normal validation
  }

  /**
   * Check if type is a conditional expression using secure regex pattern
   */
  private static isConditionalExpression(type: string): boolean {
    // Secure regex pattern to match: when <condition> *? <thenValue> [: <elseValue>]
    const conditionalPattern = /^\s*when\s+.+?\s*\*\?\s*.+/;
    return conditionalPattern.test(type);
  }

  /**
   * type validation routing with new types and better error handling
   */
  static routeTypeValidation(
    type: string,
    value: any,
    options: SchemaOptions,
    constraints: any,
    required: boolean = false,
    customErrorMessage?: string
  ): SchemaValidationResult {
    // Debug logging

    // Check for conditional expressions first
    if (this.isConditionalExpression(type)) {
      // Conditional expressions should not be validated here
      // They should be handled by the conditional validation system
      // Return an error indicating this is not supported in this context
      const result: SchemaValidationResult = {
        success: false,
        errors: [
          ErrorHandler.createValidationError(
            [],
            `Unknown or unsupported type: ${type}. Please check the type definition.`,
            value
          ),
        ],
        warnings: [],
        data: value,
      };
      return result;
    }
    if (!type || typeof type !== "string") {
      return this.createErrorResult("Invalid type definition", value);
    }
    // Handle array types first (e.g., "string[]", "number[]", etc.)
    if (type.endsWith("[]")) {
      const elementType = type.slice(0, -2);
      return this.validateArrayWithConstraints(
        value,
        elementType,
        constraints,
        (elementType: string, elementValue: any) =>
          this.routeTypeValidation(elementType, elementValue, options, {})
      );
    }

    // Handle Record types first (both lowercase and TypeScript-style uppercase)
    if (
      (type.startsWith("record<") && type.endsWith(">")) ||
      (type.startsWith("Record<") && type.endsWith(">"))
    ) {
      // Normalize to lowercase for the validator
      const normalizedType = type.startsWith("Record<")
        ? "record<" + type.slice(7)
        : type;

      return this.validateRecordType(
        normalizedType,
        value,
        (fieldType: string, value: any) =>
          this.routeTypeValidation(fieldType, value, options, {})
      );
    }

    const urlType = type.startsWith("url"); // Case-sensitive URL detection

    if (urlType) {
      // For basic "url" type, use "url.web" as default
      const urlArgType = type === "url" ? UrlArgsEnum.web : type;

      // Validate URL arg before proceeding
      if (urlArgType !== UrlArgsEnum.web) {
        // Check if it's a valid URL arg
        if (!UrlArgArray.includes(urlArgType as any)) {
          const error = this.createValidationError(
            [],
            `Invalid URL argument: ${urlArgType}. Valid arguments are: ${UrlArgArray.join(", ")}`,
            "INVALID_URL_ARGUMENT",
            `url.${UrlArgArray.join("|url.")}`,
            value,
            {
              allowedValues: [...UrlArgArray],
              suggestion: `Use one of: ${UrlArgArray.join(", ")}`,
            }
          );

          return {
            success: false,
            errors: [error],
            warnings: [],
            data: value,
          };
        }
      }

      return TypeValidators.validateUrl(value, urlArgType as UrlArgType);
    }

    // switch with new types and better grouping
    // switch with new types and better grouping using VALIDATOR_TYPES enum
    switch (type.toLowerCase()) {
      case VALIDATOR_TYPES.STRING:
        return TypeValidators.validateString(
          value,
          options,
          constraints,
          required,
          customErrorMessage
        );

      case VALIDATOR_TYPES.NUMBER:
      case VALIDATOR_TYPES.FLOAT:
        return TypeValidators.validateNumber(
          value,
          options,
          constraints,
          required,
          customErrorMessage
        );

      case VALIDATOR_TYPES.INT:
      case VALIDATOR_TYPES.INTEGER:
        console.log("Got int value");
        return TypeValidators.validateInteger(
          value,
          options,
          constraints,
          type as "int" | "integer"
        );

      case VALIDATOR_TYPES.POSITIVE:
      case VALIDATOR_TYPES.NEGATIVE:
        console.log("Got positive/negative value");
        return TypeValidators.validateNumber(
          value,
          options,
          { ...constraints, type },
          required
        );

      case VALIDATOR_TYPES.DOUBLE:
        return TypeValidators.validateFloat(
          value,
          options,
          constraints,
          "double"
        );

      case VALIDATOR_TYPES.BOOLEAN:
      case VALIDATOR_TYPES.BOOL:
        return TypeValidators.validateBoolean(value, options, constraints, required);

      case VALIDATOR_TYPES.DATE:
      case VALIDATOR_TYPES.DATETIME:
      case VALIDATOR_TYPES.TIMESTAMP:
        return TypeValidators.validateDate(
          value,
          options,
          constraints,
          type as "date" | "datetime" | "timestamp",
          required
        );

      case VALIDATOR_TYPES.EMAIL:
        return TypeValidators.validateEmail(value);

      case VALIDATOR_TYPES.UUID:
      case VALIDATOR_TYPES.GUID:
        return TypeValidators.validateUuid(value, type as "uuid" | "guid");

      case VALIDATOR_TYPES.PHONE:
        return TypeValidators.validatePhone(value);

      case VALIDATOR_TYPES.SLUG:
        return TypeValidators.validateSlug(value);

      case VALIDATOR_TYPES.USERNAME:
        return TypeValidators.validateUsername(value);

      case VALIDATOR_TYPES.IP:
        return TypeValidators.validateIp(value);

      case VALIDATOR_TYPES.PASSWORD:
        return TypeValidators.validatePassword(value);

      case VALIDATOR_TYPES.TEXT:
        return TypeValidators.validateText(value, {});

      case VALIDATOR_TYPES.JSON:
        return TypeValidators.validateJson(value, { securityMode: "fast" }); // Default to fast

      case "json.fast":
        return TypeValidators.validateJson(value, { securityMode: "fast" });

      case "json.secure":
        return TypeValidators.validateJson(value, { securityMode: "secure" });

      case VALIDATOR_TYPES.OBJECT:
        return TypeValidators.validateObject(value);

      case VALIDATOR_TYPES.UNKNOWN:
      case VALIDATOR_TYPES.VOID:
      case VALIDATOR_TYPES.NULL:
      case VALIDATOR_TYPES.UNDEFINED:
      case VALIDATOR_TYPES.ANY:
        return TypeValidators.validateSpecialType(
          value,
          type as "unknown" | "void" | "null" | "undefined" | "any"
        );

      // NEW TYPE CASES
      case VALIDATOR_TYPES.HEXCOLOR:
        return this.validateHexColor(value);

      case VALIDATOR_TYPES.BASE64:
        return this.validateBase64(value);

      case VALIDATOR_TYPES.JWT:
        return this.validateJWT(value);

      case VALIDATOR_TYPES.SEMVER:
        return this.validateSemVer(value);

      default:
        return this.createErrorResult(
          `Unknown or unsupported type: ${type}. Please check the type definition.`,
          value
        );
    }
  }

  /**
   * NEW: Validate hex color codes (#RGB, #RRGGBB, #RRGGBBAA)
   */
  private static validateHexColor(value: any): SchemaValidationResult {
    if (typeof value !== "string") {
      return this.createErrorResult("Hex color must be a string", value);
    }

    if (!HEX_COLOR_PATTERN.test(value)) {
      return this.createErrorResult(
        "Invalid hex color format. Expected #RGB, #RRGGBB, or #RRGGBBAA",
        value
      );
    }

    return this.createSuccessResult(value.toUpperCase());
  }

  /**
   * NEW: Validate Base64 encoded strings
   */
  private static validateBase64(value: any): SchemaValidationResult {
    if (typeof value !== "string") {
      return this.createErrorResult("Base64 must be a string", value);
    }

    if (value.length === 0) {
      return this.createErrorResult("Base64 string cannot be empty", value);
    }

    if (value.length % 4 !== 0) {
      return this.createErrorResult(
        "Base64 string length must be multiple of 4",
        value
      );
    }

    if (!BASE64_PATTERN.test(value)) {
      return this.createErrorResult("Invalid Base64 format", value);
    }

    try {
      // Validate by attempting to decode
      if (typeof atob !== "undefined") {
        atob(value);
      } else if (typeof Buffer !== "undefined") {
        Buffer.from(value, "base64");
      }
    } catch (error) {
      return this.createErrorResult("Invalid Base64 encoding", value);
    }

    return this.createSuccessResult(value);
  }

  /**
   * NEW: Validate JWT (JSON Web Token) format
   */
  private static validateJWT(value: any): SchemaValidationResult {
    if (typeof value !== "string") {
      return this.createErrorResult("JWT must be a string", value);
    }

    if (!JWT_PATTERN.test(value)) {
      return this.createErrorResult(
        "Invalid JWT format. Expected three base64url segments separated by dots",
        value
      );
    }

    const parts = value.split(".");
    if (parts.length !== 3) {
      return this.createErrorResult("JWT must have exactly 3 parts", value);
    }

    // Validate each part is valid base64url
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!/^[A-Za-z0-9_-]+$/.test(part)) {
        return this.createErrorResult(
          `JWT part ${i + 1} contains invalid base64url characters`,
          value
        );
      }
    }

    // Try to decode header and payload (not signature for security reasons)
    try {
      const header = JSON.parse(this.base64urlDecode(parts[0]));
      const payload = JSON.parse(this.base64urlDecode(parts[1]));

      if (!header.alg || !header.typ) {
        return this.createErrorResult(
          "JWT header missing required fields (alg, typ)",
          value
        );
      }
    } catch (error) {
      return this.createErrorResult(
        "JWT header or payload is not valid JSON",
        value
      );
    }

    return this.createSuccessResult(value);
  }

  /**
   * NEW: Validate Semantic Versioning (SemVer) format
   */
  private static validateSemVer(value: any): SchemaValidationResult {
    if (typeof value !== "string") {
      return this.createErrorResult("SemVer must be a string", value);
    }

    if (!SEMVER_PATTERN.test(value)) {
      return this.createErrorResult(
        "Invalid SemVer format. Expected MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]",
        value
      );
    }

    const parts = value.split(".");
    if (parts.length < 3) {
      return this.createErrorResult(
        "SemVer must have at least MAJOR.MINOR.PATCH",
        value
      );
    }

    // Validate major, minor, patch are valid numbers
    const [major, minor] = parts;
    const patchPart = parts[2].split("-")[0].split("+")[0]; // Remove prerelease and build

    if (!Number.isInteger(Number(major)) || Number(major) < 0) {
      return this.createErrorResult(
        "SemVer major version must be a non-negative integer",
        value
      );
    }

    if (!Number.isInteger(Number(minor)) || Number(minor) < 0) {
      return this.createErrorResult(
        "SemVer minor version must be a non-negative integer",
        value
      );
    }

    if (!Number.isInteger(Number(patchPart)) || Number(patchPart) < 0) {
      return this.createErrorResult(
        "SemVer patch version must be a non-negative integer",
        value
      );
    }

    return this.createSuccessResult(value);
  }

  /**
   * Helper: Base64url decode for JWT validation
   */
  private static base64urlDecode(str: string): string {
    // Convert base64url to base64
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");

    // Pad with = if necessary
    while (base64.length % 4) {
      base64 += "=";
    }

    try {
      if (typeof atob !== "undefined") {
        return atob(base64);
      } else if (typeof Buffer !== "undefined") {
        return Buffer.from(base64, "base64").toString();
      } else {
        throw new Error("No base64 decoder available");
      }
    } catch (error) {
      throw new Error("Invalid base64url encoding");
    }
  }

  /**
   * result merging with better performance and warning handling
   */
  static mergeResults(
    results: SchemaValidationResult[]
  ): SchemaValidationResult {
    if (results.length === 0) {
      return this.createSuccessResult(undefined);
    }

    if (results.length === 1) {
      return results[0];
    }

    let success = true;
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    const mergedData: any[] = [];

    for (const result of results) {
      if (!result.success) {
        success = false;
      }
      errors.push(...result.errors);
      warnings.push(...result.warnings);

      if (result.data !== undefined) {
        mergedData.push(result.data);
      }
    }

    // Remove duplicate errors by comparing path and message
    const uniqueErrors = errors.filter(
      (error, index, arr) =>
        arr.findIndex(
          (e) =>
            e.path.join(".") === error.path.join(".") &&
            e.message === error.message
        ) === index
    );

    return {
      success,
      errors: uniqueErrors,
      warnings: [...new Set(warnings)], // Remove duplicates
      data: mergedData.length === 1 ? mergedData[0] : mergedData,
    };
  }

  /**
   * Create rich error result with detailed information
   */
  static createErrorResult(
    error: string,
    value?: any,
    context?: string
  ): SchemaValidationResult {
    const errorObj = ErrorHandler.createError(
      context ? [context] : [],
      error,
      ErrorCode.VALIDATION_ERROR,
      "unknown",
      value
    );

    return {
      success: false,
      errors: [errorObj],
      warnings: [],
      data: value,
    };
  }

  /**
   * Create detailed validation error object
   */
  static createValidationError(
    path: string[],
    message: string,
    code: string,
    expected: string,
    received: any,
    context?: {
      suggestion?: string;
      allowedValues?: any[];
      constraints?: Record<string, any>;
    }
  ): ValidationError {
    return {
      path,
      message,
      code,
      expected,
      received,
      receivedType: this.getValueType(received),
      context,
    };
  }

  /**
   * Create field validation error with path
   */
  static createFieldError(
    fieldPath: string,
    message: string,
    expected: string,
    received: any,
    code: string = "FIELD_VALIDATION_ERROR",
    suggestion?: string
  ): ValidationError {
    return this.createValidationError(
      fieldPath.split(".").filter((p) => p.length > 0),
      message,
      code,
      expected,
      received,
      suggestion ? { suggestion } : undefined
    );
  }

  /**
   * Get detailed type information for values
   */
  static getValueType(value: any): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (Array.isArray(value)) return "array";
    if (value instanceof Date) return "date";
    if (value instanceof RegExp) return "regexp";
    return typeof value;
  }

  /**
   * success result creation
   */
  static createSuccessResult(
    data: any,
    warnings: string[] = []
  ): SchemaValidationResult {
    return {
      success: true,
      errors: [],
      warnings: [...new Set(warnings)], // Remove duplicate warnings
      data,
    };
  }

  /**
   * cache management with selective clearing
   */
  static clearCaches(cacheType?: "constant" | "all"): void {
    if (!cacheType || cacheType === "all" || cacheType === "constant") {
      constantCache.clear();
    }
  }

  /**
   * cache statistics with memory usage estimation
   */
  static getCacheStats(): {
    constantCacheSize: number;
    constantCacheMemoryEstimate: number;
  } {
    let memoryEstimate = 0;

    for (const [key, value] of constantCache.entries()) {
      memoryEstimate += key.length * 2; // String characters are 2 bytes each
      memoryEstimate += this.estimateObjectSize(value);
    }

    return {
      constantCacheSize: constantCache.size,
      constantCacheMemoryEstimate: memoryEstimate,
    };
  }

  /**
   * Estimate object size in bytes for cache statistics
   */
  private static estimateObjectSize(obj: any): number {
    if (obj === null || obj === undefined) return 8;

    switch (typeof obj) {
      case "boolean":
        return 4;
      case "number":
        return 8;
      case "string":
        return obj.length * 2;
      case "object":
        if (Array.isArray(obj)) {
          return obj.reduce(
            (sum, item) => sum + this.estimateObjectSize(item),
            24
          );
        }
        return Object.entries(obj).reduce(
          (sum, [key, value]) =>
            sum + key.length * 2 + this.estimateObjectSize(value),
          24
        );
      default:
        return 8;
    }
  }

  /**
   * validation with comprehensive error context
   */
  static validateWithContext(
    type: string,
    value: any,
    options: SchemaOptions,
    constraints: any,
    fieldPath?: string
  ): SchemaValidationResult {
    const result = this.routeTypeValidation(type, value, options, constraints);

    if (!result.success && fieldPath) {
      // Update error paths with field context
      const updatedErrors = result.errors.map((error) => ({
        ...error,
        path: fieldPath.split(".").concat(error.path),
        message: error.message, // Keep original message, path provides context
      }));

      return {
        ...result,
        errors: updatedErrors,
      };
    }

    return result;
  }
}
