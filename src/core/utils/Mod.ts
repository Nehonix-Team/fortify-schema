import { InferSchemaType } from "../schema/mode/interfaces/Interface";
import { InterfaceSchema } from "../schema/mode/interfaces/InterfaceSchema";
import { SchemaInterface } from "../types/SchemaValidator.type";

/**
 * Interface for optional nested object wrapper
 */
interface OptionalNestedObject {
  schema: SchemaInterface;
  optional: true;
}

/**
 * Internal schema structure for type-safe access
 */
interface SchemaInternals {
  definition: SchemaInterface;
  options: Record<string, any>; // Using any here for flexibility with internal options
}

/**
 * Enhanced schema modification utilities - transform, combine, and manipulate schemas
 */
export class Mod {
  /**
   * Safely access schema internals with proper typing
   */
  private static getSchemaInternals<T>(
    schema: InterfaceSchema<T>
  ): SchemaInternals {
    return {
      definition: (schema as unknown as { definition: SchemaInterface })
        .definition,
      options:
        (schema as unknown as { options: Record<string, any> }).options || {},
    };
  }
  /**
   * Merge multiple schemas into a single schema
   * @example
   * ```typescript
   * const UserSchema = Interface({ id: "number", name: "string" });
   * const ProfileSchema = Interface({ bio: "string?", avatar: "url?" });
   *
   * const MergedSchema = Mod.merge(UserSchema, ProfileSchema);
   * // Result: { id: number, name: string, bio?: string, avatar?: string }
   * ```
   */
  static merge<T, U>(
    schema1: InterfaceSchema<T>,
    schema2: InterfaceSchema<U>
  ): InterfaceSchema<T & U> {
    const { definition: def1 } = this.getSchemaInternals(schema1);
    const { definition: def2 } = this.getSchemaInternals(schema2);

    const mergedDefinition: SchemaInterface = {
      ...def1,
      ...def2,
    };

    const { options: options1 } = this.getSchemaInternals(schema1);
    const { options: options2 } = this.getSchemaInternals(schema2);
    const mergedOptions = { ...options1, ...options2 };

    return new InterfaceSchema<T & U>(mergedDefinition, mergedOptions);
  }

  /**
   * Merge multiple schemas with conflict resolution
   * @example
   * ```typescript
   * const schema1 = Interface({ id: "number", name: "string" });
   * const schema2 = Interface({ id: "uuid", email: "email" });
   *
   * const merged = Mod.mergeDeep(schema1, schema2, "second"); // id becomes "uuid"
   * ```
   */
  static mergeDeep<T, U>(
    schema1: InterfaceSchema<T>,
    schema2: InterfaceSchema<U>,
    strategy: "first" | "second" | "merge" = "second"
  ): InterfaceSchema<T & U> {
    const def1 = (schema1 as any).definition as SchemaInterface;
    const def2 = (schema2 as any).definition as SchemaInterface;

    const mergedDefinition: SchemaInterface = { ...def1 };

    for (const [key, value] of Object.entries(def2)) {
      if (key in mergedDefinition) {
        switch (strategy) {
          case "first":
            // Keep first schema's value
            break;
          case "second":
            mergedDefinition[key] = value;
            break;
          case "merge":
            // Attempt to merge if both are objects
            if (
              typeof mergedDefinition[key] === "object" &&
              typeof value === "object"
            ) {
              mergedDefinition[key] = { ...mergedDefinition[key], ...value };
            } else {
              mergedDefinition[key] = value;
            }
            break;
        }
      } else {
        mergedDefinition[key] = value;
      }
    }

    const options1 = (schema1 as any).options || {};
    const options2 = (schema2 as any).options || {};
    const mergedOptions = { ...options1, ...options2 };

    return new InterfaceSchema<T & U>(mergedDefinition, mergedOptions);
  }

  /**
   * Pick specific fields from a schema
   */
  static pick<T, K extends keyof T>(
    schema: InterfaceSchema<T>,
    keys: K[]
  ): InterfaceSchema<Pick<T, K>> {
    const { definition, options } = this.getSchemaInternals(schema);

    const pickedDefinition: SchemaInterface = {};
    for (const key of keys) {
      const keyStr = key as string;
      if (keyStr in definition) {
        pickedDefinition[keyStr] = definition[keyStr];
      }
    }

    return new InterfaceSchema<Pick<T, K>>(pickedDefinition, options);
  }

