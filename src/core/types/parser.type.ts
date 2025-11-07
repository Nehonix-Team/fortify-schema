export interface ParsedConstraints {
  type: string;
  constraints: any;
  optional: boolean;
  required: boolean; // Non-empty/non-zero validation
  customErrorMessage?: string; // Custom error message for validation failures
}

export enum ConstraintType {
  Min = "min",
  Max = "max",
  MinLength = "minLength",
  MaxLength = "maxLength",
  MinItems = "minItems",
  MaxItems = "maxItems",
}
