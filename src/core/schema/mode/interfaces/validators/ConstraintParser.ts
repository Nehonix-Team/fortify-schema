/**
 * Constraint Parser Module - Enhanced Robust Version
 *
 * Optimized parsing of constraint syntax like "string(3,20)", "number(0,100)?", etc.
 * Uses caching, pre-compiled patterns, and robust regex validation for maximum reliability.
 */

import {
  ParsedConstraints,
  ConstraintType,
} from "../../../../types/parser.type";
import {
  SUPPORTED_VALIDATOR_TYPES,
  VALID_CONDITIONNAL_TYPES,
} from "../../../../types/ValidatorTypes";

/**
 * Enhanced constraint parser with robust regex patterns and bulletproof validation
 */
export class ConstraintParser {
  // Private static properties for better encapsulation
  private static readonly _parseCache = new Map<string, ParsedConstraints>();
  private static readonly _maxCacheSize = 1000;
  private static _cacheHits = 0;
  private static _cacheMisses = 0;

  // pre-compiled regex patterns with stronger validation
  private static readonly _patterns = {
    // Robust constraint pattern - handles complex nested patterns
    constraint: /^([a-zA-Z_][a-zA-Z0-9_]*(?:\[\])*)\((.+)\)$/,

    // Enhanced regex pattern detection with proper escaping
    regex: /^\/(.+?)\/([gimsuvy]*)$/,

    // Precise comma splitting that handles whitespace
    commaSplit: /\s*,\s*/,

    // Robust numeric validation including scientific notation and edge cases
    numeric: /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/,

    // Strict base type validation
    baseType: /^[a-zA-Z_][a-zA-Z0-9_]*(?:\[\])*$/,

    // Enhanced complex constraint detection
    complexConstraint: /^[a-zA-Z_][a-zA-Z0-9_]*(?:\[\])*\([^)]*\)$/,

    // Union type detection with balanced parentheses
    unionType: /^\([^()]*(?:\|[^()]*)+\)$/,

    // Record type detection (both cases)
    recordTypeLower: /^record<[^<>]+>$/i,
    recordTypeUpper: /^Record<[^<>]+>$/,

    // Optional marker validation
    optionalMarker: /\?$/,

    // Required marker validation
    requiredMarker: /!$/,

    // Whitespace validation
    whitespaceOnly: /^\s*$/,

    // Constraint key validation
    constraintKey: /^[a-zA-Z][a-zA-Z0-9_]*$/,

    // Balanced parentheses validation
    balancedParens: /^[^()]*(?:\([^()]*\)[^()]*)*$/,

    // Array type detection
    arrayType: /^[a-zA-Z_][a-zA-Z0-9_]*\[\]$/,

    // Equal sign prefix for literal values
    literalValue: /^=/,

    // Boolean value validation
    booleanValue: /^(?:true|false)$/i,

    // Enhanced semicolon split for complex constraints
    semicolonSplit: /\s*;\s*/,