  /**
   * Omit specific fields from a schema
   */
  static omit<T, K extends keyof T>(
    schema: InterfaceSchema<T>,
    keys: K[]
  ): InterfaceSchema<Omit<T, K>> {
    const { definition, options } = this.getSchemaInternals(schema);

    const omittedDefinition: SchemaInterface = { ...definition };
    for (const key of keys) {
      const keyStr = key as string;
      delete omittedDefinition[keyStr];
    }

    const newOptions = {
      ...options,
      _omittedFields: [
        ...(options._omittedFields || []),
        ...keys.map((k) => k as string),
      ],
    };

    return new InterfaceSchema<Omit<T, K>>(
      omittedDefinition,
      newOptions as any
    );
  }

  /**
   * Make all fields in a schema optional
   */
  static partial<T>(schema: InterfaceSchema<T>): InterfaceSchema<Partial<T>> {
    const definition = (schema as any).definition as SchemaInterface;
    const options = (schema as any).options || {};

    const partialDefinition: SchemaInterface = {};
    for (const [key, value] of Object.entries(definition)) {
      if (typeof value === "string" && !value.endsWith("?")) {
        partialDefinition[key] = value + "?";
      } else {
        partialDefinition[key] = value;
      }
    }

    return new InterfaceSchema<Partial<T>>(partialDefinition, options);
  }

  /**
   * Make all fields in a schema required
   */
  static required<T>(schema: InterfaceSchema<T>): InterfaceSchema<Required<T>> {
    const definition = (schema as any).definition as SchemaInterface;
    const options = (schema as any).options || {};

    const requiredDefinition: SchemaInterface = {};
    for (const [key, value] of Object.entries(definition)) {
      if (typeof value === "string" && value.endsWith("?")) {
        requiredDefinition[key] = value.slice(0, -1);
      } else {
        requiredDefinition[key] = value;
      }
    }

    return new InterfaceSchema<Required<T>>(requiredDefinition, options);
  }

  /**
   * Make specific fields optional in a schema without modifying field types
   *
   * This method allows you to selectively make certain fields optional while keeping
   * all other fields required. It's particularly useful when you want to create
   * flexible versions of strict schemas for different use cases (e.g., partial updates,
   * form validation, API endpoints with optional parameters).
   *
   * The method works with both primitive types and nested objects, properly handling
   * the optional nature at the validation level while maintaining type safety.
   *
   * @param schema - The source schema to modify
   * @param keys - Array of field names to make optional
   * @returns A new schema with specified fields made optional
   *
   * @example Making primitive fields optional
   * ```typescript
   * const UserSchema = Interface({
   *   id: "number",
   *   name: "string",
   *   email: "email",
   *   phone: "string"
   * });
   *
   * const FlexibleUserSchema = Mod.makeOptional(UserSchema, ["email", "phone"]);
   *
   * // Now accepts both:
   * FlexibleUserSchema.parse({ id: 1, name: "John" }); // ✅ email and phone optional
   * FlexibleUserSchema.parse({ id: 1, name: "John", email: "john@example.com" }); // ✅
   * ```
   *
   * @example Making nested objects optional
   * ```typescript
   * const ProfileSchema = Interface({
   *   id: "number",
   *   name: "string",
   *   preferences: {
   *     theme: "light|dark",
   *     notifications: "boolean",
   *     language: "en|es|fr"
   *   },
   *   settings: {
   *     privacy: "public|private",
   *     newsletter: "boolean"
   *   }
   * });
   *
   * const FlexibleProfileSchema = Mod.makeOptional(ProfileSchema, ["preferences", "settings"]);
   *
   * // Now accepts:
   * FlexibleProfileSchema.parse({ id: 1, name: "John" }); // ✅ nested objects optional
   * FlexibleProfileSchema.parse({
   *   id: 1,
   *   name: "John",
   *   preferences: { theme: "dark", notifications: true, language: "en" }
   * }); // ✅
   * ```
   *
   * @example Use case: API endpoints with optional parameters
   * ```typescript
   * const CreateUserSchema = Interface({
   *   name: "string",
   *   email: "email",
   *   password: "string",
   *   role: "admin|user|moderator",
   *   department: "string",
   *   startDate: "date"
   * });
   *
   * // For user registration (minimal required fields)
   * const RegisterSchema = Mod.makeOptional(CreateUserSchema, ["role", "department", "startDate"]);
   *
   * // For admin creation (all fields required)
   * const AdminCreateSchema = CreateUserSchema;
   *
   * // For profile updates (most fields optional)
   * const UpdateProfileSchema = Mod.makeOptional(CreateUserSchema, ["password", "role", "department", "startDate"]);
   * ```
   */
  static makeOptional<T, K extends keyof T>(
    schema: InterfaceSchema<T>,
    keys: K[]
  ): InterfaceSchema<Omit<T, K> & Partial<Pick<T, K>>> {
    const { definition, options } = this.getSchemaInternals(schema);

    // Create new definition with specified fields made optional
    const newDefinition: SchemaInterface = { ...definition };
    for (const key of keys) {
      const keyStr = key as string;
      if (keyStr in newDefinition) {
        const fieldType = newDefinition[keyStr];
        if (typeof fieldType === "string" && !fieldType.endsWith("?")) {
          newDefinition[keyStr] = fieldType + "?";
        } else if (Array.isArray(fieldType)) {
          // For arrays (including array-of-objects), mark as optional by wrapping
          // The validation system needs to check for undefined before validating array elements
          newDefinition[keyStr] = {
            schema: fieldType,
            optional: true,
          } as OptionalNestedObject;
        } else if (typeof fieldType === "object" && fieldType !== null) {
          // For nested objects, we need to wrap them in an optional schema interface
          // This tells the validation system that the entire nested object is optional
          newDefinition[keyStr] = {
            schema: fieldType,
            optional: true,
          } as OptionalNestedObject;
        }
      }
    }

    return new InterfaceSchema<Omit<T, K> & Partial<Pick<T, K>>>(
      newDefinition,
      options
    );
  }

