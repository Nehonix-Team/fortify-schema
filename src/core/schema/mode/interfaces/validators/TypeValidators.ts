/**
 * Type Validators Module
 *
 * Contains all basic type validation logic extracted from InterfaceSchema
 * to improve maintainability and reduce file size.
 */

import {
  SchemaValidationResult,
  ValidationError,
} from "../../../../types/types";
import { SchemaOptions } from "../Interface";
import { ErrorHandler } from "../errors/ErrorHandler";
import { ErrorCode } from "../errors/types/errors.type";
import { validatePassword } from "./mods/passValidator";
import { Security } from "./mods/securityValidator";
import { UrlValidation } from "./mods/urlValidation";

/**
 * Validates basic types with enhanced constraints
 */
export class TypeValidators {
  // Private constants for validation patterns
  private static readonly UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  private static readonly PHONE_PATTERN = /^[1-9]\d{6,14}$/;
  private static readonly SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  private static readonly USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,20}$/;

  // Private constants for loose mode conversion
  private static readonly TRUTHY_VALUES = ["true", "1", "yes", "on"];
  private static readonly FALSY_VALUES = ["false", "0", "no", "off"];

  // Private utility methods
  private static createResult(
    success: boolean = true,
    data: any = null,
    errors: ValidationError[] = [],
    warnings: string[] = []
  ): SchemaValidationResult {
    return {
      success,
      errors: [...errors],
      warnings: [...warnings],
      data,
    };
  }

  private static addError(
    result: SchemaValidationResult,
    message: ValidationError
  ): void {
    result.success = false;
    result.errors.push(message);
  }

  private static addWarning(
    result: SchemaValidationResult,
    message: string
  ): void {
    result.warnings.push(message);
  }

  private static isValidNumber(value: any): boolean {
    return typeof value === "number" && isFinite(value);
  }

  private static isValidInteger(value: any): boolean {
    return this.isValidNumber(value) && value % 1 === 0;
  }

  private static tryParseNumber(value: string): number | null {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }

  private static tryParseInteger(value: string): number | null {
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num;
  }

  private static validateNumberConstraints(
    result: SchemaValidationResult,
    value: number,
    constraints: any,
    typeLabel: string = "Number"
  ): void {
    if (constraints.min !== undefined && value < constraints.min) {
      this.addError(
        result,
        ErrorHandler.createNumberError([], "minimum", value)
      );
    }

    if (constraints.max !== undefined && value > constraints.max) {
      this.addError(
        result,
        ErrorHandler.createNumberError([], "maximum", value)
      );
    }
  }

  private static handleLooseStringToNumber(
    result: SchemaValidationResult,
    value: string,
    parser: (val: string) => number | null,
    warningMessage: string
  ): boolean {
    const parsed = parser(value);
    if (parsed !== null) {
      result.data = parsed;
      this.addWarning(result, warningMessage);
      return true;
    }
    return false;
  }

  private static validateStringConstraints(
    result: SchemaValidationResult,
    value: string,
    constraints: any
  ): void {
    if (
      constraints.minLength !== undefined &&
      value.length < constraints.minLength
    ) {
      this.addError(
        result,
        ErrorHandler.createStringError([], "minimumLength", value)
      );
    }

    if (
      constraints.maxLength !== undefined &&
      value.length > constraints.maxLength
    ) {
      this.addError(
        result,
        ErrorHandler.createStringError([], "maximumLength", value)
      );
    }

    if (constraints.pattern && !constraints.pattern.test(value)) {
      this.addError(
        result,
        ErrorHandler.createStringError([], "pattern", value)
      );
    }
  }

  private static handleLooseBooleanConversion(
    result: SchemaValidationResult,
    value: any
  ): boolean {
    if (typeof value === "string") {
      const lower = value.toLowerCase();
      if (this.TRUTHY_VALUES.includes(lower)) {
        result.data = true;
        this.addWarning(result, "String converted to boolean (loose mode)");
        return true;
      } else if (this.FALSY_VALUES.includes(lower)) {
        result.data = false;
        this.addWarning(result, "String converted to boolean (loose mode)");
        return true;
      }
    } else if (typeof value === "number") {
      result.data = Boolean(value);
      this.addWarning(result, "Number converted to boolean (loose mode)");
      return true;
    }
    return false;
  }

  private static handleLooseDateConversion(
    result: SchemaValidationResult,
    value: any
  ): boolean {
    if (typeof value === "string") {
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime())) {
        result.data = parsedDate;
        this.addWarning(result, "String converted to Date (loose mode)");
        return true;
      }
    } else if (typeof value === "number") {
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime())) {
        result.data = parsedDate;
        this.addWarning(result, "Number converted to Date (loose mode)");
        return true;
      }
    }
    return false;
  }

  private static validatePattern(
    value: string,
    pattern: RegExp,
    typeName: string
  ): SchemaValidationResult {
    const result = this.createResult(true, value);

    if (typeof value !== "string") {
      this.addError(result, ErrorHandler.createTypeError([], "string", value));
    } else if (!pattern.test(value)) {
      this.addError(
        result,
        ErrorHandler.createValidationError(
          [],
          `Invalid ${typeName} format`,
          value
        )
        // ErrorHandler.createTypeError([], typeName, value)
      );
    }

    return result;
  }

  /**
   * Validate required field (non-empty/non-zero)
   */
  private static validateRequired(
    result: SchemaValidationResult,
    value: any,
    type: string
  ): void {
    let isEmpty = false;

    switch (type) {
      case "string":
        isEmpty = value === "";
        break;
      case "number":
      case "int":
      case "integer":
      case "float":
      case "double":
      case "positive":
      case "negative":
        isEmpty = value === 0;
        break;
      case "boolean":
        isEmpty = false; // Booleans can't be "empty"
        break;
      default:
        // For arrays, objects, etc.
        if (Array.isArray(value)) {
          isEmpty = value.length === 0;
        } else if (value && typeof value === "object") {
          isEmpty = Object.keys(value).length === 0;
        } else {
          isEmpty = value === null || value === undefined;
        }
        break;
    }

    if (isEmpty) {
      this.addError(
        result,
        ErrorHandler.createValidationError(
          [],
          `Required field cannot be empty (expected non-empty ${type})`,
          value
        )
      );
    }
  }

  /**
   * Validate string type with constraints
   */
  static validateString(
    value: any,
    options: SchemaOptions,
    constraints: any,
    required: boolean = false
  ): SchemaValidationResult {
    const result = this.createResult(true, value);

    // Check for null/undefined when required (! syntax)
    if (required && (value === null || value === undefined)) {
      this.addError(
        result,
        ErrorHandler.createValidationError(
          [],
          `Required field cannot be null or undefined`,
          value
        )
      );
      return result;
    }

    if (typeof value !== "string") {
      this.addError(result, ErrorHandler.createTypeError([], "string", value));
      return result;
    }

    // Check required validation (non-empty)
    if (required) {
      this.validateRequired(result, value, "string");
    }

    this.validateStringConstraints(result, value, constraints);
    return result;
  }

  /**
   * Validate number type with constraints
   */
  static validateNumber(
    value: any,
    options: SchemaOptions,
    constraints: any,
    required: boolean = false
  ): SchemaValidationResult {
    const result = this.createResult(true, value);

    // Check for null/undefined when required (! syntax)
    if (required && (value === null || value === undefined)) {
      this.addError(
        result,
        ErrorHandler.createValidationError(
          [],
          `Required field cannot be null or undefined`,
          value
        )
      );
      return result;
    }

    if (typeof value === "string" && options.loose) {
      if (
        !this.handleLooseStringToNumber(
          result,
          value,
          this.tryParseNumber,
          "String converted to number (loose mode)"
        )
      ) {
        this.addError(
          result,
          ErrorHandler.createTypeError([], "number", value)
        );
        return result;
      }
      value = result.data;
    } else if (!this.isValidNumber(value)) {
      this.addError(result, ErrorHandler.createTypeError([], "number", value));
      return result;
    }

    // CRITICAL FIX: Handle positive/negative validation for number types
    if (constraints.type === "positive" && value <= 0) {
      this.addError(
        result,
        ErrorHandler.createNumberError([], "positive", value)
      );
    } else if (constraints.type === "negative" && value >= 0) {
      this.addError(
        result,
        ErrorHandler.createNumberError([], "negative", value)
      );
    }

    // Check required validation (non-zero)
    if (required) {
      this.validateRequired(result, value, "number");
    }

    this.validateNumberConstraints(result, value, constraints);
    return result;
  }

  /**
   * Validate integer types (int, integer, positive, negative)
   */
  static validateInteger(
    value: any,
    options: SchemaOptions,
    constraints: any,
    type: "int" | "integer" | "positive" | "negative"
  ): SchemaValidationResult {
    const result = this.createResult(true, value);
    console.log("test1");

    if (typeof value === "string" && options.loose) {
      console.log("test2");

      if (
        !this.handleLooseStringToNumber(
          result,
          value,
          this.tryParseInteger,
          "String converted to integer (loose mode)"
        )
      ) {
        this.addError(
          result,
          ErrorHandler.createTypeError([], "integer", value)
        );
        return result;
      }
      value = result.data;
    } else if (!this.isValidInteger(value)) {
      this.addError(result, ErrorHandler.createTypeError([], "integer", value));
      return result;
    }

    // Type-specific validation
    if (type === "positive" && value <= 0) {
      console.log("test");
      this.addError(
        result,
        ErrorHandler.createNumberError([], "positive", value)
      );
    } else if (type === "negative" && value >= 0) {
      this.addError(
        result,
        ErrorHandler.createNumberError([], "negative", value)
      );
    }

    this.validateNumberConstraints(result, value, constraints, "Integer");
    return result;
  }

  /**
   * Validate float types (float, double)
   */
  static validateFloat(
    value: any,
    options: SchemaOptions,
    constraints: any,
    type: "float" | "double",
    required: boolean = false
  ): SchemaValidationResult {
    const result = this.createResult(true, value);

    // Check for null/undefined when required (! syntax)
    if (required && (value === null || value === undefined)) {
      this.addError(
        result,
        ErrorHandler.createValidationError(
          [],
          `Required field cannot be null or undefined`,
          value
        )
      );
      return result;
    }

    if (typeof value === "string" && options.loose) {
      if (
        !this.handleLooseStringToNumber(
          result,
          value,
          this.tryParseNumber,
          "String converted to float (loose mode)"
        )
      ) {
        this.addError(result, ErrorHandler.createTypeError([], "float", value));
        return result;
      }
      value = result.data;
    } else if (!this.isValidNumber(value)) {
      this.addError(result, ErrorHandler.createTypeError([], "float", value));
      return result;
    }

    this.validateNumberConstraints(result, value, constraints, "Float");
    return result;
  }

  /**
   * Validate boolean types (boolean, bool)
   */
  static validateBoolean(
    value: any,
    options: SchemaOptions,
    constraints: any,
    required: boolean = false
  ): SchemaValidationResult {
    const result = this.createResult(true, value);

    // Check for null/undefined when required (! syntax)
    if (required && (value === null || value === undefined)) {
      this.addError(
        result,
        ErrorHandler.createValidationError(
          [],
          `Required field cannot be null or undefined`,
          value
        )
      );
      return result;
    }

    if (typeof value === "boolean") {
      result.data = value;
    } else if (options.loose) {
      if (!this.handleLooseBooleanConversion(result, value)) {
        this.addError(
          result,
          ErrorHandler.createTypeError([], "boolean", value)
        );
      }
    } else {
      this.addError(result, ErrorHandler.createTypeError([], "boolean", value));
    }

    return result;
  }

  /**
   * Validate date types (date, datetime, timestamp)
   */
  static validateDate(
    value: any,
    options: SchemaOptions,
    constraints: any,
    type: "date" | "datetime" | "timestamp",
    required: boolean = false
  ): SchemaValidationResult {
    const result = this.createResult(true, value);

    // Check for null/undefined when required (! syntax)
    if (required && (value === null || value === undefined)) {
      this.addError(
        result,
        ErrorHandler.createValidationError(
          [],
          `Required field cannot be null or undefined`,
          value
        )
      );
      return result;
    }

    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        this.addError(result, ErrorHandler.createDateError([], value));
      }
    } else if (typeof value === "string" || typeof value === "number") {
      // Accept date strings and timestamps even in strict mode
      // This is reasonable since they represent valid date values
      const dateValue = new Date(value);
      if (isNaN(dateValue.getTime())) {
        this.addError(
          result,
          ErrorHandler.createError(
            [],
            typeof value === "string"
              ? "Invalid date string"
              : "Invalid timestamp",
            ErrorCode.INVALID_DATE,
            "date",
            value
          )
        );
      } else {
        result.data = dateValue;
        if (!options.loose) {
          // Add a warning in strict mode to indicate conversion
          result.warnings = result.warnings || [];
          result.warnings.push("Date string converted to Date object");
        }
      }
    } else {
      this.addError(result, ErrorHandler.createTypeError([], "date", value));
    }

    return result;
  }

  /**
   * Validate email format with comprehensive RFC 5322 compliance and plus addressing support
   */
  static validateEmail(
    ...args: Parameters<typeof Security.validateEmail>
  ): SchemaValidationResult {
    return Security.validateEmail(...args);
  }

  /**
   *  URL validation with comprehensive checks
   */
  static validateUrl(
    ...args: Parameters<typeof UrlValidation>
  ): SchemaValidationResult {
    return UrlValidation(...args);
  }

  /**
   * Validate UUID/GUID format
   */
  static validateUuid(
    value: any,
    type: "uuid" | "guid" = "uuid"
  ): SchemaValidationResult {
    return this.validatePattern(value, this.UUID_PATTERN, type.toUpperCase());
  }

  /**
   * Validate phone format
   */
  static validatePhone(value: any): SchemaValidationResult {
    const result = this.createResult(true, value);

    if (typeof value !== "string") {
      this.addError(result, ErrorHandler.createTypeError([], "phone", value));
    } else {
      const cleanPhone = value.replace(/[\s\-\(\)\.+]/g, "");
      if (!this.PHONE_PATTERN.test(cleanPhone)) {
        this.addError(result, ErrorHandler.createTypeError([], "phone", value));
      }
    }

    return result;
  }

  /**
   * Validate slug format
   */
  static validateSlug(value: any): SchemaValidationResult {
    return this.validatePattern(
      value,
      this.SLUG_PATTERN,
      "slug (use lowercase letters, numbers, and hyphens)"
    );
  }

  /**
   * Validate username format
   */
  static validateUsername(value: any): SchemaValidationResult {
    return this.validatePattern(
      value,
      this.USERNAME_PATTERN,
      "username (3-20 chars, letters, numbers, underscore, hyphen)"
    );
  }

  /**
   * Validate password format
   */
  static validatePassword(
    ...args: Parameters<typeof validatePassword>
  ): SchemaValidationResult {
    return validatePassword(...args);
  }

  /**
   * Validate text format (alias for string)
   */
  static validateText(
    ...args: Parameters<typeof Security.validateText>
  ): SchemaValidationResult {
    return Security.validateTextSync(...args);
  }

  /**
   * Validate JSON format with optional security mode
   */
  static validateJson(
    value: any,
    options?: { securityMode?: "fast" | "secure" }
  ): SchemaValidationResult {
    return Security.validateJsonSync(value, options);
  }

  /**
   * Validate IP address format (IPv4 and IPv6)
   */
  static validateIp(value: any): SchemaValidationResult {
    return Security.validateIp(value);
  }

  /**
   * Validate object type
   */
  static validateObject(value: any): SchemaValidationResult {
    return Security.validateObject(value);
  }

  /**
   * Validate special types (unknown, void, null, undefined, any)
   */
  static validateSpecialType(
    value: any,
    type: "unknown" | "void" | "null" | "undefined" | "any"
  ): SchemaValidationResult {
    const result = this.createResult(true, value);

    switch (type) {
      case "unknown":
      case "any":
        // Accept any value
        break;
      case "void":
        if (value !== undefined) {
          this.addError(
            result,
            ErrorHandler.createTypeError([], "void", value)
          );
        }
        break;
      case "null":
        if (value !== null) {
          this.addError(
            result,
            ErrorHandler.createTypeError([], "null", value)
          );
        }
        break;
      case "undefined":
        if (value !== undefined) {
          this.addError(
            result,
            ErrorHandler.createTypeError([], "undefined", value)
          );
        }
        break;
    }

    return result;
  }
}
