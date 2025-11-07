/**
 * Unified TypeScript Type Inference System
 *
 * Combines core schema type inference with advanced conditional analysis.
 * This is the single source of truth for all TypeScript type operations.
 */

import {
  ConditionalNode,
  FieldAccessNode,
  ComparisonNode,
  MethodCallNode,
  TokenType,
} from "../conditional/types/ConditionalTypes";
import { ASTWalker, ASTVisitor } from "../conditional/parser/ConditionalAST";
import {
  ConstantValue,
  OptionalConstantValue,
  OptionalSchemaInterface,
  UnionValue,
} from "../../../../types/SchemaValidator.type";

// ============================================================================
// CORE TYPE SYSTEM - Unified from types/interface.type.ts
// ============================================================================

/**
 * Core type mapping for basic field types
 */
export type CoreTypeMap = {
  // Basic types
  string: string;
  number: number;
  boolean: boolean;
  date: Date;
  any: any;

  // String formats
  email: string;
  url: string;
  uuid: string;
  phone: string;
  slug: string;
  username: string;

  // Number types
  int: number;
  integer: number;
  positive: number;
  negative: number;
  float: number;
  double: number;

  // Special types
  unknown: unknown;
  void: undefined;
  null: null;
  undefined: undefined;
};

/**
 * Extract base type from field type string (removes constraints and modifiers)
 */
export type ExtractBaseType<T extends string> =
  T extends `${infer Base}(${string})`
    ? Base
    : T extends `${infer Base}?`
      ? Base
      : T extends `${infer Base}[]`
        ? Base
        : T extends `${infer Base}[]?`
          ? Base
          : T extends `${infer Base}!`
            ? Base
            : // Handle parentheses around union types like "(web | test | ok)?"
              T extends `(${infer Content})?`
              ? Content
              : T extends `(${infer Content})`
                ? Content
                : T;

/**
 * Check if field type is optional
 */
export type IsOptional<T extends string> = T extends `${string}?`
  ? true
  : false;

/**
 * Check if field type is required (non-empty/non-zero)
 */
export type IsRequired<T extends string> = T extends `${string}!`
  ? true
  : false;

/**
 * Check if field type is an array
 */
export type IsArray<T extends string> = T extends `${string}[]` | `${string}[]?`
  ? true
  : false;

/**
 * Extract element type from array type, handling parentheses
 */
export type ExtractElementType<T extends string> =
  T extends `${infer Element}[]`
    ? Element extends `(${infer UnionContent})`
      ? UnionContent
      : Element
    : T extends `${infer Element}[]?`
      ? Element extends `(${infer UnionContent})`
        ? UnionContent
        : Element
      : T;

/**
 * Map field type string to TypeScript type
 */
export type MapFieldType<T extends string> =
  // Handle arrays first
  IsArray<T> extends true
    ? Array<MapFieldType<ExtractElementType<T>>>
    : // Handle record types (record<K, V> or Record<K, V>)
      T extends `record<${infer K}, ${infer V}>`
      ? Record<
          MapFieldType<K> extends string | number | symbol
            ? MapFieldType<K>
            : string,
          MapFieldType<V>
        >
      : T extends `Record<${infer K}, ${infer V}>`
        ? Record<
            MapFieldType<K> extends string | number | symbol
              ? MapFieldType<K>
              : string,
            MapFieldType<V>
          >
        : // Handle conditional expressions (contains "when" and "*?")
          T extends `when ${string} *? ${string}`
          ? InferConditionalType<T>
          : // Handle union types (contains |) - check after removing optional and parentheses
            ExtractBaseType<T> extends `${string}|${string}`
            ? ParseUnionType<ExtractBaseType<T>>
            : // Handle constant types (starts with =)
              T extends `=${infer Value}?`
              ? Value | undefined
              : T extends `=${infer Value}`
                ? Value
                : // Handle core types
                  ExtractBaseType<T> extends keyof CoreTypeMap
                  ? CoreTypeMap[ExtractBaseType<T>]
                  : // Fallback to any for unknown types
                    any;