  /**
   * Extend a schema with additional fields
   */
  static extend<T, U extends SchemaInterface>(
    schema: InterfaceSchema<T>,
    extension: U
  ): InterfaceSchema<T & InferSchemaType<U>> {
    const definition = (schema as any).definition as SchemaInterface;
    const options = (schema as any).options || {};

    const extendedDefinition: SchemaInterface = {
      ...definition,
      ...extension,
    };

    return new InterfaceSchema<T & InferSchemaType<U>>(
      extendedDefinition,
      options
    );
  }

  /**
   * Create a deep partial version of a schema (makes ALL fields optional recursively)
   *
   * Unlike the regular `partial()` method which only makes top-level fields optional,
   * `deepPartial()` recursively traverses the entire schema structure and makes every
   * field at every nesting level optional. This is particularly useful for update
   * operations, patch APIs, or form validation where users might only provide
   * partial data at any level of nesting.
   *
   * @param schema - The source schema to make deeply partial
   * @returns A new schema where all fields at all levels are optional
   *
   * @example Basic deep partial transformation
   * ```typescript
   * const UserSchema = Interface({
   *   id: "number",
   *   name: "string",
   *   profile: {
   *     bio: "string",
   *     avatar: "string",
   *     social: {
   *       twitter: "string",
   *       linkedin: "string"
   *     }
   *   }
   * });
   *
   * const DeepPartialSchema = Mod.deepPartial(UserSchema);
   *
   * // All of these are now valid:
   * DeepPartialSchema.parse({}); // ✅ Everything optional
   * DeepPartialSchema.parse({ id: 1 }); // ✅ Only id provided
   * DeepPartialSchema.parse({
   *   profile: {
   *     bio: "Developer"
   *   }
   * }); // ✅ Partial nested data
   * DeepPartialSchema.parse({
   *   profile: {
   *     social: {
   *       twitter: "@john"
   *     }
   *   }
   * }); // ✅ Deep nested partial data
   * ```
   *
   * @example Use case: API PATCH endpoints
   * ```typescript
   * const ArticleSchema = Interface({
   *   id: "number",
   *   title: "string",
   *   content: "string",
   *   metadata: {
   *     tags: "string[]",
   *     category: "string",
   *     seo: {
   *       title: "string",
   *       description: "string",
   *       keywords: "string[]"
   *     }
   *   },
   *   author: {
   *     id: "number",
   *     name: "string"
   *   }
   * });
   *
   * // For PATCH /articles/:id - allow partial updates at any level
   * const PatchArticleSchema = Mod.deepPartial(ArticleSchema);
   *
   * // Users can update just the SEO title:
   * PatchArticleSchema.parse({
   *   metadata: {
   *     seo: {
   *       title: "New SEO Title"
   *     }
   *   }
   * }); // ✅
   * ```
   *
   * @example Difference from regular partial()
   * ```typescript
   * const NestedSchema = Interface({
   *   user: {
   *     name: "string",
   *     email: "email"
   *   }
   * });
   *
   * const RegularPartial = Mod.partial(NestedSchema);
   * // Type: { user?: { name: string, email: string } }
   * // user is optional, but if provided, name and email are required
   *
   * const DeepPartial = Mod.deepPartial(NestedSchema);
   * // Type: { user?: { name?: string, email?: string } }
   * // user is optional, and if provided, name and email are also optional
   * ```
   */
  static deepPartial<T>(
    schema: InterfaceSchema<T>
  ): InterfaceSchema<DeepPartial<T>> {
    const definition = (schema as any).definition as SchemaInterface;
    const options = (schema as any).options || {};

    const deepPartialDefinition: SchemaInterface = {};

    for (const [key, value] of Object.entries(definition)) {
      if (typeof value === "object" && value !== null) {
        // Recursively make nested objects partial
        const nestedSchema = new InterfaceSchema(value as SchemaInterface, {});
        const partialNested = this.deepPartial(nestedSchema);
        // Make the nested object field optional by wrapping it
        deepPartialDefinition[key] = {
          schema: (partialNested as any).definition,
          optional: true,
        } as any;
      } else if (typeof value === "string" && !value.endsWith("?")) {
        deepPartialDefinition[key] = value + "?";
      } else {
        deepPartialDefinition[key] = value;
      }
    }

    return new InterfaceSchema<DeepPartial<T>>(deepPartialDefinition, options);
  }

