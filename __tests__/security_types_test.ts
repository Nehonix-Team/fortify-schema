// ====================================================================
// TEST CONSTANT VALIDATION
// ====================================================================

import { Interface } from "../core/schema/mode/interfaces/Interface";

// Fortify Schema - New Types Test Suite
// Testing: json, text, ip, password, object, url types

// Test helper function
function runTest(
  testName: string,
  schema: any,
  testCases: Array<{ value: any; shouldPass: boolean; description: string }>
) {
  console.log(`\n🧪 Testing ${testName}:`);
  console.log("=" + "=".repeat(testName.length + 10));

  testCases.forEach((testCase, index) => {
    try {
      const result = schema.safeParse({ field: testCase.value });
      const passed = result.success === testCase.shouldPass;
      const status = passed ? "✅ PASS" : "❌ FAIL";

      console.log(`\n${index + 1}. ${testCase.description}`);
      console.log(`   Input: ${JSON.stringify(testCase.value)}`);
      console.log(`   Expected: ${testCase.shouldPass ? "VALID" : "INVALID"}`);
      console.log(
        `   Result: ${result.success ? "VALID" : "INVALID"} ${status}`
      );

      if (!result.success && testCase.shouldPass) {
        console.log(
          `   Error: ${result.errors[0]?.message || "Unknown error"}`
        );
      }

      if (result.success && !testCase.shouldPass) {
        console.log(`   ⚠️  Expected this to fail but it passed!`);
      }
    } catch (error) {
      console.log(`   💥 Exception: ${error.message}`);
    }
  });
}

// 1. JSON Type Tests
console.log("🚀 Starting Fortify Schema New Types Test Suite");
console.log("=" + "=".repeat(45));

const JsonSchema = Interfaces({
  field: "json",
});

runTest("JSON Type", JsonSchema, [
  {
    value: '{"key": "value"}',
    shouldPass: true,
    description: "Valid JSON object string",
  },
  {
    value: '{"name": "John", "age": 30}',
    shouldPass: true,
    description: "Valid JSON with multiple fields",
  },
  {
    value: "[1, 2, 3, 4, 5]",
    shouldPass: true,
    description: "Valid JSON array",
  },
  {
    value: '{"nested": {"deep": {"value": true}}}',
    shouldPass: true,
    description: "Valid nested JSON",
  },
  { value: "null", shouldPass: true, description: "Valid JSON null" },
  { value: "true", shouldPass: true, description: "Valid JSON boolean" },
  { value: "42", shouldPass: true, description: "Valid JSON number" },
  {
    value: '"hello world"',
    shouldPass: true,
    description: "Valid JSON string",
  },
  {
    value: '{"unclosed": "bracket"',
    shouldPass: false,
    description: "Invalid JSON - unclosed bracket",
  },
  {
    value: '{key: "value"}',
    shouldPass: false,
    description: "Invalid JSON - unquoted key",
  },
  {
    value: "not json at all",
    shouldPass: false,
    description: "Invalid JSON - plain text",
  },
  {
    value: '{"trailing": "comma",}',
    shouldPass: false,
    description: "Invalid JSON - trailing comma",
  },
  { value: "", shouldPass: false, description: "Invalid JSON - empty string" },
  {
    value: undefined,
    shouldPass: false,
    description: "Invalid JSON - undefined",
  },
  {
    value: null,
    shouldPass: false,
    description: "Invalid JSON - null value (not string)",
  },
]);

// 2. Text Type Tests
const TextSchema = Interface({
  field: "text",
});

runTest("Text Type", TextSchema, [
  { value: "Hello world", shouldPass: true, description: "Simple text" },
  {
    value: "Multi-line\ntext\nwith\nbreaks",
    shouldPass: true,
    description: "Multi-line text",
  },
  {
    value: "Text with symbols !@#$%^&*()",
    shouldPass: true,
    description: "Text with special characters",
  },
  {
    value:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    shouldPass: true,
    description: "Long text",
  },
  {
    value: "Unicode text: 🚀 ñáéíóú 中文 العربية",
    shouldPass: true,
    description: "Unicode and emoji text",
  },
  { value: "", shouldPass: true, description: "Empty text" },
  { value: "   ", shouldPass: true, description: "Whitespace only text" },
  {
    value: "HTML <div>content</div>",
    shouldPass: true,
    description: "Text with HTML tags",
  },
  { value: 123, shouldPass: false, description: "Invalid text - number" },
  { value: true, shouldPass: false, description: "Invalid text - boolean" },
  { value: null, shouldPass: false, description: "Invalid text - null" },
  {
    value: undefined,
    shouldPass: false,
    description: "Invalid text - undefined",
  },
  { value: {}, shouldPass: false, description: "Invalid text - object" },
  { value: [], shouldPass: false, description: "Invalid text - array" },
]);