    // Colon split for key-value pairs
    colonSplit: /\s*:\s*/,
  } as const;

  // Character codes for optimized checks
  private static readonly _charCodes = {
    questionMark: 63, // '?'
    exclamation: 33, // '!'
    openParen: 40, // '('
    closeParen: 41, // ')'
    comma: 44, // ','
    semicolon: 59, // ';'
    colon: 58, // ':'
    pipe: 124, // '|'
    openBracket: 91, // '['
    closeBracket: 93, // ']'
    slash: 47, // '/'
    backslash: 92, // '\'
    equal: 61, // '='
  } as const;

  /**
   * Parse constraint syntax with aggressive caching and robust validation
   */
  static parseConstraints(fieldType: string): ParsedConstraints {
    if (!this._isValidInput(fieldType)) {
      throw new Error("Invalid field type: must be a non-empty string");
    }

    // Check cache first
    const cached = this._parseCache.get(fieldType);
    if (cached) {
      this._cacheHits++;
      return this._deepClone(cached);
    }

    this._cacheMisses++;
    const result = this._parseConstraintsInternal(fieldType);

    // Cache the result with size limit
    this._addToCache(fieldType, result);

    return result;
  }

  /**
   * Enhanced input validation
   */
  private static _isValidInput(input: unknown): input is string {
    return (
      typeof input === "string" &&
      input.length > 0 &&
      !this._patterns.whitespaceOnly.test(input)
    );
  }

  /**
   * Deep clone utility for cache results
   */
  private static _deepClone(obj: ParsedConstraints): ParsedConstraints {
    const cloned: ParsedConstraints = {
      type: obj.type,
      constraints: {},
      optional: obj.optional,
      required: obj.required,
      customErrorMessage: obj.customErrorMessage,
    };

    // Deep clone constraints object
    if (obj.constraints && typeof obj.constraints === "object") {
      for (const [key, value] of Object.entries(obj.constraints)) {
        if (value instanceof RegExp) {
          cloned.constraints[key] = new RegExp(value.source, value.flags);
        } else if (typeof value === "object" && value !== null) {
          cloned.constraints[key] = { ...value };
        } else {
          cloned.constraints[key] = value;
        }
      }
    }

    return cloned;
  }

  /**
   * Enhanced internal parsing logic with robust error handling
   */
  private static _parseConstraintsInternal(
    fieldType: string
  ): ParsedConstraints {
    let optional = false;
    let required = false;
    let type = this._sanitizeInput(fieldType);
    let constraints: any = {};
    let customErrorMessage: string | undefined;

    if (!type) {
      throw new Error("Field type cannot be empty after sanitization");
    }

    // Parse custom error message (format: "type --> message")
    const errorMessageMatch = type.match(/^(.+?)\s*-->\s*(.+)$/);
    if (errorMessageMatch) {
      type = errorMessageMatch[1].trim();
      customErrorMessage = errorMessageMatch[2].trim();
      
      if (!type) {
        throw new Error('Invalid field type: type cannot be empty before "-->"');
      }
      if (!customErrorMessage) {
        throw new Error('Invalid field type: custom error message cannot be empty after "-->"');
      }
    }

    // Enhanced optional marker detection
    if (this._hasOptionalMarker(type)) {
      optional = true;
      type = this._removeOptionalMarker(type);

      if (!type) {
        throw new Error('Invalid field type: cannot be only "?"');
      }
    }

    // Enhanced required marker detection
    if (this._hasRequiredMarker(type)) {
      required = true;
      type = this._removeRequiredMarker(type);

      if (!type) {
        throw new Error('Invalid field type: cannot be only "!"');
      }
    }

    // Enhanced union type detection
    if (this._isUnionTypeInParentheses(type)) {
      return { type, constraints: {}, optional, required, customErrorMessage };
    }

    // Enhanced constraint parsing with robust validation
    const constraintMatch = this._parseBalancedConstraints(type);
    if (constraintMatch) {
      const { baseType, constraintStr } = constraintMatch;
      type = baseType;

      if (constraintStr) {
        try {
          constraints = this._parseConstraintString(constraintStr, baseType);
        } catch (error) {
          throw new Error(
            `Invalid constraint syntax in "${fieldType}": ${this._getErrorMessage(error)}`
          );
        }
      }
    }

    // Check for conditional expressions (when ... *? ... : ...)
    if (this._isConditionalExpression(type)) {
      return { type, constraints: {}, optional, required, customErrorMessage };
    }

    // Enhanced base type validation
    if (!this._isValidBaseType(type)) {
      throw new Error(`Invalid base type: "${type}"`);
    }

    return { type, constraints, optional, required, customErrorMessage };
  }

  /**
   * Check if type is a conditional expression using secure regex pattern
   */
  private static _isConditionalExpression(type: string): boolean {
    // Secure regex pattern to match: when <condition> *? <thenValue> [: <elseValue>]
    const conditionalPattern = /^\s*when\s+.+?\s*\*\?\s*.+/;
    return conditionalPattern.test(type);
  }

  /**
   * Enhanced input sanitization
   */
  private static _sanitizeInput(input: string): string {
    if (typeof input !== "string") {
      throw new Error("Input must be a string");
    }

    // Trim whitespace but preserve internal structure
    return input.trim().replace(/\s+/g, " ");
  }

  /**
   * Robust optional marker detection
   */
  private static _hasOptionalMarker(type: string): boolean {
    return (
      type.length > 0 &&
      type.charCodeAt(type.length - 1) === this._charCodes.questionMark &&
      this._patterns.optionalMarker.test(type)
    );
  }

  /**
   * Safe optional marker removal
   */
  private static _removeOptionalMarker(type: string): string {
    if (!this._hasOptionalMarker(type)) {
      return type;
    }
    return type.slice(0, -1).trim();
  }

  /**
   * Robust required marker detection
   */
  private static _hasRequiredMarker(type: string): boolean {
    return (
      type.length > 0 &&
      type.charCodeAt(type.length - 1) === this._charCodes.exclamation &&
      this._patterns.requiredMarker.test(type)
    );
  }

  /**
   * Safe required marker removal
   */
  private static _removeRequiredMarker(type: string): string {
    if (!this._hasRequiredMarker(type)) {
      return type;
    }
    return type.slice(0, -1).trim();
  }

  /**
   * Enhanced union type detection with regex validation
   */
  private static _isUnionTypeInParentheses(type: string): boolean {
    return (
      this._patterns.unionType.test(type) &&
      this._containsPipeOperator(type) &&
      this._hasBalancedParentheses(type)
    );
  }

  /**
   * Check for pipe operator in union types
   */
  private static _containsPipeOperator(type: string): boolean {
    for (let i = 0; i < type.length; i++) {
      if (type.charCodeAt(i) === this._charCodes.pipe) {
        return true;
      }
    }
    return false;
  }

  /**
   * Validate balanced parentheses
   */
  private static _hasBalancedParentheses(input: string): boolean {
    let depth = 0;

    for (let i = 0; i < input.length; i++) {
      const charCode = input.charCodeAt(i);

      if (charCode === this._charCodes.openParen) {
        depth++;
      } else if (charCode === this._charCodes.closeParen) {
        depth--;
        if (depth < 0) {
          return false;
        }
      }
    }

    return depth === 0;
  }

  /**
   * Enhanced constraint parsing with robust parentheses handling
   */
  private static _parseBalancedConstraints(
    type: string
  ): { baseType: string; constraintStr: string } | null {
    const match = type.match(this._patterns.constraint);
    if (!match) {
      return null;
    }

    const [, baseType, constraintStr] = match;

    // Enhanced base type validation
    if (!this._patterns.baseType.test(baseType)) {
      throw new Error(`Invalid base type format: "${baseType}"`);
    }

    // Validate constraint string is not empty
    if (!constraintStr || this._patterns.whitespaceOnly.test(constraintStr)) {
      throw new Error(`Empty constraint string in: "${type}"`);
    }

    // Validate balanced parentheses in constraint string
    if (!this._validateConstraintParentheses(constraintStr)) {
      throw new Error(`Unbalanced parentheses in constraint: "${type}"`);
    }

    return { baseType, constraintStr };
  }

  /**
   * Validate parentheses balance in constraint strings
   */
  private static _validateConstraintParentheses(
    constraintStr: string
  ): boolean {
    let depth = 0;
    let inRegex = false;
    let escaped = false;

    for (let i = 0; i < constraintStr.length; i++) {
      const charCode = constraintStr.charCodeAt(i);
      const char = constraintStr[i];

      // Handle regex pattern detection
      if (charCode === this._charCodes.slash && !escaped) {
        inRegex = !inRegex;
        escaped = false;
        continue;
      }

      // Handle escaping
      if (charCode === this._charCodes.backslash && !escaped) {
        escaped = true;
        continue;
      }

      // Skip parentheses inside regex patterns
      if (!inRegex) {
        if (charCode === this._charCodes.openParen && !escaped) {
          depth++;
        } else if (charCode === this._charCodes.closeParen && !escaped) {
          depth--;
          if (depth < 0) {
            return false;
          }
        }
      }

      escaped = false;
    }

    return depth === 0;
  }

  /**
   * Enhanced constraint string parsing with robust error handling
   */
  private static _parseConstraintString(
    constraintStr: string,
    baseType: string
  ): any {
    const trimmed = constraintStr.trim();
    if (!trimmed) {
      return {};
    }

    const constraints: any = {};

    // Enhanced regex pattern detection
    const regexMatch = this._parseRegexPattern(trimmed);
    if (regexMatch) {
      constraints.pattern = regexMatch;
      return constraints;
    }

    // Enhanced semicolon-separated complex constraints
    if (this._containsCharCode(trimmed, this._charCodes.semicolon)) {
      return this._parseComplexConstraints(trimmed);
    }

    // Enhanced min,max constraints
    if (this._containsCharCode(trimmed, this._charCodes.comma)) {
      return this._parseMinMaxConstraints(trimmed, baseType);
    }

    // Enhanced single value constraint
    if (this._isValidNumericValue(trimmed)) {
      const val = this._parseNumericValue(trimmed);
      this._setConstraintValue(constraints, baseType, ConstraintType.Max, val);
      return constraints;
    }

    throw new Error(`Unrecognized constraint format: "${trimmed}"`);
  }

  /**
   * Enhanced regex pattern parsing
   */
  private static _parseRegexPattern(input: string): RegExp | null {
    const match = input.match(this._patterns.regex);
    if (!match) {
      return null;
    }

    try {
      const [, pattern, flags] = match;

      // Validate flags
      if (flags && !this._isValidRegexFlags(flags)) {
        throw new Error(`Invalid regex flags: "${flags}"`);
      }

      return new RegExp(pattern, flags || "");
    } catch (error) {
      throw new Error(`Invalid regex pattern: ${this._getErrorMessage(error)}`);
    }
  }

  /**
   * Validate regex flags
   */
  private static _isValidRegexFlags(flags: string): boolean {
    const validFlags = new Set(["g", "i", "m", "s", "u", "v", "y"]);
    const flagSet = new Set();

    for (const flag of flags) {
      if (!validFlags.has(flag)) {
        return false;
      }
      if (flagSet.has(flag)) {
        return false; // Duplicate flag
      }
      flagSet.add(flag);
    }

    return true;
  }

  /**
   * Check if string contains specific character code
   */
  private static _containsCharCode(str: string, charCode: number): boolean {
    for (let i = 0; i < str.length; i++) {
      if (str.charCodeAt(i) === charCode) {
        return true;
      }
    }
    return false;
  }

  /**
   * Enhanced numeric value validation
   */
  private static _isValidNumericValue(value: string): boolean {
    if (!value || typeof value !== "string") {
      return false;
    }

    return this._patterns.numeric.test(value.trim());
  }

  /**
   * Safe numeric value parsing
   */
  private static _parseNumericValue(value: string): number {
    const trimmed = value.trim();

    if (!this._isValidNumericValue(trimmed)) {
      throw new Error(`Invalid numeric value: "${value}"`);
    }

    const parsed = Number(trimmed);

    if (!Number.isFinite(parsed)) {
      throw new Error(`Non-finite numeric value: "${value}"`);
    }

    return parsed;
  }

  /**
   * Enhanced min,max constraint parsing
   */
  private static _parseMinMaxConstraints(
    constraintStr: string,
    baseType: string
  ): any {
    const constraints: any = {};
    const parts = constraintStr.split(this._patterns.commaSplit);

    if (parts.length > 2) {
      throw new Error(
        `Too many constraint values. Expected format: "min,max" but got: "${constraintStr}"`
      );
    }

    const [minStr, maxStr] = parts;

    // Enhanced minimum value parsing
    if (minStr && !this._patterns.whitespaceOnly.test(minStr)) {
      const minVal = this._parseNumericValue(minStr);
      this._setConstraintValue(
        constraints,
        baseType,
        ConstraintType.Min,
        minVal
      );
    }

    // Enhanced maximum value parsing
    if (maxStr && !this._patterns.whitespaceOnly.test(maxStr)) {
      const maxVal = this._parseNumericValue(maxStr);
      this._setConstraintValue(
        constraints,
        baseType,
        ConstraintType.Max,
        maxVal
      );
    }

    // Enhanced min/max relationship validation
    this._validateMinMaxRelationship(constraints);

    return constraints;
  }

  /**
   * Validate min/max constraint relationships
   */
  private static _validateMinMaxRelationship(constraints: any): void {
    const pairs = [
      ["min", "max"],
      ["minLength", "maxLength"],
      ["minItems", "maxItems"],
    ];

    for (const [minKey, maxKey] of pairs) {
      if (
        constraints[minKey] !== undefined &&
        constraints[maxKey] !== undefined
      ) {
        if (constraints[minKey] > constraints[maxKey]) {
          throw new Error(
            `${minKey} value (${constraints[minKey]}) cannot be greater than ${maxKey} value (${constraints[maxKey]})`
          );
        }
      }
    }
  }

  /**
   * Enhanced constraint value setting with robust validation
   */
  private static _setConstraintValue(
    constraints: any,
    baseType: string,
    constraintType: ConstraintType.Min | ConstraintType.Max,
    value: number
  ): void {
    // Enhanced negative value validation
    if (!Number.isFinite(value)) {
      throw new Error(`Constraint value must be finite: ${value}`);
    }

    // Type-specific negative value validation
    if (this._isStringType(baseType) && value < 0) {
      throw new Error("String length constraints cannot be negative");
    }

    if (this._isArrayType(baseType) && value < 0) {
      throw new Error("Array length constraints cannot be negative");
    }

    // Set appropriate constraint based on type
    if (this._isArrayType(baseType)) {
      constraints[
        constraintType === ConstraintType.Min
          ? ConstraintType.MinItems
          : ConstraintType.MaxItems
      ] = value;
    } else if (this._isStringType(baseType)) {
      constraints[
        constraintType === ConstraintType.Min
          ? ConstraintType.MinLength
          : ConstraintType.MaxLength
      ] = value;
    } else {
      constraints[constraintType] = value;
    }
  }

  /**
   * Enhanced string type detection
   */
  private static _isStringType(type: string): boolean {
    return (
      type === "string" ||
      (this._patterns.baseType.test(type) && type.includes("string"))
    );
  }

  /**
   * Enhanced array type detection
   */
  private static _isArrayType(type: string): boolean {
    return this._patterns.arrayType.test(type) || type.endsWith("[]");
  }

  /**
   * Enhanced base type validation with comprehensive checks
   */
  private static _isValidBaseType(type: string): boolean {
    if (!type || typeof type !== "string") {
      return false;
    }

    // Enhanced whitespace validation
    if (this._patterns.whitespaceOnly.test(type)) {
      return false;
    }

    // Check valid conditional types
    if (VALID_CONDITIONNAL_TYPES.includes(type)) {
      return true;
    }

    // Enhanced union type validation
    if (this._containsPipeOperator(type)) {
      return this._validateUnionType(type);
    }

    // Enhanced literal value validation
    if (this._patterns.literalValue.test(type)) {
      return true;
    }

    // Enhanced Record type validation
    if (this._isRecordType(type)) {
      return true;
    }

    // Enhanced supported validator types check
    if (SUPPORTED_VALIDATOR_TYPES.includes(type as any)) {
      return true;
    }

    // Enhanced base type pattern validation
    return this._patterns.baseType.test(type);
  }

  /**
   * Validate union types
   */
  private static _validateUnionType(type: string): boolean {
    const parts = type.split("|");

    if (parts.length < 2) {
      return false;
    }

    return parts.every((part) => {
      const trimmed = part.trim();
      return trimmed.length > 0 && !this._patterns.whitespaceOnly.test(trimmed);
    });
  }

  /**
   * Enhanced Record type detection
   */
  private static _isRecordType(type: string): boolean {
    return (
      this._patterns.recordTypeLower.test(type) ||
      this._patterns.recordTypeUpper.test(type)
    );
  }

  /**
   * Enhanced cache management with deep cloning
   */
  private static _addToCache(key: string, value: ParsedConstraints): void {
    if (this._parseCache.size >= this._maxCacheSize) {
      const firstKey = this._parseCache.keys().next().value;
      if (firstKey) {
        this._parseCache.delete(firstKey);
      }
    }

    this._parseCache.set(key, this._deepClone(value));
  }

  /**
   * Enhanced complex constraint parsing
   */
  private static _parseComplexConstraints(constraintStr: string): any {
    const constraints: any = {};
    const parts = constraintStr
      .split(this._patterns.semicolonSplit)
      .map((part) => part.trim())
      .filter((part) => !this._patterns.whitespaceOnly.test(part));

    if (parts.length === 0) {
      throw new Error("Empty complex constraint string");
    }

    for (const part of parts) {
      try {
        this._parseComplexConstraintPart(constraints, part);
      } catch (error) {
        throw new Error(
          `Error parsing constraint "${part}": ${this._getErrorMessage(error)}`
        );
      }
    }

    return constraints;
  }

  /**
   * Parse individual complex constraint part
   */
  private static _parseComplexConstraintPart(
    constraints: any,
    part: string
  ): void {
    const colonParts = part.split(this._patterns.colonSplit);

    if (colonParts.length !== 2) {
      throw new Error(
        `Invalid constraint format. Expected "key:value" but got: "${part}"`
      );
    }

    const [key, value] = colonParts;

    if (
      this._patterns.whitespaceOnly.test(key) ||
      this._patterns.whitespaceOnly.test(value)
    ) {
      throw new Error(
        `Invalid constraint format. Both key and value must be non-empty: "${part}"`
      );
    }

    if (!this._patterns.constraintKey.test(key)) {
      throw new Error(`Invalid constraint key format: "${key}"`);
    }

    this._parseComplexConstraintPair(constraints, key, value);
  }

  /**
   * Enhanced individual constraint key-value pair parsing
   */
  private static _parseComplexConstraintPair(
    constraints: any,
    key: string,
    value: string
  ): void {
    switch (key) {
      case ConstraintType.Min:
      case ConstraintType.Max:
      case ConstraintType.MinLength:
      case ConstraintType.MaxLength:
      case ConstraintType.MinItems:
      case ConstraintType.MaxItems:
        const numValue = this._parseNumericValue(value);

        if (numValue < 0 && (key.includes("Length") || key.includes("Items"))) {
          throw new Error(`"${key}" cannot be negative`);
        }

        constraints[key] = numValue;
        break;

      case "pattern":
        const regexPattern = this._parseRegexPattern(value);
        if (!regexPattern) {
          throw new Error(
            `Pattern must be in regex format (/pattern/flags): "${value}"`
          );
        }
        constraints.pattern = regexPattern;
        break;

      case "unique":
        if (!this._patterns.booleanValue.test(value)) {
          throw new Error(
            `"unique" must be "true" or "false", got: "${value}"`
          );
        }
        constraints.unique = value.toLowerCase() === "true";
        break;

      default:
        throw new Error(`Unknown constraint key: "${key}"`);
    }
  }

  /**
   * Enhanced error message extraction
   */
  private static _getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === "string") {
      return error;
    }
    return "Unknown error";
  }

  // Enhanced public utility methods with stronger validation

  /**
   * Check if a field type has constraints - enhanced validation
   */
  static hasConstraints(fieldType: string): boolean {
    if (!this._isValidInput(fieldType)) {
      return false;
    }

    const sanitized = this._sanitizeInput(fieldType);
    const withoutModifiers = sanitized
      .replace(this._patterns.optionalMarker, "")
      .replace(this._patterns.requiredMarker, "");

    return this._patterns.complexConstraint.test(withoutModifiers);
  }

  /**
   * Extract base type without constraints - enhanced
   */
  static getBaseType(fieldType: string): string {
    if (!this._isValidInput(fieldType)) {
      return "";
    }

    try {
      const parsed = this.parseConstraints(fieldType);
      return parsed.type;
    } catch {
      // Enhanced fallback with regex
      const sanitized = this._sanitizeInput(fieldType);
      return sanitized
        .replace(/\([^)]*\)/, "")
        .replace(this._patterns.optionalMarker, "")
        .replace(this._patterns.requiredMarker, "")
        .trim();
    }
  }

  /**
   * Check if field type is optional - enhanced
   */
  static isOptional(fieldType: string): boolean {
    return this._isValidInput(fieldType) && this._hasOptionalMarker(fieldType);
  }

  /**
   * Check if field type is required - enhanced
   */
  static isRequired(fieldType: string): boolean {
    return this._isValidInput(fieldType) && this._hasRequiredMarker(fieldType);
  }

  /**
   * Check if field type is an array - enhanced
   */
  static isArrayType(fieldType: string): boolean {
    if (!this._isValidInput(fieldType)) {
      return false;
    }

    try {
      const parsed = this.parseConstraints(fieldType);
      return this._isArrayType(parsed.type);
    } catch {
      return false;
    }
  }

  /**
   * Get element type for array types - enhanced
   */
  static getElementType(fieldType: string): string {
    if (!this._isValidInput(fieldType)) {
      return fieldType;
    }

    try {
      const parsed = this.parseConstraints(fieldType);
      if (this._isArrayType(parsed.type)) {
        return parsed.type.replace(/\[\]$/, "");
      }
      return parsed.type;
    } catch {
      return fieldType;
    }
  }

  /**
   * Enhanced constraint validation
   */
  static validateConstraints(constraints: any, type: string): string[] {
    if (!constraints || typeof constraints !== "object") {
      return [];
    }

    const errors: string[] = [];

    try {
      // Enhanced min/max validation
      this._validateMinMaxRelationship(constraints);

      // Enhanced type-specific validation
      this._validateTypeSpecificConstraints(constraints, type, errors);

      // Enhanced regex pattern validation
      if (constraints.pattern && !(constraints.pattern instanceof RegExp)) {
        errors.push("Pattern constraint must be a RegExp object");
      }

      // Enhanced negative value validation
      this._validateNegativeConstraints(constraints, errors);
    } catch (error) {
      errors.push(
        `Constraint validation error: ${this._getErrorMessage(error)}`
      );
    }

    return errors;
  }

  /**
   * Validate type-specific constraints
   */
  private static _validateTypeSpecificConstraints(
    constraints: any,
    type: string,
    errors: string[]
  ): void {
    if (
      type === "positive" &&
      constraints.min !== undefined &&
      constraints.min < 0
    ) {
      errors.push("Positive type cannot have negative minimum value");
    }

    if (
      type === "negative" &&
      constraints.max !== undefined &&
      constraints.max > 0
    ) {
      errors.push("Negative type cannot have positive maximum value");
    }
  }

  /**
   * Validate negative constraints
   */
  private static _validateNegativeConstraints(
    constraints: any,
    errors: string[]
  ): void {
    const lengthKeys = [
      ConstraintType.MinLength,
      ConstraintType.MaxLength,
      ConstraintType.MinItems,
      ConstraintType.MaxItems,
    ];

    lengthKeys.forEach((key) => {
      if (constraints[key] !== undefined && constraints[key] < 0) {
        errors.push(`${key} cannot be negative`);
      }
    });
  }

  /**
   * Enhanced constraint merging
   */
  static mergeConstraints(baseOptions: any, constraints: any): any {
    if (!baseOptions && !constraints) {
      return {};
    }
    if (!baseOptions) {
      return this._deepCloneObject(constraints);
    }
    if (!constraints) {
      return this._deepCloneObject(baseOptions);
    }

    const merged = { ...baseOptions };

    // Enhanced merging with conflict resolution
    for (const [key, value] of Object.entries(constraints)) {
      if (value instanceof RegExp) {
        merged[key] = new RegExp(value.source, value.flags);
      } else if (typeof value === "object" && value !== null) {
        merged[key] = { ...value };
      } else {
        merged[key] = value;
      }
    }

    return merged;
  }

  /**
   * Deep clone utility for objects
   */
  private static _deepCloneObject(obj: any): any {
    if (!obj || typeof obj !== "object") {
      return obj;
    }

    const cloned: any = {};

    for (const [key, value] of Object.entries(obj)) {
      if (value instanceof RegExp) {
        cloned[key] = new RegExp(value.source, value.flags);
      } else if (typeof value === "object" && value !== null) {
        cloned[key] = { ...value };
      } else {
        cloned[key] = value;
      }
    }

    return cloned;
  }

  /**
   * Enhanced cache clearing with statistics reset
   */
  static clearCache(): void {
    this._parseCache.clear();
    this._cacheHits = 0;
    this._cacheMisses = 0;
  }

  /**
   * Enhanced cache statistics with additional metrics
   */
  static getCacheStats(): {
    size: number;
    hitRate: number;
    hits: number;
    misses: number;
    maxSize: number;
    efficiency: number;
  } {
    const total = this._cacheHits + this._cacheMisses;
    const hitRate = total > 0 ? this._cacheHits / total : 0;
    const efficiency = this._parseCache.size > 0 ? hitRate : 0;

    return {
      size: this._parseCache.size,
      hitRate: Number(hitRate.toFixed(4)),
      hits: this._cacheHits,
      misses: this._cacheMisses,
      maxSize: this._maxCacheSize,
      efficiency: Number(efficiency.toFixed(4)),
    };
  }

  /**
   * Enhanced constraint description with better formatting
   */
  static getConstraintDescription(constraints: any, _type?: string): string {
    if (!constraints || typeof constraints !== "object") {
      return "";
    }

    const descriptions: string[] = [];

    try {
      const constraintKeys = [
        ConstraintType.Min,
        ConstraintType.Max,
        ConstraintType.MinLength,
        ConstraintType.MaxLength,
        ConstraintType.MinItems,
        ConstraintType.MaxItems,
      ] as const;

      constraintKeys.forEach((key) => {
        if (
          constraints[key] !== undefined &&
          Number.isFinite(constraints[key])
        ) {
          descriptions.push(`${key}: ${constraints[key]}`);
        }
      });

      if (constraints.pattern instanceof RegExp) {
        const flags = constraints.pattern.flags
          ? `/${constraints.pattern.flags}`
          : "";
        descriptions.push(`pattern: /${constraints.pattern.source}${flags}`);
      }

      if (constraints.unique === true) {
        descriptions.push("unique: true");
      }

      // Enhanced description formatting
      return descriptions.length > 0 ? `(${descriptions.join(", ")})` : "";
    } catch (error) {
      return `(invalid constraints: ${this._getErrorMessage(error)})`;
    }
  }

  /**
   * Enhanced complex constraint parsing (public interface)
   */
  static parseComplexConstraints(constraintStr: string): any {
    if (!this._isValidInput(constraintStr)) {
      throw new Error("Invalid constraint string: must be a non-empty string");
    }

    try {
      return this._parseComplexConstraints(constraintStr);
    } catch (error) {
      throw new Error(
        `Failed to parse complex constraints "${constraintStr}": ${this._getErrorMessage(error)}`
      );
    }
  }

  // Additional enhanced utility methods

  /**
   * Validate field type format comprehensively
   */
  static isValidFieldType(fieldType: string): boolean {
    if (!this._isValidInput(fieldType)) {
      return false;
    }

    try {
      this.parseConstraints(fieldType);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract all modifiers from field type
   */
  static getFieldTypeModifiers(fieldType: string): {
    optional: boolean;
    required: boolean;
    hasConstraints: boolean;
  } {
    if (!this._isValidInput(fieldType)) {
      return { optional: false, required: false, hasConstraints: false };
    }

    try {
      const parsed = this.parseConstraints(fieldType);
      return {
        optional: parsed.optional,
        required: parsed.required,
        hasConstraints: Object.keys(parsed.constraints).length > 0,
      };
    } catch {
      return {
        optional: this.isOptional(fieldType),
        required: this.isRequired(fieldType),
        hasConstraints: this.hasConstraints(fieldType),
      };
    }
  }

  /**
   * Normalize field type string
   */
  static normalizeFieldType(fieldType: string): string {
    if (!this._isValidInput(fieldType)) {
      return "";
    }

    try {
      const parsed = this.parseConstraints(fieldType);
      let normalized = parsed.type;

      // Add constraints back if they exist
      if (Object.keys(parsed.constraints).length > 0) {
        const constraintDesc = this._formatConstraintsForType(
          parsed.constraints
        );
        if (constraintDesc) {
          normalized += `(${constraintDesc})`;
        }
      }

      // Add modifiers back
      if (parsed.required) {
        normalized += "!";
      }
      if (parsed.optional) {
        normalized += "?";
      }

      return normalized;
    } catch {
      return this._sanitizeInput(fieldType);
    }
  }

  /**
   * Format constraints for type reconstruction
   */
  private static _formatConstraintsForType(constraints: any): string {
    if (!constraints || typeof constraints !== "object") {
      return "";
    }

    const parts: string[] = [];

    // Handle regex pattern
    if (constraints.pattern instanceof RegExp) {
      const flags = constraints.pattern.flags || "";
      parts.push(`/${constraints.pattern.source}/${flags}`);
      return parts.join(";");
    }

    // Handle min/max pairs
    if (constraints.min !== undefined && constraints.max !== undefined) {
      parts.push(`${constraints.min},${constraints.max}`);
    } else if (constraints.min !== undefined) {
      parts.push(`${constraints.min},`);
    } else if (constraints.max !== undefined) {
      parts.push(`${constraints.max}`);
    }

    // Handle length constraints
    if (
      constraints.minLength !== undefined &&
      constraints.maxLength !== undefined
    ) {
      if (parts.length === 0) {
        parts.push(`${constraints.minLength},${constraints.maxLength}`);
      } else {
        parts.push(
          `minLength:${constraints.minLength};maxLength:${constraints.maxLength}`
        );
      }
    }

    // Handle items constraints
    if (
      constraints.minItems !== undefined &&
      constraints.maxItems !== undefined
    ) {
      if (parts.length === 0) {
        parts.push(`${constraints.minItems},${constraints.maxItems}`);
      } else {
        parts.push(
          `minItems:${constraints.minItems};maxItems:${constraints.maxItems}`
        );
      }
    }

    // Handle unique
    if (constraints.unique === true) {
      parts.push("unique:true");
    }

    return parts.join(";");
  }

  /**
   * Performance monitoring utilities
   */
  static getParsingPerformance(): {
    totalParses: number;
    cacheHitRatio: number;
    averageParseTime: number;
    memoryUsage: number;
  } {
    const total = this._cacheHits + this._cacheMisses;
    const hitRatio = total > 0 ? this._cacheHits / total : 0;

    return {
      totalParses: total,
      cacheHitRatio: Number(hitRatio.toFixed(4)),
      averageParseTime: 0, // Would need instrumentation
      memoryUsage: this._parseCache.size * 100, // Rough estimate
    };
  }

  /**
   * Optimize cache by removing least recently used entries
   */
  static optimizeCache(): void {
    if (this._parseCache.size <= this._maxCacheSize * 0.8) {
      return; // No optimization needed
    }

    const entries = Array.from(this._parseCache.entries());
    const keepSize = Math.floor(this._maxCacheSize * 0.6);

    // Keep most recent entries (simple LRU approximation)
    this._parseCache.clear();

    entries.slice(-keepSize).forEach(([key, value]) => {
      this._parseCache.set(key, value);
    });
  }

  /**
   * Validate constraint compatibility with field type
   */
  static validateConstraintCompatibility(
    fieldType: string,
    constraints: any
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this._isValidInput(fieldType)) {
      errors.push("Invalid field type");
      return { valid: false, errors };
    }

    if (!constraints || typeof constraints !== "object") {
      return { valid: true, errors: [] };
    }

    try {
      const parsed = this.parseConstraints(fieldType);
      const baseType = parsed.type;

      // Check string-specific constraints
      if (!this._isStringType(baseType)) {
        if (
          constraints.minLength !== undefined ||
          constraints.maxLength !== undefined
        ) {
          errors.push("Length constraints are only valid for string types");
        }
        if (constraints.pattern !== undefined) {
          errors.push("Pattern constraints are only valid for string types");
        }
      }

      // Check array-specific constraints
      if (!this._isArrayType(baseType)) {
        if (
          constraints.minItems !== undefined ||
          constraints.maxItems !== undefined
        ) {
          errors.push("Item constraints are only valid for array types");
        }
        if (constraints.unique !== undefined) {
          errors.push("Unique constraints are only valid for array types");
        }
      }

      // Check numeric-specific constraints
      const numericTypes = ["number", "integer", "positive", "negative"];
      if (!numericTypes.some((t) => baseType.includes(t))) {
        if (constraints.min !== undefined || constraints.max !== undefined) {
          errors.push("Min/Max constraints are only valid for numeric types");
        }
      }
    } catch (error) {
      errors.push(`Type parsing error: ${this._getErrorMessage(error)}`);
    }

    return { valid: errors.length === 0, errors };
  }
}