  /**
   * Transform field types using a mapper function
   * @example
   * ```typescript
   * const UserSchema = Interface({ id: "number", name: "string" });
   * const StringifiedSchema = Mod.transform(UserSchema, (type) =>
   *   type.replace("number", "string")
   * );
   * // Result: { id: string, name: string }
   * ```
   */
  static transform<T>(
    schema: InterfaceSchema<T>,
    mapper: (fieldType: string, fieldName: string) => string
  ): InterfaceSchema<any> {
    const definition = (schema as any).definition as SchemaInterface;
    const options = (schema as any).options || {};

    const transformedDefinition: SchemaInterface = {};

    for (const [key, value] of Object.entries(definition)) {
      if (typeof value === "string") {
        transformedDefinition[key] = mapper(value, key);
      } else if (typeof value === "object" && value !== null) {
        // Recursively transform nested objects
        const nestedSchema = new InterfaceSchema(value as SchemaInterface, {});
        const transformedNested = this.transform(nestedSchema, mapper);
        transformedDefinition[key] = (transformedNested as any).definition;
      } else {
        transformedDefinition[key] = value;
      }
    }

    return new InterfaceSchema<any>(transformedDefinition, options);
  }

  /**
   * Rename fields in a schema
   * @example
   * ```typescript
   * const UserSchema = Interface({ user_id: "number", user_name: "string" });
   * const RenamedSchema = Mod.rename(UserSchema, {
   *   user_id: "id",
   *   user_name: "name"
   * });
   * // Result: { id: number, name: string }
   * ```
   */
  static rename<T>(
    schema: InterfaceSchema<T>,
    fieldMap: Record<string, string>
  ): InterfaceSchema<any> {
    const definition = (schema as any).definition as SchemaInterface;
    const options = (schema as any).options || {};

    const renamedDefinition: SchemaInterface = {};

    for (const [key, value] of Object.entries(definition)) {
      const newKey = fieldMap[key] || key;
      renamedDefinition[newKey] = value;
    }

    return new InterfaceSchema<any>(renamedDefinition, options);
  }