// 3. IP Address Type Tests
const IpSchema = Interface({
  field: "ip",
});

runTest("IP Address Type", IpSchema, [
  {
    value: "192.168.1.1",
    shouldPass: true,
    description: "Valid IPv4 - private range",
  },
  {
    value: "8.8.8.8",
    shouldPass: true,
    description: "Valid IPv4 - public DNS",
  },
  {
    value: "127.0.0.1",
    shouldPass: true,
    description: "Valid IPv4 - localhost",
  },
  {
    value: "255.255.255.255",
    shouldPass: true,
    description: "Valid IPv4 - broadcast",
  },
  { value: "0.0.0.0", shouldPass: true, description: "Valid IPv4 - all zeros" },
  {
    value: "10.0.0.1",
    shouldPass: true,
    description: "Valid IPv4 - private class A",
  },
  {
    value: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
    shouldPass: true,
    description: "Valid IPv6 - full format",
  },
  {
    value: "2001:db8:85a3::8a2e:370:7334",
    shouldPass: true,
    description: "Valid IPv6 - compressed",
  },
  { value: "::1", shouldPass: true, description: "Valid IPv6 - localhost" },
  { value: "::", shouldPass: true, description: "Valid IPv6 - all zeros" },
  {
    value: "256.1.1.1",
    shouldPass: false,
    description: "Invalid IPv4 - octet > 255",
  },
  {
    value: "192.168.1",
    shouldPass: false,
    description: "Invalid IPv4 - incomplete",
  },
  {
    value: "192.168.1.1.1",
    shouldPass: false,
    description: "Invalid IPv4 - too many octets",
  },
  {
    value: "192.168.01.1",
    shouldPass: false,
    description: "Invalid IPv4 - leading zeros",
  },
  {
    value: "not.an.ip.address",
    shouldPass: false,
    description: "Invalid IP - text",
  },
  { value: "", shouldPass: false, description: "Invalid IP - empty string" },
  {
    value: "192.168.1.-1",
    shouldPass: false,
    description: "Invalid IPv4 - negative octet",
  },
]);

// 4. Password Type Tests
const PasswordSchema = Interface({
  field: "password",
});

runTest("Password Type", PasswordSchema, [
  { value: "password123", shouldPass: true, description: "Simple password" },
  {
    value: "MySecureP@ssw0rd!",
    shouldPass: true,
    description: "Complex password with symbols",
  },
  {
    value: "verylongpasswordwithmanycharsandnumbers123456789",
    shouldPass: true,
    description: "Very long password",
  },
  {
    value: "P@$$w0rD",
    shouldPass: true,
    description: "Password with special characters",
  },
  { value: "123456", shouldPass: true, description: "Numeric password" },
  { value: "abcdef", shouldPass: true, description: "Alphabetic password" },
  {
    value: "   password   ",
    shouldPass: true,
    description: "Password with spaces",
  },
  { value: "", shouldPass: false, description: "Invalid password - empty" },
  {
    value: 123456,
    shouldPass: false,
    description: "Invalid password - number",
  },
  { value: true, shouldPass: false, description: "Invalid password - boolean" },
  { value: null, shouldPass: false, description: "Invalid password - null" },
  {
    value: undefined,
    shouldPass: false,
    description: "Invalid password - undefined",
  },
  { value: {}, shouldPass: false, description: "Invalid password - object" },
  { value: [], shouldPass: false, description: "Invalid password - array" },
]);

// 5. Object Type Tests
const ObjectSchema = Interface({
  field: "object",
});

runTest("Object Type", ObjectSchema, [
  { value: {}, shouldPass: true, description: "Empty object" },
  { value: { key: "value" }, shouldPass: true, description: "Simple object" },
  {
    value: { name: "John", age: 30, active: true },
    shouldPass: true,
    description: "Object with multiple properties",
  },
  {
    value: { nested: { deep: { value: 42 } } },
    shouldPass: true,
    description: "Nested object",
  },
  {
    value: { array: [1, 2, 3], object: { inner: true } },
    shouldPass: true,
    description: "Object with mixed content",
  },
  { value: new Date(), shouldPass: true, description: "Date object" },
  { value: new Error("test"), shouldPass: true, description: "Error object" },
  { value: /regex/, shouldPass: true, description: "RegExp object" },
  {
    value: "string",
    shouldPass: false,
    description: "Invalid object - string",
  },
  { value: 123, shouldPass: false, description: "Invalid object - number" },
  { value: true, shouldPass: false, description: "Invalid object - boolean" },
  { value: null, shouldPass: false, description: "Invalid object - null" },
  {
    value: undefined,
    shouldPass: false,
    description: "Invalid object - undefined",
  },
  {
    value: [],
    shouldPass: false,
    description: "Invalid object - array (depends on implementation)",
  },
  {
    value: function () {},
    shouldPass: false,
    description: "Invalid object - function",
  },
]);