/**
 * Utility type to trim whitespace from string literal types
 */
export type Trim<T extends string> = T extends ` ${infer Rest}`
  ? Trim<Rest>
  : T extends `${infer Rest} `
    ? Trim<Rest>
    : T;

/**
 * Parse union type string into union of literal types
 */
export type ParseUnionType<T extends string> =
  // First handle parentheses if present - trim the content inside
  T extends `(${infer Content})`
    ? ParseUnionType<Trim<Content>>
    : // Then parse the union
      T extends `${infer First}|${infer Rest}`
      ? Trim<First> | ParseUnionType<Rest>
      : Trim<T>;

/**
 * Handle optional fields
 */
export type HandleOptional<T, IsOpt extends boolean> = IsOpt extends true
  ? T | undefined
  : T;

/**
 * Infer type for a single field
 */
export type InferFieldType<T> = T extends string
  ? HandleOptional<MapFieldType<T>, IsOptional<T>>
  : T extends ConstantValue
    ? T["const"]
    : T extends OptionalConstantValue
      ? T["const"] | undefined
      : T extends UnionValue<infer U> & { optional: true }
        ? U[number] | undefined
        : T extends UnionValue<infer U>
          ? U[number]
          : T extends OptionalSchemaInterface
            ? InferSchemaType<T["schema"]> | undefined
            : T extends readonly [infer U]
              ? Array<InferSchemaType<U>>
              : T extends Array<infer U>
                ? Array<InferSchemaType<U>>
                : T extends object
                  ? InferSchemaType<T>
                  : any;

/**
 * Main type inference for schema interfaces
 * FIXED: Handle optional properties correctly in nested objects 
 */
export type InferSchemaType<T> = {
  // Required properties (non-optional)
  [K in keyof T as T[K] extends string
    ? IsOptional<T[K]> extends true
      ? never
      : K
    : K]: InferFieldType<T[K]>;
} & {
  // Optional properties (with ? suffix)
  [K in keyof T as T[K] extends string
    ? IsOptional<T[K]> extends true
      ? K
      : never
    : never]?: InferFieldType<T[K]>;
};

// Additional utility types for Make.ts compatibility
export type InterfaceSchemaFromType<T> = {
  [K in keyof T]: T[K] extends string
    ? T[K]
    : T[K] extends number
      ? "number"
      : T[K] extends boolean
        ? "boolean"
        : T[K] extends Date
          ? "date"
          : T[K] extends any[]
            ? "array"
            : T[K] extends object
              ? InterfaceSchemaFromType<T[K]>
              : "any";
};

export type TypeToSchema<T> = InterfaceSchemaFromType<T>;

// ============================================================================
// CONDITIONAL TYPE ANALYSIS - Advanced conditional logic
// ============================================================================

// TypeScript utility types for conditional validation
export type ConditionalExpression<T> = string;

// Extract field paths from conditional expressions
export type ExtractFields<T extends string> =
  T extends `when ${infer Field} ${string}`
    ? Field extends `${infer F}.${infer Rest}`
      ? F | ExtractFields<`when ${Rest} ${string}`>
      : Field
    : never;

// Infer return type from conditional expression
export type InferConditionalType<
  T extends string,
  ThenType = unknown,
  ElseType = unknown,
> = T extends `${string} *? ${infer Then} : ${infer Else}`
  ? Then extends `=${infer ThenValue}`
    ? Else extends `=${infer ElseValue}`
      ? ThenValue | ElseValue
      : ThenType | ElseType
    : ThenType | ElseType
  : ThenType | ElseType;

// Validate field access against data type
export type ValidateFieldAccess<
  TData,
  TField extends string,
> = TField extends keyof TData
  ? TData[TField]
  : TField extends `${infer K}.${infer Rest}`
    ? K extends keyof TData
      ? TData[K] extends object
        ? ValidateFieldAccess<TData[K], Rest>
        : never
      : never
    : never;