  /**
   * Create a schema with default values that are automatically applied during validation
   *
   * This method allows you to specify default values that will be automatically applied
   * to fields when they are missing or undefined in the input data. This is particularly
   * useful for API endpoints, form processing, and configuration objects where you want
   * to ensure certain fields always have sensible default values.
   *
   * Default values are applied during the validation process, so they don't modify the
   * original schema definition but are included in the validated output.
   *
   * @param schema - The source schema to add defaults to
   * @param defaultValues - Object mapping field names to their default values
   * @returns A new schema that applies default values during validation
   *
   * @example Basic default values
   * ```typescript
   * const UserSchema = Interface({
   *   id: "number",
   *   name: "string",
   *   role: "string?",
   *   active: "boolean?",
   *   createdAt: "date?"
   * });
   *
   * const UserWithDefaults = Mod.defaults(UserSchema, {
   *   role: "user",
   *   active: true,
   *   createdAt: new Date()
   * });
   *
   * const result = UserWithDefaults.parse({
   *   id: 1,
   *   name: "John Doe"
   *   // role, active, and createdAt will be filled with defaults
   * });
   *
   * console.log(result.data);
   * // {
   * //   id: 1,
   * //   name: "John Doe",
   * //   role: "user",
   * //   active: true,
   * //   createdAt: 2023-12-01T10:30:00.000Z
   * // }
   * ```
   *
   * @example API configuration with defaults
   * ```typescript
   * const ApiConfigSchema = Interface({
   *   host: "string",
   *   port: "number?",
   *   timeout: "number?",
   *   retries: "number?",
   *   ssl: "boolean?",
   *   compression: "boolean?"
   * });
   *
   * const ApiConfigWithDefaults = Mod.defaults(ApiConfigSchema, {
   *   port: 3000,
   *   timeout: 5000,
   *   retries: 3,
   *   ssl: false,
   *   compression: true
   * });
   *
   * // Users only need to provide the host
   * const config = ApiConfigWithDefaults.parse({
   *   host: "api.example.com"
   * });
   * // All other fields get sensible defaults
   * ```
   *
   * @example Form processing with defaults
   * ```typescript
   * const ProfileFormSchema = Interface({
   *   name: "string",
   *   email: "email",
   *   theme: "string?",
   *   notifications: "boolean?",
   *   language: "string?"
   * });
   *
   * const ProfileWithDefaults = Mod.defaults(ProfileFormSchema, {
   *   theme: "light",
   *   notifications: true,
   *   language: "en"
   * });
   *
   * // Form submissions get defaults for unchecked/unselected fields
   * const profile = ProfileWithDefaults.parse({
   *   name: "Jane Smith",
   *   email: "jane@example.com"
   *   // theme, notifications, language get defaults
   * });
   * ```
   *
   * @example Conditional defaults based on environment
   * ```typescript
   * const AppConfigSchema = Interface({
   *   environment: "development|staging|production",
   *   debug: "boolean?",
   *   logLevel: "string?",
   *   cacheEnabled: "boolean?"
   * });
   *
   * const isDevelopment = process.env.NODE_ENV === "development";
   *
   * const AppConfigWithDefaults = Mod.defaults(AppConfigSchema, {
   *   debug: isDevelopment,
   *   logLevel: isDevelopment ? "debug" : "info",
   *   cacheEnabled: !isDevelopment
   * });
   * ```
   */
  static defaults<T>(
    schema: InterfaceSchema<T>,
    defaultValues: Record<string, any>
  ): InterfaceSchema<T> {
    const definition = (schema as any).definition as SchemaInterface;
    const options = (schema as any).options || {};

    // Store default values in options for the validation system to use
    const defaultsOptions = {
      ...options,
      defaults: {
        ...((options as any).defaults || {}),
        ...defaultValues,
      },
    };

    return new InterfaceSchema<T>(definition, defaultsOptions);
  }

