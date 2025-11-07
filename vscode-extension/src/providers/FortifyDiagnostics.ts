import * as vscode from "vscode";
import { FortifySyntaxUtils } from "../syntax/FortifySyntaxDefinitions";

/**
 * Provides diagnostics for Fortify Schema strings in TypeScript/JavaScript files.
 * Validates schema syntax with a focus on simplicity and accuracy, ensuring a
 * TypeScript-like experience that's easier than alternatives like Zod.
 */
export class FortifyDiagnosticsProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;

  constructor() {
    this.diagnosticCollection =
      vscode.languages.createDiagnosticCollection("fortify-schema");
  }

  /**
   * Updates diagnostics for the given document by analyzing Fortify Schema strings.
   * @param document The text document to analyze
   */
  public updateDiagnostics(document: vscode.TextDocument): void {
    if (!["typescript", "javascript"].includes(document.languageId)) {
      return;
    }

    const diagnostics: vscode.Diagnostic[] = [];
    const text = document.getText();
    const schemaStrings = this.extractSchemaStrings(text);

    for (const { value, range } of schemaStrings) {
      // Check for @fortify-ignore comment on the same line or line above
      if (this.hasIgnoreComment(document, range)) {
        continue; // Skip validation for ignored lines
      }

      diagnostics.push(...this.validateSchemaString(value, range));
    }

    this.diagnosticCollection.set(document.uri, diagnostics);
  }

  /**
   * Validate a document and show results
   */
  validateDocument(document: vscode.TextDocument): void {
    this.updateDiagnostics(document);

    const diagnostics = this.diagnosticCollection.get(document.uri) || [];
    const errorCount = diagnostics.filter(
      (d) => d.severity === vscode.DiagnosticSeverity.Error
    ).length;
    const warningCount = diagnostics.filter(
      (d) => d.severity === vscode.DiagnosticSeverity.Warning
    ).length;

    if (errorCount === 0 && warningCount === 0) {
      vscode.window.showInformationMessage(
        "✅ No Fortify Schema issues found!"
      );
    } else {
      vscode.window.showWarningMessage(
        `Found ${errorCount} error(s) and ${warningCount} warning(s) in Fortify Schema`
      );
    }
  }

  /**
   * Dispose of the diagnostic collection
   */
  dispose(): void {
    this.diagnosticCollection.dispose();
  }

  /**
   * Checks if a line has @fortify-ignore comment to skip validation
   * ENHANCED: Support multi-line @fortify-ignore comments and better detection
   * @param document The text document
   * @param range The range to check for ignore comments
   * @returns True if validation should be skipped
   */
  private hasIgnoreComment(
    document: vscode.TextDocument,
    range: vscode.Range
  ): boolean {
    const lineNumber = range.start.line;

    // Check current line for inline comment
    const currentLine = document.lineAt(lineNumber).text;
    if (this.lineHasIgnoreComment(currentLine)) {
      return true;
    }

    // Check previous lines for @fortify-ignore (up to 5 lines back for multi-line support)
    for (let i = 1; i <= 5 && lineNumber - i >= 0; i++) {
      const previousLine = document.lineAt(lineNumber - i).text;

      // If we hit a non-comment, non-empty line, stop searching
      if (previousLine.trim() && !this.isCommentLine(previousLine)) {
        break;
      }

      if (this.lineHasIgnoreComment(previousLine)) {
        return true;
      }
    }

    // Check if we're inside a multi-line /* @fortify-ignore */ block
    return this.isInIgnoreBlock(document, lineNumber);
  }

  /**
   * Check if a single line contains @fortify-ignore comment
   */
  private lineHasIgnoreComment(line: string): boolean {
    return (
      line.includes("// @fortify-ignore") ||
      line.includes("/* @fortify-ignore") ||
      line.includes("* @fortify-ignore") ||
      line.includes("@fortify-ignore */")
    );
  }

  /**
   * Check if a line is inside a multi-line @fortify-ignore block
   */
  private isInIgnoreBlock(
    document: vscode.TextDocument,
    lineNumber: number
  ): boolean {
    // Look backwards for /* @fortify-ignore
    let ignoreBlockStart = -1;
    for (let i = lineNumber; i >= 0; i--) {
      const line = document.lineAt(i).text;
      if (line.includes("/* @fortify-ignore")) {
        ignoreBlockStart = i;
        break;
      }
      // If we hit a */ before finding /*, we're not in a block
      if (line.includes("*/")) {
        break;
      }
    }

    if (ignoreBlockStart === -1) {
      return false;
    }

    // Look forwards for */ from the ignore block start
    for (let i = ignoreBlockStart; i < document.lineCount; i++) {
      const line = document.lineAt(i).text;
      if (line.includes("*/")) {
        // Found the end of the block, check if our line is within it
        return lineNumber >= ignoreBlockStart && lineNumber <= i;
      }
    }

    // No closing */ found, assume the block extends to end of file
    return lineNumber >= ignoreBlockStart;
  }

  /**
   * Checks if a line is entirely a comment
   * @param line The line text to check
   * @returns True if the line is a comment
   */
  private isCommentLine(line: string): boolean {
    const trimmed = line.trim();
    return (
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed.startsWith("*")
    );
  }

  /**
   * Checks if a string at a given position is inside a comment
   * @param line The line text
   * @param stringIndex The index where the string starts
   * @returns True if the string is inside a comment
   */
  private isStringInComment(line: string, stringIndex: number): boolean {
    // Check for single-line comment before the string
    const singleLineComment = line.lastIndexOf("//", stringIndex);
    if (singleLineComment !== -1) {
      return true;
    }

    // Check for multi-line comment start before the string
    const multiLineStart = line.lastIndexOf("/*", stringIndex);
    const multiLineEnd = line.lastIndexOf("*/", stringIndex);

    // If there's a /* before the string and no */ between them, it's in a comment
    if (
      multiLineStart !== -1 &&
      (multiLineEnd === -1 || multiLineStart > multiLineEnd)
    ) {
      return true;
    }

    return false;
  }

  /**
   * Extracts Fortify Schema strings from the document, ensuring only strings within
   * Interface({...}) blocks are considered for validation.
   * @param text The document text
   * @returns Array of schema strings with their ranges
   */
  private extractSchemaStrings(
    text: string
  ): Array<{ value: string; range: vscode.Range }> {
    const results: Array<{ value: string; range: vscode.Range }> = [];

    // Find all Interface({...}) blocks in the document
    const interfaceBlocks = this.findInterfaceBlocks(text);

    if (interfaceBlocks.length === 0) {
      return results; // No Interface blocks found, no validation needed
    }

    const lines = text.split("\n");

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];

      // Check if this line is within any Interface block
      if (!this.isLineInInterfaceBlock(lineIndex, interfaceBlocks)) {
        continue;
      }

      // Skip lines that are comments
      if (this.isCommentLine(line)) {
        continue;
      }

      // ENHANCED: Support all quote types - double quotes, single quotes, and backticks
      const stringMatches = [
        ...line.matchAll(/"([^"\\]|\\.)*"/g), // Double quotes
        ...line.matchAll(/'([^'\\]|\\.)*'/g), // Single quotes
        ...line.matchAll(/`([^`\\]|\\.)*`/g), // Backticks
      ];

      for (const match of stringMatches) {
        if (match.index !== undefined) {
          // Check if this string is inside a comment
          if (this.isStringInComment(line, match.index)) {
            continue;
          }

          // ENHANCED: Skip strings that are part of bracket notation
          if (
            this.isStringInBracketNotation(line, match.index, match[0].length)
          ) {
            continue;
          }

          // ENHANCED: Skip strings inside Make.const() calls - they are constant values, not type definitions
          if (this.isStringInMakeConstCall(line, match.index)) {
            continue;
          }

          // ENHANCED: Skip strings inside Make.union() and Make.unionOptional() calls - they are literal values, not type definitions
          if (this.isStringInMakeUnionCall(line, match.index)) {
            continue;
          }

          const stringValue = match[0].slice(1, -1); // Remove quotes

          // Within Interface blocks, validate all strings that could be schemas
          if (this.couldBeSchemaString(stringValue)) {
            const startPos = new vscode.Position(lineIndex, match.index);
            const endPos = new vscode.Position(
              lineIndex,
              match.index + match[0].length
            );
            results.push({
              value: stringValue,
              range: new vscode.Range(startPos, endPos),
            });
          }
        }
      }
    }

    return results;
  }

  /**
   * Finds all Interface({...}) blocks in the text and returns their line ranges.
   */
  private findInterfaceBlocks(
    text: string
  ): Array<{ start: number; end: number }> {
    const blocks: Array<{ start: number; end: number }> = [];
    const lines = text.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for Interface( pattern
      const interfaceMatch = line.match(/\bInterface\s*\(/);
      if (interfaceMatch) {
        const blockEnd = this.findBlockEnd(lines, i);
        if (blockEnd !== -1) {
          blocks.push({ start: i, end: blockEnd });
        }
      }
    }

    return blocks;
  }

  /**
   * Finds the end of a block starting from the given line by matching braces.
   */
  private findBlockEnd(lines: string[], startLine: number): number {
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];

      for (let j = 0; j < line.length; j++) {
        const char = line[j];

        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (char === "\\") {
          escapeNext = true;
          continue;
        }

        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }

        if (!inString) {
          if (char === "{") {
            braceCount++;
          } else if (char === "}") {
            braceCount--;
            if (braceCount === 0) {
              return i;
            }
          }
        }
      }
    }

    return -1; // Block not properly closed
  }

  /**
   * Checks if a line is within any of the Interface blocks.
   */
  private isLineInInterfaceBlock(
    lineIndex: number,
    blocks: Array<{ start: number; end: number }>
  ): boolean {
    return blocks.some(
      (block) => lineIndex >= block.start && lineIndex <= block.end
    );
  }

  /**
   * ENHANCED: Check if a string is part of bracket notation (e.g., config["admin-override"])
   * @param line The line text
   * @param stringIndex The start index of the string
   * @param stringLength The length of the string including quotes
   * @returns True if the string is part of bracket notation
   */
  private isStringInBracketNotation(
    line: string,
    stringIndex: number,
    stringLength: number
  ): boolean {
    // Check if there's a [ before the string and ] after it
    const beforeString = line.substring(0, stringIndex);
    const afterString = line.substring(stringIndex + stringLength);

    // Look for pattern: something["string"] or something['string']
    const hasBracketBefore = beforeString.endsWith("[");
    const hasBracketAfter = afterString.startsWith("]");

    return hasBracketBefore && hasBracketAfter;
  }

  /**
   * ENHANCED: Check if a string is inside a Make.const() call
   * @param line The line text
   * @param stringIndex The start index of the string
   * @returns True if the string is inside a Make.const() call
   */
  private isStringInMakeConstCall(line: string, stringIndex: number): boolean {
    // Look for Make.const( before the string
    const beforeString = line.substring(0, stringIndex);

    // Check for various patterns:
    // Make.const("value")
    // Make.const('value')
    // Make.const(`value`)
    const makeConstPattern = /Make\.const\s*\(\s*$/;

    return makeConstPattern.test(beforeString);
  }

  /**
   * ENHANCED: Check if a string is inside a Make.union() or Make.unionOptional() call
   * @param line The line text
   * @param stringIndex The start index of the string
   * @returns True if the string is inside a Make.union() or Make.unionOptional() call
   */
  private isStringInMakeUnionCall(line: string, stringIndex: number): boolean {
    // Look for Make.union( or Make.unionOptional( before the string
    const beforeString = line.substring(0, stringIndex);

    // Check for various patterns:
    // Make.union("value1", "value2")
    // Make.unionOptional("value1", "value2")
    // Also handle cases with whitespace and multiple arguments
    const makeUnionPattern =
      /Make\.(union|unionOptional)\s*\(\s*(?:"[^"]*"\s*,\s*)*$/;

    return makeUnionPattern.test(beforeString);
  }

  /**
   * Determines if a string could potentially be a Fortify schema string.
   * More permissive than the original containsSchemaPattern for Interface contexts.
   */
  private couldBeSchemaString(value: string): boolean {
    // Skip obvious non-schema strings
    if (value.length === 0 || value.length > 200) {
      return false;
    }

    // Skip URLs, file paths, and other obvious non-schema patterns
    if (
      value.startsWith("http") ||
      value.startsWith("/") ||
      value.includes("\\")
    ) {
      return false;
    }

    // Skip very long strings that are clearly not schemas
    if (value.includes(" ") && value.length > 50) {
      return false;
    }

    // Within Interface blocks, be more permissive - validate most short strings
    return true;
  }

  /**
   * Validates a Fortify Schema string, delegating to specific validation methods
   * based on schema type (conditional, union, constant, or regular).
   * @param schema The schema string to validate
   * @param range The range of the schema string in the document
   * @returns Array of diagnostics
   */
  private validateSchemaString(
    schema: string,
    range: vscode.Range
  ): vscode.Diagnostic[] {
    let trimmedSchema = schema.trim();

    // Strip custom error message if present (syntax: "type --> custom message")
    const customErrorPattern = /^(.+?)\s*-->\s*.+$/;
    const customErrorMatch = trimmedSchema.match(customErrorPattern);
    if (customErrorMatch) {
      trimmedSchema = customErrorMatch[1].trim();
    }

    if (trimmedSchema.includes("when")) {
      return this.validateConditionalSchema(trimmedSchema, range);
    } else if (trimmedSchema.match(/^\(.*\)\[\]$/)) {
      // Handle union array types like (f1|f2|f3)[] before regular unions
      return this.validateRegularSchema(trimmedSchema, range);
    } else if (trimmedSchema.includes("|")) {
      return this.validateUnionSchema(trimmedSchema, range);
    } else if (trimmedSchema.startsWith("=")) {
      return this.validateConstantSchema(trimmedSchema, range);
    } else {
      return this.validateRegularSchema(trimmedSchema, range);
    }
  }

  /**
   * Validates a regular schema (e.g., "string", "number(1,10)", "string[]").
   * @param schema The schema string
   * @param range The range of the schema string
   * @returns Array of diagnostics
   */
  private validateRegularSchema(
    schema: string,
    range: vscode.Range
  ): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];

    // Handle optional types (string?, number?, etc.)
    const optionalMatch = schema.match(/^(.+)\?$/);
    if (optionalMatch) {
      return this.validateRegularSchema(optionalMatch[1], range); // Validate base type without ?
    }

    // Handle required types (string!, number!, etc.)
    const requiredMatch = schema.match(/^(.+)!$/);
    if (requiredMatch) {
      return this.validateRegularSchema(requiredMatch[1], range); // Validate base type without !
    }

    // Handle array types with constraints (string[](1,10), url.https[](1,5))
    const arrayConstraintMatch = schema.match(/^([\w.]+)\[\]\(([^)]*)\)$/);
    if (arrayConstraintMatch) {
      const [, type, constraints] = arrayConstraintMatch;

      // Validate base type
      if (!FortifySyntaxUtils.isValidType(type)) {
        diagnostics.push(
          new vscode.Diagnostic(
            range,
            `Unknown type: "${type}".`,
            vscode.DiagnosticSeverity.Error
          )
        );
      }

      // Validate array constraints
      diagnostics.push(
        ...this.validateConstraintSyntax(constraints, type, range)
      );
      return diagnostics;
    }

    // Handle union array types with parentheses ((f1|f2|f3)[])
    const unionArrayMatch = schema.match(/^\(([^)]+)\)\[\]$/);
    if (unionArrayMatch) {
      const unionContent = unionArrayMatch[1];
      // Validate the union content inside parentheses
      return this.validateUnionSchema(unionContent, range);
    }

    // Handle simple array types (string[], number[], url.https[])
    const arrayMatch = schema.match(/^([\w.]+)\[\]$/);
    if (arrayMatch) {
      const type = arrayMatch[1];
      if (!FortifySyntaxUtils.isValidType(type)) {
        diagnostics.push(
          new vscode.Diagnostic(
            range,
            `Unknown type: "${type}".`,
            vscode.DiagnosticSeverity.Error
          )
        );
      }
      return diagnostics;
    }

    // Handle types with constraints (string(1,10), number(0,100), url.https(constraints))
    const constraintMatch = schema.match(/^([\w.]+)\(([^)]*)\)$/);
    if (constraintMatch) {
      const [, type, constraints] = constraintMatch;

      // Validate base type
      if (!FortifySyntaxUtils.isValidType(type)) {
        diagnostics.push(
          new vscode.Diagnostic(
            range,
            `Unknown type: "${type}".`,
            vscode.DiagnosticSeverity.Error
          )
        );
      }

      // Validate constraints
      diagnostics.push(
        ...this.validateConstraintSyntax(constraints, type, range)
      );
      return diagnostics;
    }

    // Handle record types (record<string, any>, Record<string, any>, record<string, string>)
    const recordMatch = schema.match(
      /^(record|Record)<\s*(\w+)\s*,\s*(\w+)\s*>$/
    );
    if (recordMatch) {
      const [, keyType, valueType] = recordMatch;

      // Validate key type (should be string)
      if (keyType !== "string") {
        diagnostics.push(
          new vscode.Diagnostic(
            range,
            `Record key type must be "string", got "${keyType}".`,
            vscode.DiagnosticSeverity.Error
          )
        );
      }

      // Validate value type
      if (!FortifySyntaxUtils.isValidType(valueType) && valueType !== "any") {
        diagnostics.push(
          new vscode.Diagnostic(
            range,
            `Unknown record value type: "${valueType}".`,
            vscode.DiagnosticSeverity.Error
          )
        );
      }

      return diagnostics;
    }

    // Handle simple types (string, number, boolean, url.https) - but also catch invalid types
    const simpleMatch = schema.match(/^([\w.]+)$/);
    if (simpleMatch) {
      const type = simpleMatch[1];
      if (!FortifySyntaxUtils.isValidType(type)) {
        // For standalone schemas (not in unions), validate type names strictly
        // This catches "invalidtype" while allowing union literals like "admin"
        diagnostics.push(
          new vscode.Diagnostic(
            range,
            `Unknown type: "${type}".`,
            vscode.DiagnosticSeverity.Error
          )
        );
      }
      return diagnostics;
    }

    // If none of the patterns match, it's invalid syntax
    diagnostics.push(
      new vscode.Diagnostic(
        range,
        `Invalid schema syntax: "${schema}". Expected a type, type(constraints), type[], type?, or type!`,
        vscode.DiagnosticSeverity.Error
      )
    );

    return diagnostics;
  }

  /**
   * Validates constraints (e.g., "(1,10)", "(/^[a-z]+$/)" for string).
   * @param constraints The constraint string
   * @param type The base type
   * @param range The range of the schema string
   * @returns Array of diagnostics
   */
  private validateConstraintSyntax(
    constraints: string,
    type: string,
    range: vscode.Range
  ): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];

    // Handle regex constraints for strings (e.g., /^[a-z]+$/)
    if (type === "string" && constraints.startsWith("/")) {
      return this.validateRegexPatterns(constraints, range);
    }

    // Handle numeric constraints (e.g., number(1,10), positive(0.01,), number(-90,90))
    const params = constraints.split(",").map((p) => p.trim());
    for (const param of params) {
      // Allow empty params (for open ranges like "0.01," or ",100")
      // Updated regex to allow negative numbers: -90, -0.5, etc.
      if (param && !/^-?\d*\.?\d*$/.test(param)) {
        diagnostics.push(
          new vscode.Diagnostic(
            range,
            `Invalid constraint: "${param}". Expected a number or decimal (including negative numbers).`,
            vscode.DiagnosticSeverity.Error
          )
        );
      }
    }

    return diagnostics;
  }

  /**
   * Validates regex patterns in constraints (e.g., "string(/^[a-z]+$/)" ).
   * @param constraints The constraint string
   * @param range The range of the schema string
   * @returns Array of diagnostics
   */
  private validateRegexPatterns(
    constraints: string,
    range: vscode.Range
  ): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];

    // Handle regex patterns like /^[a-z]+$/ or /^[a-z]+$/flags
    const regexPattern = /^\/(.*)\/([gimsuy]*)$/;
    const match = constraints.match(regexPattern);

    if (!match) {
      diagnostics.push(
        new vscode.Diagnostic(
          range,
          `Invalid regex constraint: "${constraints}". Expected /pattern/ or /pattern/flags.`,
          vscode.DiagnosticSeverity.Error
        )
      );
      return diagnostics;
    }

    const [, regexContent, flags] = match;
    try {
      new RegExp(regexContent, flags);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Invalid regex pattern";
      diagnostics.push(
        new vscode.Diagnostic(
          range,
          `Invalid regex pattern: /${regexContent}/${flags}. ${errorMessage}`,
          vscode.DiagnosticSeverity.Error
        )
      );
    }

    return diagnostics;
  }

  /**
   * Validates union schemas (e.g., "admin|user|guest").
   * @param schema The schema string
   * @param range The range of the schema string
   * @returns Array of diagnostics
   */
  private validateUnionSchema(
    schema: string,
    range: vscode.Range
  ): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];

    // Check for double pipes (||) which is invalid in union syntax
    const doublePipeRegex = /\|\|/;
    if (doublePipeRegex.test(schema)) {
      diagnostics.push(
        new vscode.Diagnostic(
          range,
          'Invalid union syntax: "||" is not allowed. Use single "|" for unions. Double "||" is only for conditional logic.',
          vscode.DiagnosticSeverity.Error
        )
      );
      return diagnostics;
    }

    const parts = schema.split("|").map((p) => p.trim());

    for (const part of parts) {
      if (part === "") {
        diagnostics.push(
          new vscode.Diagnostic(
            range,
            'Empty union value. Remove extra "|" or add missing value.',
            vscode.DiagnosticSeverity.Error
          )
        );
        continue;
      }

      // Allow constants and literals without type validation
      if (part.startsWith("=") || this.isLiteralValue(part)) {
        continue; // Literals and constants are valid
      }

      // Validate as type
      diagnostics.push(...this.validateRegularSchema(part, range));
    }

    return diagnostics;
  }

  /**
   * Determines if a value is a valid literal for union types.
   * Production-ready logic that properly categorizes values for real-world usage.
   * @param value The value to check
   * @returns True if the value should be treated as a literal (not validated as a type)
   */
  private isLiteralValue(value: string): boolean {
    // If it's a known valid type, validate it as a type, not a literal
    if (FortifySyntaxUtils.isValidType(value)) {
      return false;
    }

    // For union syntax: treat everything else as literals
    // Simple rule: admin, user, guest, dark, us, etc. are all valid literals
    // Only validate basic pattern for safety
    return /^[a-zA-Z][a-zA-Z0-9_.-]*$/.test(value);
  }

  /**
   * Validates constant schemas (e.g., "=active", "=1.0", "=default?").
   * @param schema The schema string
   * @param range The range of the schema string
   * @returns Array of diagnostics
   */
  private validateConstantSchema(
    schema: string,
    range: vscode.Range
  ): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];

    // Allow constants with alphanumeric, dots, underscores, and optional ? at the end
    if (!schema.match(/^=[a-zA-Z0-9_.]+\??$/)) {
      diagnostics.push(
        new vscode.Diagnostic(
          range,
          `Invalid constant: "${schema}". Expected "=value" or "=value?".`,
          vscode.DiagnosticSeverity.Error
        )
      );
    }
    return diagnostics;
  }

  /**
   * Validates conditional schemas (e.g., "when role=admin *? string[] : string[]?").
   * @param schema The schema string
   * @param range The range of the schema string
   * @returns Array of diagnostics
   */
  private validateConditionalSchema(
    schema: string,
    range: vscode.Range
  ): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];

    // Find the first *? to split condition from then/else
    const firstThenIndex = schema.indexOf("*?");
    if (firstThenIndex === -1) {
      diagnostics.push(
        new vscode.Diagnostic(
          range,
          `Invalid conditional schema: "${schema}". Missing "*?" operator.`,
          vscode.DiagnosticSeverity.Error
        )
      );
      return diagnostics;
    }

    const condition = schema.substring(0, firstThenIndex).trim();
    const thenElsePart = schema.substring(firstThenIndex + 2).trim();

    // For nested conditionals, we need to be more flexible with the : splitting
    // Find the first : that's not part of a nested conditional
    let colonIndex = -1;
    let depth = 0;
    for (let i = 0; i < thenElsePart.length; i++) {
      if (thenElsePart.substring(i).startsWith("when")) {
        depth++;
      } else if (thenElsePart[i] === ":" && depth === 0) {
        colonIndex = i;
        break;
      } else if (thenElsePart.substring(i).startsWith("*?")) {
        depth--;
        i++; // Skip the next character
      }
    }

    if (colonIndex === -1) {
      diagnostics.push(
        new vscode.Diagnostic(
          range,
          `Invalid conditional schema: "${schema}". Missing ":" separator.`,
          vscode.DiagnosticSeverity.Error
        )
      );
      return diagnostics;
    }

    const thenPart = thenElsePart.substring(0, colonIndex).trim();
    const elsePart = thenElsePart.substring(colonIndex + 1).trim();

    // Validate condition
    diagnostics.push(...this.validateConditionalOperators(condition, range));

    // Validate then and else schemas (recursively for nested conditionals)
    diagnostics.push(...this.validateSchemaString(thenPart, range));
    diagnostics.push(...this.validateSchemaString(elsePart, range));

    return diagnostics;
  }

  /**
   * Validates operators and methods in conditional expressions.
   * @param condition The condition string
   * @param range The range of the schema string
   * @returns Array of diagnostics
   */
  private validateConditionalOperators(
    condition: string,
    range: vscode.Range
  ): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];

    // Remove "when " prefix if present
    const cleanCondition = condition.replace(/^when\s+/, "");

    // ENHANCED: Check for V2 method calls with support for bracket notation and array indexing
    // Patterns supported:
    // - property.$method()
    // - property.nested.$method()
    // - config["admin-override"].$method()
    // - data.items[0].$method()
    // - config["special config"].$method()
    const methodMatch = cleanCondition.match(
      /([\w.]+(?:\[["'][^"']*["']\])*(?:\[\d+\])*)\.\$(\w+)(\([^)]*\))?/
    );
    if (methodMatch) {
      const [fullMatch, propertyPath, method, hasParens] = methodMatch;

      // Skip if this is part of a domain pattern (preceded by @ or ~)
      const beforeMatch = cleanCondition.substring(
        0,
        cleanCondition.indexOf(fullMatch)
      );
      if (beforeMatch.includes("@") || beforeMatch.endsWith("~")) {
        // This is part of a pattern like email~@company.com, not a method call
        return diagnostics;
      }
      const validMethods = FortifySyntaxUtils.getAllMethodNames();

      if (!validMethods.includes(method)) {
        diagnostics.push(
          new vscode.Diagnostic(
            range,
            `Unknown method: "${method}". Expected one of ${validMethods.join(", ")}.`,
            vscode.DiagnosticSeverity.Error
          )
        );
      }

      // Validate method arguments if parentheses are present
      if (hasParens) {
        const args = hasParens.slice(1, -1); // Remove parentheses
        const argList = args.split(",").map((a) => a.trim());

        // Allow literals, quoted strings, numbers, and domain-like patterns
        if (
          args &&
          argList.some(
            (arg) =>
              !this.isLiteralValue(arg) &&
              !arg.match(/^["'].*["']$/) &&
              !arg.match(/^\d+(\.\d+)?$/) &&
              !arg.match(/^\.[a-zA-Z0-9]+$/) && // Allow .com, .org, etc.
              !arg.match(/^[a-zA-Z0-9_.-]+$/) // Allow domain-like patterns
          )
        ) {
          diagnostics.push(
            new vscode.Diagnostic(
              range,
              `Invalid arguments in "${method}": "${args}". Expected literals, quoted strings, numbers, or patterns.`,
              vscode.DiagnosticSeverity.Error
            )
          );
        }
      }
      return diagnostics;
    }

    // ENHANCED: Check for comparison operators with bracket notation support
    // Patterns supported:
    // - property=value
    // - config["admin-override"]=true
    // - data.items[0]=value
    // - config["special config"]!=null
    const comparisonMatch = cleanCondition.match(
      /([\w.]+(?:\[["'][^"']*["']\])*(?:\[\d+\])*)\s*([!~=><]+|~|!~)\s*(.+)/
    );
    if (comparisonMatch) {
      const [, propertyPath, operator, value] = comparisonMatch;

      // Validate regex patterns for ~ and !~ operators
      if (operator === "~" || operator === "!~") {
        // For patterns like email~@company.com, don't validate as regex
        if (!value.startsWith("/") && !value.endsWith("/")) {
          return diagnostics; // Allow pattern matching without regex validation
        }

        try {
          new RegExp(value.slice(1, -1)); // Remove / delimiters
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Invalid regex";
          diagnostics.push(
            new vscode.Diagnostic(
              range,
              `Invalid regex in condition: "${value}". ${errorMessage}`,
              vscode.DiagnosticSeverity.Error
            )
          );
        }
      }
      return diagnostics;
    }

    // Check for logical operators (&&, ||)
    if (cleanCondition.includes("&&") || cleanCondition.includes("||")) {
      // Split by logical operators and validate each part
      const parts = cleanCondition.split(/\s*(\&\&|\|\|)\s*/);
      for (let i = 0; i < parts.length; i += 2) {
        // Skip the operators
        const part = parts[i].trim();
        if (part) {
          const subDiagnostics = this.validateConditionalOperators(
            `when ${part}`,
            range
          );
          diagnostics.push(...subDiagnostics);
        }
      }
      return diagnostics;
    }

    // If no pattern matches, it might be invalid
    if (cleanCondition.trim()) {
      diagnostics.push(
        new vscode.Diagnostic(
          range,
          `Invalid condition: "${cleanCondition}". Expected patterns:\n` +
            `• field=value (e.g., role=admin)\n` +
            `• field.$method() (e.g., profile.$exists())\n` +
            `• field["property"].$method() (e.g., config["admin-override"].$exists())\n` +
            `• field.items[0].$method() (e.g., data.items[0].$exists())\n` +
            `• field~pattern (e.g., email~@company.com)`,
          vscode.DiagnosticSeverity.Warning
        )
      );
    }

    return diagnostics;
  }
}