// Type-safe conditional validation
export interface TypeSafeConditional<TData = any> {
  /**
   * Create a type-safe conditional expression
   */
  when<TField extends keyof TData>(
    field: TField
  ): ConditionalBuilder<TData, TData[TField]>;

  /**
   * Create a type-safe nested field conditional
   */
  whenField<TPath extends string>(
    path: TPath
  ): ConditionalBuilder<TData, ValidateFieldAccess<TData, TPath>>;
}

// Conditional builder for type-safe chaining
export interface ConditionalBuilder<TData, TFieldType> {
  /**
   * Equality comparison
   */
  equals<TValue extends TFieldType>(
    value: TValue
  ): ConditionalThen<TData, TFieldType>;

  /**
   * Inequality comparison
   */
  notEquals<TValue extends TFieldType>(
    value: TValue
  ): ConditionalThen<TData, TFieldType>;

  /**
   * Greater than comparison (for numbers)
   */
  greaterThan<TValue extends TFieldType>(
    value: TFieldType extends number ? TValue : never
  ): ConditionalThen<TData, TFieldType>;

  /**
   * Greater than or equal comparison (for numbers)
   */
  greaterEqual<TValue extends TFieldType>(
    value: TFieldType extends number ? TValue : never
  ): ConditionalThen<TData, TFieldType>;

  /**
   * Less than comparison (for numbers)
   */
  lessThan<TValue extends TFieldType>(
    value: TFieldType extends number ? TValue : never
  ): ConditionalThen<TData, TFieldType>;

  /**
   * Less than or equal comparison (for numbers)
   */
  lessEqual<TValue extends TFieldType>(
    value: TFieldType extends number ? TValue : never
  ): ConditionalThen<TData, TFieldType>;

  /**
   * Regex match (for strings)
   */
  matches<TPattern extends string>(
    pattern: TFieldType extends string ? TPattern : never
  ): ConditionalThen<TData, TFieldType>;

  /**
   * Array inclusion check
   */
  in<TValues extends readonly TFieldType[]>(
    ...values: TValues
  ): ConditionalThen<TData, TFieldType>;

  /**
   * Array exclusion check
   */
  notIn<TValues extends readonly TFieldType[]>(
    ...values: TValues
  ): ConditionalThen<TData, TFieldType>;

  /**
   * Existence check
   */
  exists(): ConditionalThen<TData, TFieldType>;

  /**
   * Non-existence check
   */
  notExists(): ConditionalThen<TData, TFieldType>;

  /**
   * Contains check (for strings and arrays)
   */
  contains<TValue>(
    value: TFieldType extends string
      ? string
      : TFieldType extends readonly (infer U)[]
        ? U
        : never
  ): ConditionalThen<TData, TFieldType>;

  /**
   * Starts with check (for strings)
   */
  startsWith<TPrefix extends string>(
    prefix: TFieldType extends string ? TPrefix : never
  ): ConditionalThen<TData, TFieldType>;

  /**
   * Ends with check (for strings)
   */
  endsWith<TSuffix extends string>(
    suffix: TFieldType extends string ? TSuffix : never
  ): ConditionalThen<TData, TFieldType>;

  /**
   * Between check (for numbers)
   */
  between<TMin extends TFieldType, TMax extends TFieldType>(
    min: TFieldType extends number ? TMin : never,
    max: TFieldType extends number ? TMax : never
  ): ConditionalThen<TData, TFieldType>;
}

// Then clause builder
export interface ConditionalThen<TData, TFieldType> {
  /**
   * Specify the value when condition is true
   */
  then<TThenType>(
    value: TThenType
  ): ConditionalElse<TData, TFieldType, TThenType>;

  /**
   * Specify a constant value when condition is true
   */
  thenConstant<TConstant extends string>(
    value: TConstant
  ): ConditionalElse<TData, TFieldType, TConstant>;

  /**
   * Specify an array when condition is true
   */
  thenArray<TArrayType>(
    value: TArrayType[]
  ): ConditionalElse<TData, TFieldType, TArrayType[]>;
}