  /**
   * Create a strict version of a schema that rejects any additional properties
   *
   * By default, Fortify Schema ignores extra properties in the input data (they're
   * simply not included in the validated output). The `strict()` method changes this
   * behavior to actively reject any properties that aren't defined in the schema,
   * making validation fail with an error.
   *
   * This is useful for APIs where you want to ensure clients aren't sending
   * unexpected data, form validation where extra fields indicate errors, or
   * configuration parsing where unknown options should be flagged.
   *
   * @param schema - The source schema to make strict
   * @returns A new schema that rejects additional properties
   *
   * @example Basic strict validation
   * ```typescript
   * const UserSchema = Interface({
   *   id: "number",
   *   name: "string",
   *   email: "email"
   * });
   *
   * const StrictUserSchema = Mod.strict(UserSchema);
   *
   * // This will succeed
   * StrictUserSchema.parse({
   *   id: 1,
   *   name: "John",
   *   email: "john@example.com"
   * }); // ✅
   *
   * // This will fail due to extra property
   * StrictUserSchema.parse({
   *   id: 1,
   *   name: "John",
   *   email: "john@example.com",
   *   age: 30 // ❌ Error: Unexpected properties: age
   * });
   * ```
   *
   * @example API endpoint validation
   * ```typescript
   * const CreatePostSchema = Interface({
   *   title: "string",
   *   content: "string",
   *   tags: "string[]?",
   *   published: "boolean?"
   * });
   *
   * const StrictCreatePostSchema = Mod.strict(CreatePostSchema);
   *
   * // Protect against typos or malicious extra data
   * app.post('/posts', (req, res) => {
   *   const result = StrictCreatePostSchema.safeParse(req.body);
   *
   *   if (!result.success) {
   *     return res.status(400).json({
   *       error: "Invalid request data",
   *       details: result.errors
   *     });
   *   }
   *
   *   // Guaranteed to only contain expected fields
   *   const post = result.data;
   * });
   * ```
   *
   * @example Configuration validation
   * ```typescript
   * const DatabaseConfigSchema = Interface({
   *   host: "string",
   *   port: "number",
   *   username: "string",
   *   password: "string",
   *   database: "string"
   * });
   *
   * const StrictDatabaseConfig = Mod.strict(DatabaseConfigSchema);
   *
   * // Catch configuration typos early
   * const config = StrictDatabaseConfig.parse({
   *   host: "localhost",
   *   port: 5432,
   *   username: "admin",
   *   password: "secret",
   *   database: "myapp",
   *   connectionTimeout: 5000 // ❌ Error: Unknown config option
   * });
   * ```
   *
   * @example Comparison with default behavior
   * ```typescript
   * const Schema = Interface({ name: "string" });
   * const StrictSchema = Mod.strict(Schema);
   *
   * const input = { name: "John", extra: "ignored" };
   *
   * // Default behavior: extra properties ignored
   * const defaultResult = Schema.parse(input);
   * console.log(defaultResult); // { name: "John" } - extra property ignored
   *
   * // Strict behavior: extra properties cause error
   * const strictResult = StrictSchema.safeParse(input);
   * console.log(strictResult.success); // false
   * console.log(strictResult.errors); // [{ message: "Unexpected properties: extra" }]
   * ```
   */
  static strict<T>(schema: InterfaceSchema<T>): InterfaceSchema<T> {
    const definition = (schema as any).definition as SchemaInterface;
    const options = (schema as any).options || {};

    const strictOptions = {
      ...options,
      strict: true,
      additionalProperties: false,
    };

    return new InterfaceSchema<T>(definition, strictOptions);
  }

  /**
   * Create a passthrough version of a schema that preserves additional properties
   *
   * By default, Fortify Schema ignores extra properties in the input data (they're
   * not included in the validated output). The `passthrough()` method changes this
   * behavior to explicitly include all additional properties in the validated result,
   * effectively making the schema more permissive.
   *
   * This is useful for proxy APIs, data transformation pipelines, or situations
   * where you want to validate known fields while preserving unknown ones for
   * later processing or forwarding to other systems.
   *
   * @param schema - The source schema to make passthrough
   * @returns A new schema that includes additional properties in the output
   *
   * @example Basic passthrough behavior
   * ```typescript
   * const UserSchema = Interface({
   *   id: "number",
   *   name: "string",
   *   email: "email"
   * });
   *
   * const PassthroughUserSchema = Mod.passthrough(UserSchema);
   *
   * const result = PassthroughUserSchema.parse({
   *   id: 1,
   *   name: "John",
   *   email: "john@example.com",
   *   age: 30,           // Extra property
   *   department: "IT"   // Extra property
   * });
   *
   * console.log(result);
   * // {
   * //   id: 1,
   * //   name: "John",
   * //   email: "john@example.com",
   * //   age: 30,           // ✅ Preserved
   * //   department: "IT"   // ✅ Preserved
   * // }
   * ```
   *
   * @example API proxy with validation
   * ```typescript
   * const KnownUserFieldsSchema = Interface({
   *   id: "number",
   *   name: "string",
   *   email: "email",
   *   role: "admin|user|moderator"
   * });
   *
   * const ProxyUserSchema = Mod.passthrough(KnownUserFieldsSchema);
   *
   * // Validate known fields while preserving unknown ones
   * app.post('/users/proxy', (req, res) => {
   *   const result = ProxyUserSchema.safeParse(req.body);
   *
   *   if (!result.success) {
   *     return res.status(400).json({
   *       error: "Invalid known fields",
   *       details: result.errors
   *     });
   *   }
   *
   *   // Forward to another service with all data preserved
   *   const response = await externalAPI.createUser(result.data);
   *   res.json(response);
   * });
   * ```
   *
   * @example Data transformation pipeline
   * ```typescript
   * const CoreDataSchema = Interface({
   *   timestamp: "date",
   *   userId: "number",
   *   action: "string"
   * });
   *
   * const FlexibleDataSchema = Mod.passthrough(CoreDataSchema);
   *
   * // Process events with varying additional metadata
   * function processEvent(rawEvent: unknown) {
   *   const result = FlexibleDataSchema.safeParse(rawEvent);
   *
   *   if (!result.success) {
   *     throw new Error("Invalid core event structure");
   *   }
   *
   *   const event = result.data;
   *
   *   // Core fields are validated and typed
   *   console.log(`User ${event.userId} performed ${event.action} at ${event.timestamp}`);
   *
   *   // Additional metadata is preserved for downstream processing
   *   if ('metadata' in event) {
   *     processMetadata(event.metadata);
   *   }
   *
   *   return event; // All data preserved
   * }
   * ```
   *
   * @example Comparison with default and strict behavior
   * ```typescript
   * const Schema = Interface({ name: "string" });
   * const PassthroughSchema = Mod.passthrough(Schema);
   * const StrictSchema = Mod.strict(Schema);
   *
   * const input = { name: "John", extra: "data", more: "fields" };
   *
   * // Default: extra properties ignored
   * const defaultResult = Schema.parse(input);
   * console.log(defaultResult); // { name: "John" }
   *
   * // Passthrough: extra properties included
   * const passthroughResult = PassthroughSchema.parse(input);
   * console.log(passthroughResult); // { name: "John", extra: "data", more: "fields" }
   *
   * // Strict: extra properties cause error
   * const strictResult = StrictSchema.safeParse(input);
   * console.log(strictResult.success); // false
   * ```
   */
  static passthrough<T>(
    schema: InterfaceSchema<T>
  ): InterfaceSchema<T & Record<string, any>> {
    const definition = (schema as any).definition as SchemaInterface;
    const options = (schema as any).options || {};

    const passthroughOptions = {
      ...options,
      strict: false,
      additionalProperties: true,
    };

    return new InterfaceSchema<T & Record<string, any>>(
      definition,
      passthroughOptions
    );
  }