// 6. URL Type Tests
const UrlSchema = Interface({
  field: "url",
});

runTest("URL Type", UrlSchema, [
  {
    value: "https://www.example.com",
    shouldPass: true,
    description: "Valid HTTPS URL",
  },
  {
    value: "http://example.com",
    shouldPass: true,
    description: "Valid HTTP URL",
  },
  {
    value: "https://subdomain.example.com/path?query=value#fragment",
    shouldPass: true,
    description: "Complex URL with all parts",
  },
  {
    value: "https://localhost:3000",
    shouldPass: true,
    description: "URL with port",
  },
  {
    value: "https://192.168.1.1:8080/api",
    shouldPass: true,
    description: "URL with IP and port",
  },
  {
    value: "ftp://files.example.com/file.txt",
    shouldPass: true,
    description: "FTP URL",
  },
  {
    value: "mailto:user@example.com",
    shouldPass: true,
    description: "Mailto URL",
  },
  {
    value: "file:///path/to/file.txt",
    shouldPass: true,
    description: "File URL",
  },
  {
    value: "ws://websocket.example.com",
    shouldPass: true,
    description: "WebSocket URL",
  },
  {
    value: "https://example.com/path with spaces",
    shouldPass: false,
    description: "Invalid URL - spaces in path",
  },
  {
    value: "not-a-url",
    shouldPass: false,
    description: "Invalid URL - no protocol",
  },
  {
    value: "https://",
    shouldPass: false,
    description: "Invalid URL - incomplete",
  },
  {
    value: "://example.com",
    shouldPass: false,
    description: "Invalid URL - missing protocol",
  },
  { value: "", shouldPass: false, description: "Invalid URL - empty string" },
  { value: 123, shouldPass: false, description: "Invalid URL - number" },
  { value: null, shouldPass: false, description: "Invalid URL - null" },
]);

// 7. Combined Schema Test
console.log("\n🔧 Testing Combined Schema with All New Types:");
console.log("=" + "=".repeat(45));

const CombinedSchema = Interface({
  config: "json",
  description: "text",
  serverIp: "ip",
  userPassword: "password",
  metadata: "object",
  homepage: "url",
});

const testData = {
  config: '{"theme": "dark", "notifications": true}',
  description:
    "This is a comprehensive test of all new types in Fortify Schema",
  serverIp: "192.168.1.100",
  userPassword: "SecureP@ssw0rd123!",
  metadata: { createdAt: new Date(), version: "1.0.0" },
  homepage: "https://nehonix.com",
};

console.log("\nTesting valid combined data:");
const combinedResult = CombinedSchema.safeParse(testData);
console.log(`Result: ${combinedResult.success ? "✅ VALID" : "❌ INVALID"}`);
if (combinedResult.success) {
  console.log("✅ All new types validated successfully!");
} else {
  console.log("❌ Validation errors:", combinedResult.errors);
}

// 8. Optional and Array Variations
console.log("\n🔄 Testing Optional and Array Variations:");
console.log("=" + "=".repeat(40));

const VariationsSchema = Interface({
  optionalJson: "json?",
  jsonArray: "json[]",
  optionalTextArray: "text[]?",
  ipList: "ip[](1,5)",
  passwordHistory: "password[](0,3)",
  objectCollection: "object[]",
  urlBookmarks: "url[]?",
});

const variationsData = {
  jsonArray: ['{"test": true}', '{"another": "value"}'],
  ipList: ["192.168.1.1", "10.0.0.1"],
  passwordHistory: ["oldpass1", "oldpass2"],
  objectCollection: [{ id: 1 }, { id: 2 }],
  urlBookmarks: ["https://example.com", "https://github.com"],
};

console.log("\nTesting variations:");
const variationsResult = VariationsSchema.safeParse(variationsData);
console.log(`Result: ${variationsResult.success ? "✅ VALID" : "❌ INVALID"}`);
if (!variationsResult.success) {
  console.log("Errors:", variationsResult.errors);
}

console.log("\n🎉 Test Suite Complete!");
console.log("=" + "=".repeat(25));
console.log(
  "Review the results above to identify areas for improvement in the new types implementation."
);
