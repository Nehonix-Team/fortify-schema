/**
 * TypeScript Interface-like Schema Definition System
 *
 * Allows defining schemas using TypeScript-like syntax with string literals
 * that feel natural and are much easier to read and write.
 */

import {
  SchemaInterface,
  SchemaFieldType,
  SchemaOptions,
  type CompiledField,
  type AllowUnknownSchema,
} from "../../../types/SchemaValidator.type";
import { SchemaValidationResult, ValidationError } from "../../../types/types";

import { ConstraintParser, TypeGuards, ValidationHelpers } from "./validators";
import { ErrorHandler } from "./errors/ErrorHandler";

// Import our conditional validation system
import { ConditionalParser } from "./conditional/parser/ConditionalParser";
import { ConditionalEvaluator } from "./conditional/evaluator/ConditionalEvaluator";

import { ConditionalNode } from "./conditional/types/ConditionalTypes";

// Import performance optimization system
import { SchemaCompiler } from "../../optimization/SchemaCompiler";
import { ObjectValidationCache } from "../../optimization/ObjectValidationCache";
import { PerformanceMonitor } from "../../optimization/PerformanceMonitor";

// Import precompilation system
import {
  SchemaPrecompiler,
  PrecompiledValidator,
  OptimizationLevel,
} from "./precompilation/SchemaPrecompiler";
import { MAX_OBJECT_DEPTH } from "../../../../constants/VALIDATION_CONSTANTS";
import { SchemaValidationError } from "./Interface";
import { ErrorCode } from "./errors/types/errors.type";

/**
 * Interface Schema class for TypeScript-like schema definitions
 */

export class InterfaceSchema<T = any> {
  private compiledFields: CompiledField[] = [];
  private schemaKeys: string[] = [];
  private ConditionalParser: ConditionalParser;
  private compiledValidator?: any;
  private schemaComplexity: number = 0;
  private isOptimized: boolean = false;

  // ULTRA-OPTIMIZED: Precompiled validator for maximum performance
  private precompiledValidator?: PrecompiledValidator;
  private optimizationLevel: OptimizationLevel = OptimizationLevel.NONE;

  constructor(
    private definition: SchemaInterface,
    private options: SchemaOptions = {}
  ) {
    // Initialize conditional parser
    this.ConditionalParser = new ConditionalParser({
      allowNestedConditionals: true,
      maxNestingDepth: MAX_OBJECT_DEPTH,
      strictMode: false,
      enableDebug: false,
    });

    // ULTRA-OPTIMIZED: Pre-compile schema with advanced optimization
    this.precompileSchema();

    // Apply performance optimizations (skip if requested to prevent circular dependency)
    if (!this.options.skipOptimization) {
      this.applyOptimizations();

      //  Create precompiled validator for maximum speed
      this.createPrecompiledValidator();
    }
  }

  /**
   * Check if a field type uses conditional syntax using secure regex pattern
   */
  private isConditionalSyntax(fieldType: string): boolean {
    // Secure regex pattern to match: when <condition> *? <thenValue> [: <elseValue>]
    const conditionalPattern = /^\s*when\s+.+?\s*\*\?\s*.+/;
    return conditionalPattern.test(fieldType);
  }

  /**
   * Apply performance optimizations based on schema characteristics
   */
  private applyOptimizations(): void {
    // Calculate schema complexity
    this.schemaComplexity = this.calculateComplexity();

    // Check if schema has conditional fields
    const hasConditionalFields = this.compiledFields.some(
      (field) => field.isConditional
    );

    // Check nesting depth to avoid optimization bugs with deep nested objects
    const maxNestingDepth = this.calculateMaxNestingDepth();

    // debugging optimization decisions:
    //// console.log(`[DEBUG] Schema optimization analysis:
    //   - Complexity: ${this.schemaComplexity}
    //   - Has conditionals: ${hasConditionalFields}
    //   - Max nesting depth: ${maxNestingDepth}
    //   - Will use advanced optimization: ${this.schemaComplexity > 15 && !hasConditionalFields && maxNestingDepth <= 3}
    //   - Will use caching: ${this.schemaComplexity > 5 && !hasConditionalFields && maxNestingDepth <= 3}`);

    // Apply optimizations based on complexity, but avoid advanced optimizations for conditional fields or deep nesting
    if (
      this.schemaComplexity > 15 &&
      !hasConditionalFields &&
      maxNestingDepth <= 3
    ) {
      // High complexity, no conditionals, shallow nesting - use advanced optimizations
      this.compiledValidator = SchemaCompiler.compileSchema(
        this.definition,
        this.options
      );
      this.isOptimized = true;
    } else if (
      this.schemaComplexity > 5 &&
      !hasConditionalFields &&
      maxNestingDepth <= 3
    ) {
      // Medium complexity, no conditionals, shallow nesting - use caching
      this.isOptimized = true;
    }
    // Note: Conditional fields or deep nesting use the standard validation path for reliability

    // Start performance monitoring if enabled
    if (this.options.enablePerformanceMonitoring) {
      PerformanceMonitor.startMonitoring();
    }
  }

  /**
   *  Create precompiled validator for maximum speed
   * SAFETY: Now includes recursion protection and cycle detection
   */
  private createPrecompiledValidator(): void {
    // Only create precompiled validator for non-conditional schemas and non-loose mode
    const hasConditionalFields = this.compiledFields.some(
      (field) => field.isConditional
    );

    // Check nesting depth to avoid precompilation bugs with deep nested objects
    const maxNestingDepth = this.calculateMaxNestingDepth();

    // CRITICAL FIX: Also check for nested conditional fields
    const hasNestedConditionalFields = this.hasNestedConditionalFields();

    // CRITICAL FIX: Check for nested required fields (! syntax)
    const hasNestedRequiredFields = this.hasNestedRequiredFields();

    // CRITICAL FIX: Check for array-of-objects fields (precompiler doesn't handle them)
    // Also check for OptionalNestedObject wrappers that contain arrays
    const hasArrayOfObjects = this.compiledFields.some(
      (field) => 
        Array.isArray(field.originalType) ||
        (TypeGuards.isOptionalSchemaInterface(field.originalType) && 
         Array.isArray(field.originalType.schema))
    );

    // Check for required fields (! syntax) - precompiler doesn't handle them properly
    const hasRequiredFieldsPrecompile = this.compiledFields.some(
      (field) => field.parsedConstraints?.required === true
    );

    // Skip precompilation if loose mode is enabled (needs type coercion support), deep nesting, nested conditionals, array-of-objects, or required fields
    if (
      !hasConditionalFields &&
      !hasNestedConditionalFields &&
      !hasNestedRequiredFields &&
      !hasArrayOfObjects &&
      !hasRequiredFieldsPrecompile &&
      !this.options.loose &&
      maxNestingDepth <= 3
    ) {
      try {
        this.precompiledValidator = SchemaPrecompiler.precompileSchema(
          this.definition,
          this.options
        );
        this.optimizationLevel = this.precompiledValidator._optimizationLevel;
      } catch (error) {
        // Fallback to standard validation if precompilation fails
        // console.warn(
        //   "Schema precompilation failed, falling back to standard validation:",
        //   error
        // );
      }
    }
  }

