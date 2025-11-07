/***************************************************************************
 *  Fortify Schema - TypeScript Interface-like Schema Validation
 *
 * @file index.ts
 * 
 * @author Nehonix
 * @license MIT
 *
 * Copyright (c) 2025 Nehonix Team. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 ****************************************************************************/

/**
 * Fortify Schema - TypeScript Interface-like Schema Validation
 *
 * A schema validation system with TypeScript interface-like syntax
 * that's incredibly easy to use and much safer than traditional schema libraries.
 *
 * @example Interface-based (Recommended)
 * ```typescript
 * import { Interface, Make, Mod } from 'fortify-schema';
 *
 * const UserSchema = Interface({
 *   id: "number",
 *   email: "email",
 *   name: "string",
 *   age: "number?",                        // Optional
 *   status: Make.union("active", "inactive"),
 *   role: Make.const("user")      // Safe constant
 * });
 *
 * // Transform schemas easily
 * const PublicUserSchema = Mod.omit(UserSchema, ["password"]);
 * const PartialUserSchema = Mod.partial(UserSchema);
 *
 * const result = UserSchema.safeParse(userData);
 * ``` 
 *
 * @example Traditional Fluent API
 * ```typescript
 * import { Schema } from 'fortify-schema';
 *
 * const UserSchema = Schema.object({
 *   id: Schema.number().int().positive(),
 *   email: Schema.string().email(),
 *   name: Schema.string().min(2).max(50)
 * });
 * ```
 */

// Main Interface-based API
export {
  Interface,
  Make,
  Mod,
  FieldTypes,
  QuickSchemas,
} from "./core/schema/mode/interfaces/Interface";

// Superior Performance Interface (Next Generation) - TODO: Implement these modules
// export {
//   Interface as SuperiorInterface,
//   LiveValidator,
//   ValidationError,
// } from "./core/performance/SuperiorInterface";
// export { HighPerformanceValidator } from "./core/performance/HighPerformanceValidator";
// export { OptimizedParser } from "./core/performance/OptimizedParser";
// export { PerformanceBenchmark } from "./core/performance/benchmark";

// Extensions (Advanced Features)
export {
  Smart,
  When,
  Live,
  Docs,
  Extensions,
  Quick,
  TypeScriptGenerator,
} from "./core/schema/extensions";

export { InterfaceSchema } from "./core/schema/mode/interfaces/InterfaceSchema";

// Performance and optimization
export { PerformanceMonitor } from "./core/schema/optimization/PerformanceMonitor";

// Type definitions
export type {
  // Interface-based types
  SchemaInterface,
  SchemaFieldType,
  ConstantValue,
  SchemaOptions,
  InferType,
} from "./core/schema/mode/interfaces/Interface";

export type {
  // Traditional API types
  SchemaValidationResult,
  StringSchemaOptions,
  NumberSchemaOptions,
  BooleanSchemaOptions,
  ArraySchemaOptions,
  ObjectSchemaOptions,
  SchemaType,
  SchemaConfig,
} from "./core/types/types";