  /**
   * Create a schema that accepts null values for all fields
   * @example
   * ```typescript
   * const UserSchema = Interface({ id: "number", name: "string" });
   * const NullableSchema = Mod.nullable(UserSchema);
   * // Result: { id: number | null, name: string | null }
   * ```
   */
  static nullable<T>(
    schema: InterfaceSchema<T>
  ): InterfaceSchema<{ [K in keyof T]: T[K] | null }> {
    const definition = (schema as any).definition as SchemaInterface;
    const options = (schema as any).options || {};

    const nullableDefinition: SchemaInterface = {};

    for (const [key, value] of Object.entries(definition)) {
      if (typeof value === "string") {
        // Add null union to the type
        nullableDefinition[key] = value.includes("|")
          ? `${value}|null`
          : `${value}|null`;
      } else {
        nullableDefinition[key] = value;
      }
    }

    return new InterfaceSchema<{ [K in keyof T]: T[K] | null }>(
      nullableDefinition,
      options
    );
  }

  /**
   * Get comprehensive metadata and statistics about a schema
   *
   * This method analyzes a schema and returns detailed information about its structure,
   * including field counts, types, and other useful metadata. This is particularly
   * useful for debugging, documentation generation, schema analysis tools, or
   * building dynamic UIs based on schema structure.
   *
   * @param schema - The schema to analyze
   * @returns Object containing detailed schema metadata
   *
   * @example Basic schema analysis
   * ```typescript
   * const UserSchema = Interface({
   *   id: "number",
   *   name: "string",
   *   email: "email?",
   *   profile: {
   *     bio: "string?",
   *     avatar: "string"
   *   },
   *   tags: "string[]?"
   * });
   *
   * const info = Mod.info(UserSchema);
   * console.log(info);
   * // {
   * //   fieldCount: 5,
   * //   requiredFields: 3,
   * //   optionalFields: 2,
   * //   types: ["number", "string", "email?", "object", "string[]?"],
   * //   fields: ["id", "name", "email", "profile", "tags"]
   * // }
   * ```
   *
   * @example Using info for documentation generation
   * ```typescript
   * function generateSchemaDoc(schema: InterfaceSchema<any>, name: string) {
   *   const info = Mod.info(schema);
   *
   *   return `
   * ## ${name} Schema
   *
   * **Fields:** ${info.fieldCount} total (${info.requiredFields} required, ${info.optionalFields} optional)
   *
   * **Field Types:**
   * ${info.fields.map((field, i) => `- ${field}: ${info.types[i]}`).join('\n')}
   *   `;
   * }
   *
   * const doc = generateSchemaDoc(UserSchema, "User");
   * console.log(doc);
   * ```
   *
   * @example Schema complexity analysis
   * ```typescript
   * function analyzeSchemaComplexity(schema: InterfaceSchema<any>) {
   *   const info = Mod.info(schema);
   *
   *   const complexity = {
   *     simple: info.fieldCount <= 5,
   *     hasOptionalFields: info.optionalFields > 0,
   *     hasArrays: info.types.some(type => type.includes('[]')),
   *     hasNestedObjects: info.types.includes('object'),
   *     typeVariety: new Set(info.types.map(type =>
   *       type.replace(/\?|\[\]/g, '')
   *     )).size
   *   };
   *
   *   return complexity;
   * }
   *
   * const complexity = analyzeSchemaComplexity(UserSchema);
   * console.log(complexity);
   * // {
   * //   simple: false,
   * //   hasOptionalFields: true,
   * //   hasArrays: true,
   * //   hasNestedObjects: true,
   * //   typeVariety: 4
   * // }
   * ```
   *
   * @example Dynamic form generation
   * ```typescript
   * function generateFormFields(schema: InterfaceSchema<any>) {
   *   const info = Mod.info(schema);
   *
   *   return info.fields.map((fieldName, index) => {
   *     const fieldType = info.types[index];
   *     const isRequired = !fieldType.includes('?');
   *     const baseType = fieldType.replace(/\?|\[\]/g, '');
   *
   *     return {
   *       name: fieldName,
   *       type: baseType,
   *       required: isRequired,
   *       isArray: fieldType.includes('[]'),
   *       inputType: getInputType(baseType) // Custom function
   *     };
   *   });
   * }
   *
   * function getInputType(type: string): string {
   *   switch (type) {
   *     case 'string': return 'text';
   *     case 'number': return 'number';
   *     case 'email': return 'email';
   *     case 'date': return 'date';
   *     case 'boolean': return 'checkbox';
   *     default: return 'text';
   *   }
   * }
   *
   * const formFields = generateFormFields(UserSchema);
   * ```
   *
   * @example Schema validation and testing
   * ```typescript
   * function validateSchemaStructure(schema: InterfaceSchema<any>) {
   *   const info = Mod.info(schema);
   *   const issues: string[] = [];
   *
   *   if (info.fieldCount === 0) {
   *     issues.push("Schema has no fields");
   *   }
   *
   *   if (info.requiredFields === 0) {
   *     issues.push("Schema has no required fields");
   *   }
   *
   *   if (info.fieldCount > 20) {
   *     issues.push("Schema might be too complex (>20 fields)");
   *   }
   *
   *   const unknownTypes = info.types.filter(type =>
   *     !['string', 'number', 'boolean', 'date', 'email', 'object'].some(known =>
   *       type.replace(/\?|\[\]/g, '').includes(known)
   *     )
   *   );
   *
   *   if (unknownTypes.length > 0) {
   *     issues.push(`Unknown types found: ${unknownTypes.join(', ')}`);
   *   }
   *
   *   return {
   *     valid: issues.length === 0,
   *     issues,
   *     info
   *   };
   * }
   * ```
   */
  static info<T>(schema: InterfaceSchema<T>): {
    fieldCount: number;
    requiredFields: number;
    optionalFields: number;
    types: string[];
    fields: string[];
  } {
    const definition = (schema as any).definition as SchemaInterface;

    const fields = Object.keys(definition);
    const types = Object.values(definition).map((v) =>
      typeof v === "string" ? v : "object"
    );
    const optionalFields = types.filter(
      (type) => typeof type === "string" && type.endsWith("?")
    ).length;
    const requiredFields = fields.length - optionalFields;

    return {
      fieldCount: fields.length,
      requiredFields,
      optionalFields,
      types,
      fields,
    };
  }

  /**
   * Clone a schema with optional modifications
   * @example
   * ```typescript
   * const UserSchema = Interface({ id: "number", name: "string" });
   * const ClonedSchema = Mod.clone(UserSchema, { preserveOptions: true });
   * ```
   */
  static clone<T>(
    schema: InterfaceSchema<T>,
    options: { preserveOptions?: boolean } = {}
  ): InterfaceSchema<T> {
    const definition = (schema as any).definition as SchemaInterface;
    const schemaOptions = options.preserveOptions
      ? (schema as any).options || {}
      : {};

    return new InterfaceSchema<T>(
      JSON.parse(JSON.stringify(definition)),
      schemaOptions
    );
  }
}

// Type utility for deep partial
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