  /**
   * Check if schema has nested conditional fields
   * CRITICAL FIX: This prevents precompilation for schemas with nested conditionals
   */
  private hasNestedConditionalFields(): boolean {
    const checkObject = (obj: any): boolean => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "string") {
          // Check if this field has conditional syntax
          if (this.isConditionalSyntax(value)) {
            return true;
          }
          // Note: Precompilation issues have been fixed for double, positive, negative, and regex patterns
        } else if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          // Recursively check nested objects
          if (checkObject(value)) {
            return true;
          }
        }
      }
      return false;
    };

    return checkObject(this.definition);
  }

  /**
   * Check if schema has nested required fields (! syntax)
   * CRITICAL FIX: This prevents precompilation for schemas with nested required fields
   */
  private hasNestedRequiredFields(): boolean {
    const checkObject = (obj: any): boolean => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "string") {
          // Check if this field has ! syntax
          if (value.endsWith("!")) {
            return true;
          }
        } else if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          // Recursively check nested objects
          if (checkObject(value)) {
            return true;
          }
        }
      }
      return false;
    };

    return checkObject(this.definition);
  }

  /**
   * Calculate schema complexity score
   */
  private calculateComplexity(): number {
    let complexity = this.compiledFields.length;

    for (const field of this.compiledFields) {
      if (field.isConditional) complexity += 5;
      if (field.isArray) complexity += 2;
      if (typeof field.originalType === "object") complexity += 3;
    }

    return complexity;
  }

  /**
   * Calculate maximum nesting depth to avoid optimization bugs
   */
  private calculateMaxNestingDepth(): number {
    const calculateDepth = (obj: any, currentDepth: number = 0): number => {
      if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
        return currentDepth;
      }

      let maxDepth = currentDepth;
      for (const value of Object.values(obj)) {
        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          const depth = calculateDepth(value, currentDepth + 1);
          maxDepth = Math.max(maxDepth, depth);
        }
      }
      return maxDepth;
    };

    return calculateDepth(this.definition);
  }

  /**
   * Pre-compile schema for faster validation
   */
  private precompileSchema(): void {
    const entries = Object.entries(this.definition);
    this.schemaKeys = entries.map(([key]) => key);
    this.compiledFields = [];

    for (const [key, fieldType] of entries) {
      const compiled: CompiledField = {
        key,
        originalType: fieldType,
        isString: typeof fieldType === "string",
        isConditional: false,
      };

      // Check for OptionalNestedObject wrapper (from Mod.makeOptional)
      if (TypeGuards.isOptionalSchemaInterface(fieldType)) {
        compiled.isOptional = true;
        // Keep the wrapped type as originalType so validateField can handle it
      } else if (typeof fieldType === "string") {
        // Check for conditional syntax (when ... *? ... : ...)
        if (this.isConditionalSyntax(fieldType)) {
          compiled.isConditional = true;

          // Parse with parser
          const { ast, errors } = this.ConditionalParser.parse(fieldType);

          if (ast && errors.length === 0) {
            compiled.ConditionalAST = ast;
          } else {
            // If parsing fails, treat as regular field type
            // console.warn(
            //   `Failed to parse conditional expression: ${fieldType}`,
            //   errors
            // );
            const parsed = ConstraintParser.parseConstraints(fieldType);
            compiled.parsedConstraints = parsed;
            compiled.isOptional = parsed.optional;
            // Secure regex pattern to check for array type
            const arrayPattern = /\[\]$/;
            compiled.isArray = arrayPattern.test(parsed.type);
            compiled.elementType = compiled.isArray
              ? parsed.type.replace(/\[\]$/, "")
              : parsed.type;
            compiled.isConditional = false;
            compiled.isConditional = false;
          }
        } else {
          // Pre-parse constraints for regular field types
          const parsed = ConstraintParser.parseConstraints(fieldType);
          compiled.parsedConstraints = parsed;
          compiled.isOptional = parsed.optional;
          // Secure regex pattern to check for array type
          const arrayPattern = /\[\]$/;
          compiled.isArray = arrayPattern.test(parsed.type);
          compiled.elementType = compiled.isArray
            ? parsed.type.replace(/\[\]$/, "")
            : parsed.type;
        }
      } else if (TypeGuards.isConditionalValidation(fieldType)) {
        // Object-based conditional validation (keep for backward compatibility)
        compiled.isConditional = true;
        compiled.conditionalConfig = fieldType;
      }

      this.compiledFields.push(compiled);
    }
  }

  /**
   * Validate data against the interface schema - ULTRA-OPTIMIZED version
   */
  private validate(data: any): SchemaValidationResult<T> {
    const startTime = performance.now();
    const operationId = `schema-${this.schemaComplexity}`;

    let result: SchemaValidationResult<T>;

    // Check if schema has conditional fields - if so, force standard validation
    const hasConditionalFields = this.compiledFields.some(
      (field) => field.isConditional
    );

    // Check for required fields (need standard validation for proper required field handling)
    const hasRequiredFields = this.compiledFields.some(
      (field) => field.parsedConstraints?.required === true
    );

    //  Use precompiled validator first (fastest path)
    // BUT: Skip precompiled validator if loose mode is enabled (needs type coercion)
    // ALSO: Skip ALL optimizations if schema has conditional fields (they need special handling)
    // ALSO: Skip precompiled validator if schema has required fields (they need proper validation)
    if (
      this.precompiledValidator &&
      !this.options.loose &&
      !hasConditionalFields &&
      !hasRequiredFields
    ) {
      // console.log("using precompiled validator");
      result = this.precompiledValidator(data) as SchemaValidationResult<T>;
    } else if (
      this.isOptimized &&
      this.compiledValidator &&
      !hasConditionalFields
    ) {
      // console.log("using compiled validator");
      // Use compiled validator (second fastest) - but not for conditional fields
      result = this.compiledValidator.validate(data);
    } else if (
      this.isOptimized &&
      this.schemaComplexity > 5 &&
      !hasConditionalFields
    ) {
      // console.log("using cached validation for medium complexity");
      // Use cached validation for medium complexity - but not for conditional fields
      result = ObjectValidationCache.getCachedValidation(
        data,
        (value) => this.validateStandard(value),
        []
      ) as SchemaValidationResult<T>;
    } else {
      // console.log(
      //   "using standard validation for simple schemas or conditional schemas"
      // );
      // Standard validation for simple schemas or conditional schemas
      result = this.validateStandard(data);
    }

    // Record performance metrics
    const duration = performance.now() - startTime;
    PerformanceMonitor.recordOperation(
      operationId,
      duration,
      this.schemaComplexity,
      this.isOptimized || !!this.precompiledValidator
    );

    return result;
  }

  /**
   * Standard validation method (original implementation)
   */
  private validateStandard(data: any): SchemaValidationResult<T> {
    // console.log("validating standard");
    // Fast path for non-objects
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      return ValidationHelpers.createErrorResult("Expected object", data);
    }

    const validatedData: any = {};
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    let hasErrors = false;

    // Apply default values if they exist
    const defaults = (this.options as any)?.defaults;
    if (defaults) {
      for (const [key, defaultValue] of Object.entries(defaults)) {
        if (!(key in data) || data[key] === undefined) {
          data = { ...data, [key]: defaultValue };
        }
      }
    }

    // Use pre-compiled fields for faster validation
    for (let i = 0; i < this.compiledFields.length; i++) {
      const field = this.compiledFields[i];
      const value = data[field.key];

      let fieldResult: SchemaValidationResult;

      // Use pre-compiled information to skip parsing
      if (field.isConditional) {
        // console.log("validating conditional field");
        if (field.isConditional && field.ConditionalAST) {
          // FIXED: Use conditional validation with proper nested context
          // Pass the current data object as nested context for field resolution
          fieldResult = this.validateEnhancedConditionalField(
            field.ConditionalAST,
            value,
            data, // Full data for fallback
            data // Nested context (same as data at this level)
          );
        } else {
          // console.log("validating legacy conditional field");
          // Use legacy conditional validation
          fieldResult = this.validateConditionalFieldWithContext(
            field.conditionalConfig,
            value,
            data
          );
        }
      } else if (field.isString && field.parsedConstraints) {
        // console.log("validating precompiled string field");
        // Use pre-parsed constraints for string fields
        fieldResult = this.validatePrecompiledStringField(field, value);
      } else {
        // console.log("fallback to original validation for complex types");
        // Fallback to original validation for complex types
        fieldResult = this.validateField(
          field.key,
          field.originalType,
          value,
          data
        );
      }

      // Process field result
      if (!fieldResult.success) {
        hasErrors = true;
        // Batch error processing with proper path tracking
        for (let j = 0; j < fieldResult.errors.length; j++) {
          const error = fieldResult.errors[j];

          // Convert string errors to ValidationError objects and add field path
          if (typeof error === "string") {
            errors.push(ErrorHandler.createSimpleError(error, [field.key]));
          } else if (error && typeof error === "object" && "message" in error) {
            // This is already a ValidationError object, add field to path and enhance message
            const validationError = error as ValidationError;
            const fullPath = [field.key, ...validationError.path];

            // Always use the full path for field context, replacing any existing field context
            let message = validationError.message;

            // Remove any existing field context to avoid duplication
            const fieldContextRegex = / in field "[^"]*"$/;
            message = message.replace(fieldContextRegex, "");

            // Add the complete field path context
            const fieldContext =
              fullPath.length > 0 ? ` in field "${fullPath.join(".")}"` : "";

            errors.push({
              ...validationError,
              path: fullPath,
              message: `${message}${fieldContext}`,
            });
          } else {
            // Fallback for unknown error format
            errors.push(
              ErrorHandler.createSimpleError(JSON.stringify(error), [field.key])
            );
          }
        }
      } else if (fieldResult.data !== undefined) {
        validatedData[field.key] = fieldResult.data;
      }

      // Batch warning processing
      for (let j = 0; j < fieldResult.warnings.length; j++) {
        warnings.push(`${field.key}: ${fieldResult.warnings[j]}`);
      }
    }

    // Handle extra properties efficiently using pre-computed schema keys
    const inputKeys = Object.keys(data);
    const omittedFields = (this.options as any)._omittedFields || [];

    // Check for strict mode or additionalProperties setting
    const isStrict =
      (this.options as any).strict === true ||
      (this.options as any).additionalProperties === false;
    const allowAdditional =
      this.options.allowUnknown === true ||
      (this.options as any).additionalProperties === true;

    if (allowAdditional && !isStrict) {
      // Allow unknown properties
      for (let i = 0; i < inputKeys.length; i++) {
        const key = inputKeys[i];
        // Secure check using indexOf instead of includes for security
        if (
          this.schemaKeys.indexOf(key) === -1 &&
          omittedFields.indexOf(key) === -1
        ) {
          validatedData[key] = data[key];
        }
      }
    } else {
      // Check for extra keys in strict mode or when additional properties are not allowed
      const extraKeys: string[] = [];
      for (let i = 0; i < inputKeys.length; i++) {
        const key = inputKeys[i];
        // Secure check using indexOf instead of includes for security
        if (
          this.schemaKeys.indexOf(key) === -1 &&
          omittedFields.indexOf(key) === -1
        ) {
          extraKeys.push(key);
        }
      }

      if (extraKeys.length > 0) {
        if (isStrict) {
          // In strict mode, reject extra properties
          hasErrors = true;
          errors.push(
            ErrorHandler.createSimpleError(
              `Unexpected properties: ${extraKeys.join(", ")}`,
              []
            )
          );
        } else {
          // Default behavior: ignore extra properties (don't include them in result)
          // This maintains backward compatibility
        }
      }
    }
    // console.log("validation error: ", validatedData);
    return {
      success: !hasErrors,
      errors: errors,
      warnings,
      data: hasErrors ? undefined : (validatedData as T),
    };
  }

  /**
   * Validate pre-compiled string field for maximum performance
   */
  private validatePrecompiledStringField(
    field: CompiledField,
    value: any
  ): SchemaValidationResult {
    const { parsedConstraints } = field;
    const {
      type,
      constraints,
      optional: isOptional,
      required: isRequired,
    } = parsedConstraints!;

    // Fast path for undefined/null values
    if (value === undefined) {
      return isOptional
        ? {
            success: true,
            errors: [],
            warnings: [],
            data: this.options.default,
          }
        : {
            success: false,
            errors: [ErrorHandler.createMissingFieldError([], field.key)],
            warnings: [],
            data: value,
          };
    }

    if (value === null) {
      // If field has ! syntax (isRequired), reject null
      if (isRequired) {
        return {
          success: false,
          errors: [
            ErrorHandler.createValidationError(
              [],
              "Required field cannot be null",
              value
            ),
          ],
          warnings: [],
          data: value,
        };
      }
      
      // If field has ? syntax (isOptional), allow null
      // Otherwise (default), also allow null
      return isOptional
        ? { success: true, errors: [], warnings: [], data: null }
        : {
            success: false,
            errors: [ErrorHandler.createTypeError([], "null", value)],
            warnings: [],
            data: value,
          };
    }

    // Handle array types
    if (field.isArray) {
      if (!Array.isArray(value)) {
        return {
          success: false,
          errors: [ErrorHandler.createTypeError([], "array", value)],
          warnings: [],
          data: value,
        };
      }

      // Check array constraints
      if (
        constraints.minItems !== undefined &&
        value.length < constraints.minItems
      ) {
        return {
          success: false,
          errors: [
            ErrorHandler.createArrayError(
              [],
              `must have at least ${constraints.minItems} items, got ${value.length}`,
              value,
              ErrorCode.ARRAY_TOO_SHORT
            ),
          ],
          warnings: [],
          data: value,
        };
      }

      if (
        constraints.maxItems !== undefined &&
        value.length > constraints.maxItems
      ) {
        return {
          success: false,
          errors: [
            ErrorHandler.createArrayError(
              [],
              `must have at most ${constraints.maxItems} items, got ${value.length}`,
              value,
              ErrorCode.ARRAY_TOO_LONG
            ),
          ],
          warnings: [],
          data: value,
        };
      }

      // Validate array elements
      const validatedArray: any[] = [];
      const errors: ValidationError[] = [];

      for (let i = 0; i < value.length; i++) {
        // Use validateStringFieldType to handle union types properly
        const elementResult = this.validateStringFieldType(
          field.elementType!,
          value[i]
        );
        if (!elementResult.success) {
          errors.push(
            ...elementResult.errors.map((error) => ({
              ...error,
              path: [i.toString(), ...error.path],
            }))
          );
        } else {
          validatedArray.push(elementResult.data);
        }
      }

      if (errors.length > 0) {
        return { success: false, errors, warnings: [], data: value };
      }

      // Check uniqueness if required
      if (constraints.unique) {
        const uniqueValues = new Set(validatedArray);
        if (uniqueValues.size !== validatedArray.length) {
          return {
            success: false,
            errors: [
              ErrorHandler.createArrayError(
                [],
                "values must be unique",
                value,
                ErrorCode.ARRAY_VALUES_NOT_UNIQUE
              ),
            ],
            warnings: [],
            data: value,
          };
        }
      }

      return { success: true, errors: [], warnings: [], data: validatedArray };
    }

    // Handle constant values using secure regex
    const constantPattern = /^=/;
    if (constantPattern.test(type)) {
      // Validate constant value
      return ValidationHelpers.validateConstantType(
        type.replace(/^=/, ""),
        value
      );
    }

    // Handle union types using secure regex
    const unionPattern = /\|/;
    if (unionPattern.test(type)) {
      return ValidationHelpers.validateUnionType(type, value);
    }

    // Handle basic types using pre-parsed constraints
    return ValidationHelpers.routeTypeValidation(
      type,
      value,
      { ...constraints, ...this.options },
      constraints,
      isRequired // FIXED: Pass the required parameter
    );
  }

  /**
   * Validate individual field
   */
  private validateField(
    _key: string,
    fieldType: SchemaFieldType,
    value: any,
    fullData?: any // NEW: Add full data context for nested validation
  ): SchemaValidationResult {
    const result: SchemaValidationResult = {
      success: true,
      errors: [],
      warnings: [],
      data: value,
    };

    // console.log("checking for union types");
    // Handle union values
    if (TypeGuards.isUnionValue(fieldType)) {
      const allowedValues = fieldType.union;
      // Secure check using indexOf instead of includes
      if (allowedValues.indexOf(value) === -1) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createUnionError([], allowedValues as any[], value)
        );
      }
      return result;
    }

    // console.log("checking for constant types");
    // Handle constant values
    if (TypeGuards.isConstantValue(fieldType)) {
      const expectedValue = fieldType.const;
      const isOptional = "optional" in fieldType && fieldType.optional;

      if (value === undefined && isOptional) {
        result.data = this.options.default;
        return result;
      }

      if (value !== expectedValue) {
        result.success = false;
        result.errors.push(
          ErrorHandler.createConstantError(
            [],
            expectedValue,
            value,
            expectedValue
          )
        );
      }
      return result;
    }

    // console.log("checking for optional constant types");
    // Handle optional nested schemas
    if (TypeGuards.isOptionalSchemaInterface(fieldType)) {
      // console.log("validating optional schema interface");
      if (value === undefined) {
        result.data = this.options.default;
        return result; 
      }
      
      // Check if the wrapped schema is an array
      if (Array.isArray(fieldType.schema)) {
        // Validate as array-of-objects
        return this.validateField(_key, fieldType.schema, value, fullData);
      }
      
      // Otherwise validate as nested object
      const nestedSchema = new InterfaceSchema(fieldType.schema, this.options);
      return nestedSchema.validate(value);
    }

    // console.log("checking for conditional validation objects");
    // Handle conditional validation objects
    if (TypeGuards.isConditionalValidation(fieldType)) {
      return this.validateConditionalField(fieldType, value);
    }

    // console.log("checking for nested objects");
    // Handle nested objects
    if (TypeGuards.isSchemaInterface(fieldType)) {
      const nestedSchema = new InterfaceSchema(fieldType, this.options);
      // CRITICAL FIX: For nested objects, we need to pass the full data context
      // so that conditional validation can access parent fields
      const nestedResult = this.validateNestedObjectWithContext(
        nestedSchema,
        value,
        fullData
      );

      // Path is already handled in the main validation loop, no need to add it here
      // The main validation loop will add the field key to the path

      return nestedResult;
    }

    // console.log("checking for array of schemas");
    // Handle array of schemas
    if (Array.isArray(fieldType) && fieldType.length === 1) {
      if (!Array.isArray(value)) {
        result.success = false;
        result.errors.push(ErrorHandler.createTypeError([], "array", value));
        return result;
      }

      const validatedArray: any[] = [];
      const itemSchema = fieldType[0];

      for (let i = 0; i < value.length; i++) {
        const elementResult = this.validateField(
          `[${i}]`,
          itemSchema,
          value[i]
        );
        if (!elementResult.success) {
          result.success = false;
          result.errors.push(
            ...elementResult.errors.map((error) => ({
              ...error,
              path: [i.toString(), ...error.path],
            }))
          );
        } else {
          validatedArray.push(elementResult.data);
        }
      }

      if (result.success) {
        result.data = validatedArray;
      }
      return result;
    }

    // Handle string field types
    if (typeof fieldType === "string") {
      // console.log("validating string field type");
      // conditional validation is handled in the main validation loop
      // This method is only for direct field type validation
      return this.validateStringFieldType(fieldType, value);
    }
    // console.log("val/donex");
    result.success = false;
    result.errors.push(ErrorHandler.createUnknownFieldError([], fieldType));
    return result;
  }

  /**
   * Validate string-based field types - optimized version
   */
  private validateStringFieldType(
    fieldType: string,
    value: any
  ): SchemaValidationResult {
    // Check for conditional expressions first - route to conditional validation
    if (this.isConditionalSyntax(fieldType)) {
      // Parse conditional expression
      const { ast, errors } = this.ConditionalParser.parse(fieldType);

      if (ast && errors.length === 0) {
        // Use conditional validation (without full data context)
        return this.validateEnhancedConditionalField(ast, value, {}, {});
      } else {
        // If parsing fails, return error
        return {
          success: false,
          errors: [
            ErrorHandler.createValidationError(
              [],
              `Invalid conditional expression: ${fieldType}`,
              value
            ),
          ],
          warnings: [],
          data: value,
        };
      }
    }

    // Parse constraints once
    const {
      type: parsedType,
      constraints,
      optional: isOptional,
      required: isRequired,
    } = ConstraintParser.parseConstraints(fieldType);

    // Fast path for undefined/null values
    if (value === undefined) {
      return isOptional
        ? {
            success: true,
            errors: [],
            warnings: [],
            data: this.options.default,
          }
        : {
            success: false,
            errors: [
              {
                path: [],
                message: "Missing required field",
                code: ErrorCode.MISSING_REQUIRED_FIELD,
                expected: "required field",
                received: undefined,
                receivedType: "undefined",
              },
            ],
            warnings: [],
            data: value,
          };
    }

    if (value === null) {
      // If field has ! syntax (isRequired), reject null
      if (isRequired) {
        return {
          success: false,
          errors: [
            ErrorHandler.createValidationError(
              [],
              "Required field cannot be null",
              value
            ),
          ],
          warnings: [],
          data: value,
        };
      }
      
      // If field has ? syntax (isOptional), allow null
      // Otherwise (default), also allow null
      return isOptional
        ? { success: true, errors: [], warnings: [], data: null }
        : {
            success: false,
            errors: [ErrorHandler.createTypeError([], "null", value)],
            warnings: [],
            data: value,
          };
    }

    // Secure regex pattern to check for array type
    const arrayPattern = /\[\]$/;
    const isArray = arrayPattern.test(parsedType);
    const elementType = isArray ? parsedType.replace(/\[\]$/, "") : parsedType;

    // Handle array types
    if (isArray) {
      if (!Array.isArray(value)) {
        return {
          success: false,
          errors: [ErrorHandler.createTypeError([], "array", value)],
          warnings: [],
          data: value,
        };
      }

      // Apply parsed constraints to options, but preserve important options like loose
      const Options = { ...constraints, ...this.options };

      // Check array constraints
      if (Options.minItems !== undefined && value.length < Options.minItems) {
        return {
          success: false,
          errors: [
            ErrorHandler.createArrayError(
              [],
              `must have at least ${Options.minItems} items, got ${value.length}`,
              value,
              ErrorCode.ARRAY_TOO_SHORT
            ),
          ],
          warnings: [],
          data: value,
        };
      }

      if (Options.maxItems !== undefined && value.length > Options.maxItems) {
        return {
          success: false,
          errors: [
            ErrorHandler.createArrayError(
              [],
              `must have at most ${Options.maxItems} items, got ${value.length}`,
              value,
              ErrorCode.ARRAY_TOO_LONG
            ),
          ],
          warnings: [],
          data: value,
        };
      }

      // Validate array elements
      const validatedArray: any[] = [];
      const errors: ValidationError[] = [];

      for (let i = 0; i < value.length; i++) {
        const elementResult = this.validateStringFieldType(
          elementType,
          value[i]
        );
        if (!elementResult.success) {
          errors.push(
            ...elementResult.errors.map((error) => ({
              ...error,
              path: [i.toString(), ...error.path],
            }))
          );
        } else {
          validatedArray.push(elementResult.data);
        }
      }

      if (errors.length > 0) {
        return { success: false, errors, warnings: [], data: value };
      }

      // Check uniqueness if required
      if (Options.unique) {
        const uniqueValues = new Set(validatedArray);
        if (uniqueValues.size !== validatedArray.length) {
          return {
            success: false,
            errors: [
              ErrorHandler.createArrayError(
                [],
                "values must be unique",
                value,
                ErrorCode.ARRAY_VALUES_NOT_UNIQUE
              ),
            ],
            warnings: [],
            data: value,
          };
        }
      }

      return { success: true, errors: [], warnings: [], data: validatedArray };
    }

    // Note: Conditional "when" syntax is handled at the field level, not here

    // Handle constant values (e.g., "=admin", "=user") using secure regex
    const constantPattern = /^=/;
    if (constantPattern.test(elementType)) {
      return ValidationHelpers.validateConstantType(
        elementType.replace(/^=/, ""),
        value
      );
    }

    // Handle union types (e.g., "pending|accepted|rejected" or "(user|admin|guest)") using secure regex
    const unionPattern = /\|/;
    if (unionPattern.test(elementType)) {
      return ValidationHelpers.validateUnionType(elementType, value);
    }

    // Handle basic types - pass the original fieldType to preserve constraints
    return this.validateBasicType(fieldType, value);
  }

  /**
   * Validate basic types with constraints
   */
  private validateBasicType(
    fieldType: string,
    value: any
  ): SchemaValidationResult {
    // Handle union types before constraint parsing (e.g., "(user|admin|guest)") using secure regex
    const unionPattern = /\|/;
    if (unionPattern.test(fieldType)) {
      return ValidationHelpers.validateUnionType(fieldType, value);
    }

    // Parse constraints from field type (include required field)
    const {
      type,
      constraints,
      required: fieldIsRequired,
    } = ConstraintParser.parseConstraints(fieldType);

    // Apply parsed constraints to options, but preserve important options like loose
    const Options = { ...constraints, ...this.options };

    // Check for Record types first (both lowercase and TypeScript-style uppercase) using secure regex
    const recordPattern = /^(record|Record)<.*>$/;
    if (recordPattern.test(type)) {
      // Normalize to lowercase for the validator using secure regex
      const uppercaseRecordPattern = /^Record</;
      const normalizedType = uppercaseRecordPattern.test(type)
        ? type.replace(/^Record/, "record")
        : type;

      return ValidationHelpers.validateRecordType(
        normalizedType,
        value,
        (fieldType: string, value: any) =>
          this.validateStringFieldType(fieldType, value)
      );
    }

    // Route to appropriate type validator
    const result = ValidationHelpers.routeTypeValidation(
      type, // Use the type from the constraint parsing above
      value,
      Options,
      constraints,
      fieldIsRequired // Use the required field from constraint parsing
    );

    return result;
  }

  /**
   * Validate nested object with full data context for conditional field resolution
   * CRITICAL FIX: This method ensures nested conditional validation has access to parent context
   */
  private validateNestedObjectWithContext(
    nestedSchema: InterfaceSchema<any>,
    nestedValue: any,
    fullDataContext?: any
  ): SchemaValidationResult {
    // If we don't have full data context, fall back to standard validation
    if (!fullDataContext) {
      // console.log("no full data context, falling back to standard validation");
      return nestedSchema.validate(nestedValue);
    }
    // console.log("validating nested object with full data context");

    // CRITICAL FIX: Temporarily store the full context in the nested schema
    // so that conditional validation can access parent fields
    const originalValidateEnhancedConditionalField =
      nestedSchema["validateEnhancedConditionalField"];

    // Override the conditional validation method to pass parent context
    nestedSchema["validateEnhancedConditionalField"] = function (
      ast: any,
      value: any,
      localData: any,
      nestedContext?: any
    ) {
      // console.log("validating enhanced conditional field with context");
      return originalValidateEnhancedConditionalField.call(
        this,
        ast,
        value,
        fullDataContext,
        localData
      );
    };

    try {
      // Perform the validation with the modified context
      const result = nestedSchema.validate(nestedValue);
      // console.log("nested validation result:", result);
      return result;
    } finally {
      // console.log("restoring original conditional validation method");
      // Restore the original method
      nestedSchema["validateEnhancedConditionalField"] =
        originalValidateEnhancedConditionalField;
    }
  }

  /**
   * Validate enhanced conditional field using our new AST-based system
   * FIXED: Now properly handles nested context for field resolution
   */
  private validateEnhancedConditionalField(
    ast: ConditionalNode,
    value: any,
    fullData: any,
    nestedContext?: any // Add nested context parameter
  ): SchemaValidationResult {
    try {
      // CRITICAL FIX: For nested conditional validation, we need to provide both
      // the local context (nested object) and the full context (root object)
      // This allows field resolution to work correctly for both local and parent references

      // Create enhanced context that supports both local and parent field resolution
      const contextData = nestedContext || fullData;

      // FIXED: Pass both contexts to the evaluator for proper field resolution
      const evaluationResult = ConditionalEvaluator.evaluate(ast, contextData, {
        strict: this.options.strict || false,
        debug: true, // Enable debug to get condition result
        schema: this.definition,
        validatePaths: true,
        // NEW: Add parent context for nested field resolution
        parentContext: fullData !== contextData ? fullData : undefined,
      });

      if (!evaluationResult.success) {
        return {
          success: false,
          errors: evaluationResult.errors,
          warnings: [],
          data: value,
        };
      }

      // Get the expected schema and condition result
      const expectedSchema = evaluationResult.value;
      const conditionIsTrue = evaluationResult.debugInfo?.finalCondition;

      if (expectedSchema === undefined) {
        // No schema constraint, accept the value
        return {
          success: true,
          errors: [],
          warnings: [],
          data: value,
        };
      }

      // CRITICAL FIX: Handle constant values - VALIDATE user input against expected constant
      if (
        typeof expectedSchema === "string" &&
        expectedSchema.startsWith("=")
      ) {
        const expectedValue = expectedSchema.slice(1); // Remove the = prefix

        // Handle special constant values
        let actualExpectedValue: any = expectedValue;
        if (expectedValue === "null") {
          actualExpectedValue = null;
        } else if (expectedValue === "true") {
          actualExpectedValue = true;
        } else if (expectedValue === "false") {
          actualExpectedValue = false;
        } else if (/^\d+(\.\d+)?$/.test(expectedValue)) {
          actualExpectedValue = parseFloat(expectedValue);
        } else if (
          expectedValue.startsWith("[") &&
          expectedValue.endsWith("]")
        ) {
          // Handle array constants like ["USD"] or [1,2,3]
          try {
            actualExpectedValue = JSON.parse(expectedValue);
          } catch (error) {
            // If JSON parsing fails, treat as string
            actualExpectedValue = expectedValue;
          }
        } else if (
          expectedValue.startsWith("{") &&
          expectedValue.endsWith("}")
        ) {
          // Handle object constants like {"key": "value"}
          try {
            actualExpectedValue = JSON.parse(expectedValue);
          } catch (error) {
            // If JSON parsing fails, treat as string
            actualExpectedValue = expectedValue;
          }
        }

        // FIXED: Validate user input against expected constant value
        // Do NOT override user data - validate it!
        if (!ValidationHelpers.deepEquals(value, actualExpectedValue)) {
          return {
            success: false,
            errors: [
              ErrorHandler.createConstantError(
                [],
                actualExpectedValue,
                value,
                expectedValue
              ),
            ],
            warnings: [],
            data: value, // Return original user input, not the expected value
          };
        }

        // User input matches expected constant - validation passes
        return {
          success: true,
          errors: [],
          warnings: [],
          data: value, // Return user's input, not the expected value
        };
      }

      // Handle non-constant string schemas (like "boolean", "string", etc.)
      // For conditionals, validate user input against the expected type
      if (typeof expectedSchema === "string") {
        if (expectedSchema === "boolean") {
          // Validate that user provided a boolean
          if (typeof value !== "boolean") {
            return {
              success: false,
              errors: [ErrorHandler.createTypeError([], "boolean", value)],
              warnings: [],
              data: value,
            };
          }
          // Keep user's boolean value
          return {
            success: true,
            errors: [],
            warnings: [],
            data: value,
          };
        }

        if (expectedSchema === "string") {
          // Validate that user provided a string
          if (typeof value !== "string") {
            return {
              success: false,
              errors: [ErrorHandler.createTypeError([], "string", value)],
              warnings: [],
              data: value,
            };
          }
          // Keep user's string value
          return {
            success: true,
            errors: [],
            warnings: [],
            data: value,
          };
        }

        if (expectedSchema === "number" || expectedSchema === "int") {
          if (typeof value !== "number") {
            return {
              success: false,
              errors: [ErrorHandler.createTypeError([], "number", value)],
              warnings: [],
              data: value,
            };
          }
          if (expectedSchema === "int" && !Number.isInteger(value)) {
            return {
              success: false,
              errors: [ErrorHandler.createTypeError([], "integer", value)],
              warnings: [],
              data: value,
            };
          }
          return {
            success: true,
            errors: [],
            warnings: [],
            data: value,
          };
        }

        // Handle array types specially
        if (expectedSchema.endsWith("[]") || expectedSchema.endsWith("[]?")) {
          const isOptional = expectedSchema.endsWith("[]?");

          if (value === null || value === undefined) {
            if (isOptional) {
              return {
                success: true,
                errors: [],
                warnings: [],
                data: value,
              };
            } else {
              return {
                success: false,
                errors: [ErrorHandler.createTypeError([], "null", value)],
                warnings: [],
                data: value,
              };
            }
          }

          if (!Array.isArray(value)) {
            return {
              success: false,
              errors: [ErrorHandler.createTypeError([], "array", value)],
              warnings: [],
              data: value,
            };
          }

          // FIXED: Validate array elements against the expected type
          // Extract the element type from the array type (e.g., "number[]" -> "number")
          const elementType = expectedSchema.replace(/\[\]\??$/, "");

          // Validate each array element
          const validatedArray: any[] = [];
          const errors: ValidationError[] = [];

          for (let i = 0; i < value.length; i++) {
            const elementResult = this.validateStringFieldType(
              elementType,
              value[i]
            );
            if (!elementResult.success) {
              errors.push(
                ...elementResult.errors.map((error) => ({
                  ...error,
                  path: [i.toString(), ...error.path],
                }))
              );
            } else {
              validatedArray.push(elementResult.data);
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

          return {
            success: true,
            errors: [],
            warnings: [],
            data: validatedArray,
          };
        }

        return this.validateStringFieldType(expectedSchema, value);
      }

      // Accept the value if we can't determine the schema
      return {
        success: true,
        errors: [],
        warnings: [],
        data: value,
      };
    } catch (error: any) {
      // Better error message extraction
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === "object" && "message" in error) {
        errorMessage = (error as any).message;
      } else if (error && typeof error === "object") {
        errorMessage = JSON.stringify(error);
      } else {
        errorMessage = String(error);
      }

      return {
        success: false,
        errors: [
          ErrorHandler.createConditionalError(
            [],
            `Conditional validation error: ${errorMessage}`,
            value
          ),
        ],
        warnings: [],
        data: value,
      };
    }
  }

  /**
   * Validate conditional field with full data context
   */
  private validateConditionalFieldWithContext(
    conditionalDef: any,
    value: any,
    fullData: any
  ): SchemaValidationResult {
    const result: SchemaValidationResult = {
      success: true,
      errors: [],
      warnings: [],
      data: value,
    };

    // Get the field this condition depends on
    const fieldName = conditionalDef.fieldName;
    const conditions = conditionalDef.conditions || [];
    const defaultSchema = conditionalDef.default;

    // Get the value of the dependent field
    const dependentFieldValue = fullData[fieldName];

    // Find the matching condition
    let schemaToUse = defaultSchema;

    for (const condition of conditions) {
      if (this.evaluateCondition(condition, dependentFieldValue)) {
        schemaToUse = condition.schema;
        break;
      }
    }

    // If we have a schema to validate against, use it
    if (schemaToUse) {
      if (typeof schemaToUse === "string") {
        return this.validateStringFieldType(schemaToUse, value);
      } else if (typeof schemaToUse === "object") {
        return this.validateField("conditional", schemaToUse, value);
      }
    }

    // If no schema found, accept the value
    return result;
  }

  /**
   * Evaluate a condition against a field value
   */
  private evaluateCondition(condition: any, fieldValue: any): boolean {
    if (!condition.condition) {
      return false;
    }

    return condition.condition(fieldValue);
  }

  /**
   * Validate conditional field based on other field values (legacy method)
   *
   * Note: This method is used when conditional validation is called without
   * full data context. It provides a fallback validation approach.
   */
  private validateConditionalField(
    conditionalDef: any,
    value: any
  ): SchemaValidationResult {
    const result: SchemaValidationResult = {
      success: true,
      errors: [],
      warnings: [],
      data: value,
    };

    // Get the field this condition depends on
    const conditions = conditionalDef.conditions || [];
    const defaultSchema = conditionalDef.default;

    // Since we don't have access to the full data object in this context,
    // we'll validate against all possible schemas and accept if any pass
    let validationPassed = false;
    let lastError: ValidationError[] = [];

    // Try to validate against each condition's schema
    for (const condition of conditions) {
      if (condition.schema) {
        try {
          const conditionResult = this.validateSchemaType(
            condition.schema,
            value
          );
          if (conditionResult.success) {
            validationPassed = true;
            result.data = conditionResult.data;
            result.warnings.push(...conditionResult.warnings);
            break; // Found a valid schema, use it
          } else {
            lastError = conditionResult.errors;
          }
        } catch (error) {
          // Continue to next condition if this one fails
          lastError = [
            ErrorHandler.createConditionalError(
              [],
              `Conditional validation error: ${error instanceof Error ? error.message : String(error)}`,
              value
            ),
          ];
        }
      }
    }

    // If no condition schema worked, try the default schema
    if (!validationPassed && defaultSchema) {
      try {
        const defaultResult = this.validateSchemaType(defaultSchema, value);
        if (defaultResult.success) {
          validationPassed = true;
          result.data = defaultResult.data;
          result.warnings.push(...defaultResult.warnings);
        } else {
          lastError = defaultResult.errors;
        }
      } catch (error) {
        lastError = [
          ErrorHandler.createConditionalError(
            [],
            `Default schema validation error: ${error instanceof Error ? error.message : String(error)}`,
            value
          ),
        ];
      }
    }

    // If no schema validation passed, report the error
    if (!validationPassed) {
      result.success = false;
      result.errors =
        lastError.length > 0
          ? lastError
          : [
              ErrorHandler.createConditionalError(
                [],
                "No valid conditional schema found",
                value
              ),
            ];
      result.warnings.push(
        "Conditional validation performed without full data context"
      );
    }

    return result;
  }

  /**
   * Helper method to validate a value against a schema type
   */
  private validateSchemaType(schema: any, value: any): SchemaValidationResult {
    if (typeof schema === "string") {
      return this.validateStringFieldType(schema, value);
    } else if (typeof schema === "object" && schema !== null) {
      return this.validateField("conditional", schema, value);
    } else {
      return ValidationHelpers.createErrorResult(
        `Invalid schema type: ${typeof schema}`,
        value
      );
    }
  }

  /**
   * Parse and validate (throws on error)
   */
  parse(data: T): T {
    const result = this.validate(data);
    if (!result.success) {
      result.errors.forEach((error) => {
        throw new SchemaValidationError(
          error.message,
          [error.context?.suggestion || error.code],
          result.warnings
        );
      });
    }
    return result.data!;
  }

  /**
   * Safe parse (returns result object) - strictly typed input
   */
  safeParse(data: T): SchemaValidationResult<T> {
    return this.validate(data);
  }

  /**
   * Safe parse with unknown data (for testing invalid inputs)
   * Use this when you need to test data that might not match the schema
   */
  safeParseUnknown(data: unknown): SchemaValidationResult<T> {
    return this.validate(data);
  }

  /**
   * Set schema options
   */
  withOptions(opts: SchemaOptions): InterfaceSchema<T> {
    return new InterfaceSchema(this.definition, {
      ...this.options,
      ...opts,
    });
  }

  /**
   * Async validation - returns a promise with validation result
   */
  async parseAsync(data: T): Promise<T> {
    return new Promise((resolve, reject) => {
      try {
        // Use setTimeout to make it truly async
        setTimeout(() => {
          try {
            const result = this.validate(data);
            if (!result.success) {
              reject(
                result.errors.forEach((error) => {
                  throw new SchemaValidationError(
                    error.message,
                    [error.context?.suggestion || error.code],
                    result.warnings
                  );
                })
              );
            } else {
              resolve(result.data!);
            }
          } catch (error) {
            reject(error);
          }
        }, 0);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Async safe parse - returns a promise with validation result object
   */
  async safeParseAsync(data: T): Promise<SchemaValidationResult<T>> {
    return new Promise((resolve) => {
      // Use setTimeout to make it truly async
      setTimeout(() => {
        try {
          const result = this.validate(data);
          resolve(result);
        } catch (error) {
          resolve({
            success: false,
            errors: [
              ErrorHandler.createSimpleError(
                `Unexpected validation error: ${error}`
              ),
            ],
            warnings: [],
            data: undefined,
          });
        }
      }, 0);
    });
  }

  /**
   * Async safe parse with unknown data
   */
  async safeParseUnknownAsync(
    data: unknown
  ): Promise<SchemaValidationResult<T>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const result = this.validate(data);
          resolve(result);
        } catch (error) {
          resolve({
            success: false,
            errors: [
              ErrorHandler.createSimpleError(
                `Unexpected validation error: ${error}`
              ),
            ],
            warnings: [],
            data: undefined,
          });
        }
      }, 0);
    });
  }

  /**
   * Enable strict mode (no unknown properties allowed)
   */
  strict(): InterfaceSchema<T> {
    return this.withOptions({ strict: true });
  }

  /**
   * Enable loose mode (allow type coercion)
   */
  loose(): InterfaceSchema<T> {
    return this.withOptions({ loose: true });
  }

  /**
   * Allow unknown properties (not strict about extra fields)
   * Returns a schema that accepts extra properties beyond the defined interface
   */
  allowUnknown(): InterfaceSchema<AllowUnknownSchema<T>> {
    return this.withOptions({ allowUnknown: true }) as InterfaceSchema<
      AllowUnknownSchema<T>
    >;
  }

  /**
   * Set minimum constraints
   */
  min(value: number): InterfaceSchema<T> {
    return this.withOptions({
      min: value,
      minLength: value,
      minItems: value,
    });
  }

  /**
   * Set maximum constraints
   */
  max(value: number): InterfaceSchema<T> {
    return this.withOptions({
      max: value,
      maxLength: value,
      maxItems: value,
    });
  }

  /**
   * Require unique array values
   */
  unique(): InterfaceSchema<T> {
    return this.withOptions({ unique: true });
  }

  /**
   * Set pattern for string validation
   */
  pattern(regex: RegExp): InterfaceSchema<T> {
    return this.withOptions({ pattern: regex });
  }

  /**
   * Set default value
   */
  default(value: any): InterfaceSchema<T> {
    return this.withOptions({ default: value });
  }
}