// Else clause builder
export interface ConditionalElse<TData, _TFieldType, TThenType> {
  /**
   * Specify the value when condition is false
   */
  else<TElseType>(value: TElseType): ConditionalResult<TThenType | TElseType>;

  /**
   * Specify a constant value when condition is false
   */
  elseConstant<TConstant extends string>(
    value: TConstant
  ): ConditionalResult<TThenType | TConstant>;

  /**
   * Specify an array when condition is false
   */
  elseArray<TArrayType>(
    value: TArrayType[]
  ): ConditionalResult<TThenType | TArrayType[]>;

  /**
   * Nested conditional for else clause
   */
  elseWhen<TField extends keyof TData>(
    field: TField
  ): ConditionalBuilder<TData, TData[TField]>;
}

// Final conditional result
export interface ConditionalResult<TResultType> {
  /**
   * Get the conditional expression string
   */
  toString(): string;

  /**
   * Get the inferred result type
   */
  getType(): TResultType;

  /**
   * Validate the conditional against data
   */
  validate(data: any): {
    success: boolean;
    value?: TResultType;
    errors: string[];
  };
}

/**
 * Type inference analyzer for existing conditional expressions
 */
export class TypeInferenceAnalyzer {
  /**
   * Analyze a conditional AST and infer types
   */
  static analyzeConditional(ast: ConditionalNode): TypeInferenceResult {
    const analyzer = new TypeInferenceVisitor();
    return ASTWalker.walk(ast, analyzer);
  }

  /**
   * Extract field types from conditional expression
   */
  static extractFieldTypes(ast: ConditionalNode): Record<string, string> {
    const fieldTypes: Record<string, string> = {};

    const visitor: ASTVisitor<void> = {
      visitConditional: (node) => {
        ASTWalker.walk(node.condition, visitor);
        ASTWalker.walk(node.thenValue, visitor);
        if (node.elseValue) ASTWalker.walk(node.elseValue, visitor);
      },

      visitLogicalExpression: (node) => {
        ASTWalker.walk(node.left, visitor);
        ASTWalker.walk(node.right, visitor);
      },

      visitComparison: (node) => {
        const fieldPath = node.left.path.join(".");
        const valueType = this.inferTypeFromComparison(node);
        fieldTypes[fieldPath] = valueType;
      },

      visitMethodCall: (node) => {
        const fieldPath = node.field.path.join(".");
        const valueType = this.inferTypeFromMethod(node);
        fieldTypes[fieldPath] = valueType;
      },

      visitFieldAccess: () => {},
      visitLiteral: () => {},
      visitConstant: () => {},
      visitArray: () => {},
    };

    ASTWalker.walk(ast, visitor);
    return fieldTypes;
  }

  private static inferTypeFromComparison(node: ComparisonNode): string {
    switch (node.operator) {
      case TokenType.GREATER_THAN:
      case TokenType.GREATER_EQUAL:
      case TokenType.LESS_THAN:
      case TokenType.LESS_EQUAL:
        return "number";

      case TokenType.MATCHES:
        return "string";

      case TokenType.EQUALS:
      case TokenType.NOT_EQUALS:
        return node.right.dataType;

      default:
        return "unknown";
    }
  }

  private static inferTypeFromMethod(node: MethodCallNode): string {
    switch (node.method) {
      case TokenType.IN:
      case TokenType.NOT_IN:
        return node.arguments && node.arguments.length > 0
          ? node.arguments[0].dataType
          : "unknown";

      case TokenType.CONTAINS:
      case TokenType.STARTS_WITH:
      case TokenType.ENDS_WITH:
        return "string | array";

      case TokenType.BETWEEN:
        return "number";

      case TokenType.EXISTS:
      case TokenType.NOT_EXISTS:
        return "any";

      default:
        return "unknown";
    }
  }
}

// Type inference result
export interface TypeInferenceResult {
  fieldTypes: Record<string, string>;
  returnType: string;
  complexity: number;
  suggestions: string[];
}

