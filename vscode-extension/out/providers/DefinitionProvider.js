"use strict";
/**
 * Definition Provider for Fortify Schema
 *
 * Provides go-to-definition functionality for variables in conditional expressions
 * - Ctrl+click on "property" in "when property=premium" jumps to the property definition
 * - Works within Interface({...}) blocks
 * - Supports nested object properties
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FortifyDefinitionProvider = void 0;
const vscode = require("vscode");
class FortifyDefinitionProvider {
    /**
     * Provide definition for the symbol at the given position
     */
    provideDefinition(document, position, token) {
        const text = document.getText();
        const line = document.lineAt(position);
        const lineText = line.text;
        // Check if we're in an Interface block
        if (!this.isInInterfaceBlock(document, position)) {
            return undefined;
        }
        // Get the word at the cursor position
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return undefined;
        }
        const word = document.getText(wordRange);
        // Check if this word is a variable in a conditional expression
        if (!this.isVariableInConditional(lineText, word, position.character)) {
            return undefined;
        }
        // Find the property definition in the same Interface block
        const propertyLocation = this.findPropertyDefinition(document, position, word);
        if (propertyLocation) {
            return new vscode.Location(document.uri, propertyLocation);
        }
        return undefined;
    }
    /**
     * Check if the current position is within an Interface({...}) block
     */
    isInInterfaceBlock(document, position) {
        const text = document.getText();
        const lines = text.split("\n");
        // Find Interface blocks
        const interfaceBlocks = this.findInterfaceBlocks(lines);
        return interfaceBlocks.some((block) => position.line >= block.start && position.line <= block.end);
    }
    /**
     * Find all Interface({...}) blocks in the document
     */
    findInterfaceBlocks(lines) {
        const blocks = [];
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
     * Find the end of a block by matching braces
     */
    findBlockEnd(lines, startLine) {
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
                    }
                    else if (char === "}") {
                        braceCount--;
                        if (braceCount === 0) {
                            return i;
                        }
                    }
                }
            }
        }
        return -1;
    }
    /**
     * Check if the word at the given position is a variable in a conditional expression
     */
    isVariableInConditional(lineText, word, charPosition) {
        // Look for patterns like:
        // 1. "when accountType=premium" (equality conditionals)
        // 2. "when fields.exists" (method conditionals)
        // 3. "when user.profile.name.startsWith('A')" (nested property method conditionals)
        const conditionalPatterns = [
            // Equality conditionals: when accountType=premium
            new RegExp(`\\bwhen\\s+(${word})\\s*[=!<>]`, "g"),
            new RegExp(`\\b(${word})\\s*[=!<>].*\\*\\?`, "g"),
            // Method conditionals: when fields.exists, when fields.method()
            new RegExp(`\\bwhen\\s+(${word})\\s*\\.`, "g"),
            // Property path conditionals: when user.profile (where word is "user")
            new RegExp(`\\bwhen\\s+(${word})\\.[a-zA-Z_][a-zA-Z0-9_.]*`, "g"),
            // Nested property conditionals: when user.profile.name (where word could be any part)
            new RegExp(`\\bwhen\\s+[a-zA-Z_][a-zA-Z0-9_.]*\\b(${word})\\b[a-zA-Z0-9_.]*`, "g"),
        ];
        for (const pattern of conditionalPatterns) {
            let match;
            while ((match = pattern.exec(lineText)) !== null) {
                // Find the position of the word in the match
                const matchText = match[0];
                const wordIndex = matchText.indexOf(word);
                if (wordIndex !== -1) {
                    const variableStart = match.index + wordIndex;
                    const variableEnd = variableStart + word.length;
                    // Check if cursor is within the variable
                    if (charPosition >= variableStart && charPosition <= variableEnd) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    /**
     * Find the property definition within the same Interface block
     */
    findPropertyDefinition(document, currentPosition, propertyName) {
        const text = document.getText();
        const lines = text.split("\n");
        // Find the Interface block containing the current position
        const interfaceBlocks = this.findInterfaceBlocks(lines);
        const currentBlock = interfaceBlocks.find((block) => currentPosition.line >= block.start && currentPosition.line <= block.end);
        if (!currentBlock) {
            return undefined;
        }
        // Check if this is a property path (e.g., "user.profile.name")
        if (propertyName.includes(".")) {
            return this.findNestedPropertyDefinition(document, currentPosition, propertyName);
        }
        // Search for simple property definition within the block
        for (let i = currentBlock.start; i <= currentBlock.end; i++) {
            const line = lines[i];
            // Look for property definition patterns:
            // 1. "propertyName:" (object property)
            // 2. propertyName: "type" (direct property)
            // 3. propertyName: { (nested object)
            const propertyPatterns = [
                new RegExp(`^\\s*(${propertyName})\\s*:`, "g"),
                new RegExp(`[{,]\\s*(${propertyName})\\s*:`, "g"),
                new RegExp(`\\s+(${propertyName})\\s*:`, "g"), // More flexible whitespace
            ];
            for (const pattern of propertyPatterns) {
                let match;
                while ((match = pattern.exec(line)) !== null) {
                    const propertyStart = match.index + match[0].indexOf(propertyName);
                    const propertyEnd = propertyStart + propertyName.length;
                    return new vscode.Range(new vscode.Position(i, propertyStart), new vscode.Position(i, propertyEnd));
                }
            }
        }
        return undefined;
    }
    /**
     * Find nested property definitions (e.g., "user.profile.name")
     * Enhanced to handle property paths and method calls
     */
    findNestedPropertyDefinition(document, currentPosition, propertyPath) {
        const parts = propertyPath.split(".");
        if (parts.length === 1) {
            return this.findPropertyDefinition(document, currentPosition, parts[0]);
        }
        // For nested properties, start with the root property
        // Example: "user.profile.name" -> find "user" first
        const rootProperty = parts[0];
        // Try to find the root property definition
        const rootDefinition = this.findPropertyDefinition(document, currentPosition, rootProperty);
        if (rootDefinition) {
            // For now, return the root property definition
            // In the future, we could enhance this to navigate to nested properties
            return rootDefinition;
        }
        return undefined;
    }
}
exports.FortifyDefinitionProvider = FortifyDefinitionProvider;
//# sourceMappingURL=DefinitionProvider.js.map