// Type inference visitor
class TypeInferenceVisitor implements ASTVisitor<TypeInferenceResult> {
  visitConditional(node: ConditionalNode): TypeInferenceResult {
    const conditionResult = ASTWalker.walk(node.condition, this);
    const thenResult = ASTWalker.walk(node.thenValue, this);
    const elseResult = node.elseValue
      ? ASTWalker.walk(node.elseValue, this)
      : null;

    return {
      fieldTypes: {
        ...conditionResult.fieldTypes,
        ...thenResult.fieldTypes,
        ...(elseResult?.fieldTypes || {}),
      },
      returnType: this.combineTypes(
        thenResult.returnType,
        elseResult?.returnType || "undefined"
      ),
      complexity:
        conditionResult.complexity +
        thenResult.complexity +
        (elseResult?.complexity || 0) +
        1,
      suggestions: [
        ...conditionResult.suggestions,
        ...thenResult.suggestions,
        ...(elseResult?.suggestions || []),
      ],
    };
  }

  visitLogicalExpression(node: any): TypeInferenceResult {
    const leftResult = ASTWalker.walk(node.left, this);
    const rightResult = ASTWalker.walk(node.right, this);

    return {
      fieldTypes: { ...leftResult.fieldTypes, ...rightResult.fieldTypes },
      returnType: "boolean",
      complexity: leftResult.complexity + rightResult.complexity + 1,
      suggestions: [...leftResult.suggestions, ...rightResult.suggestions],
    };
  }

  visitComparison(node: any): TypeInferenceResult {
    const fieldPath = node.left.path.join(".");
    // Use public method or implement inline
    const fieldType = this.inferTypeFromComparison(node);

    return {
      fieldTypes: { [fieldPath]: fieldType },
      returnType: "boolean",
      complexity: 1,
      suggestions: [],
    };
  }

  visitMethodCall(node: any): TypeInferenceResult {
    const fieldPath = node.field.path.join(".");
    // Use public method or implement inline
    const fieldType = this.inferTypeFromMethod(node);

    return {
      fieldTypes: { [fieldPath]: fieldType },
      returnType: "boolean",
      complexity: 2,
      suggestions: [],
    };
  }

  private inferTypeFromComparison(node: any): string {
    // Simple type inference based on comparison
    if (node.right && node.right.dataType) {
      return node.right.dataType;
    }
    return "unknown";
  }

  private inferTypeFromMethod(node: any): string {
    // Simple type inference based on method
    switch (node.method) {
      case "in":
      case "not_in":
        return node.arguments && node.arguments.length > 0
          ? node.arguments[0].dataType
          : "unknown";
      case "contains":
      case "starts_with":
      case "ends_with":
        return "string | array";
      case "between":
        return "number";
      case "exists":
      case "not_exists":
        return "any";
      default:
        return "unknown";
    }
  }

  visitFieldAccess(): TypeInferenceResult {
    return {
      fieldTypes: {},
      returnType: "unknown",
      complexity: 0,
      suggestions: [],
    };
  }

  visitLiteral(node: any): TypeInferenceResult {
    return {
      fieldTypes: {},
      returnType: node.dataType,
      complexity: 0,
      suggestions: [],
    };
  }

  visitConstant(_node: any): TypeInferenceResult {
    return {
      fieldTypes: {},
      returnType: "string",
      complexity: 0,
      suggestions: [],
    };
  }

  visitArray(node: any): TypeInferenceResult {
    const elementType =
      node.elements.length > 0 ? node.elements[0].dataType : "unknown";
    return {
      fieldTypes: {},
      returnType: `${elementType}[]`,
      complexity: 0,
      suggestions: [],
    };
  }

  private combineTypes(type1: string, type2: string): string {
    if (type1 === type2) return type1;
    if (type1 === "undefined") return type2;
    if (type2 === "undefined") return type1;
    return `${type1} | ${type2}`;
  }
}
