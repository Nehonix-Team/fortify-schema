import { Interface } from "../src";

const schema = Interface({
  videos: [
    {
      id: "string(1, 130)",
      title: "string(1, 110)",
      description: "string?",
      duration: "number",
      videoUrl: "url.https",
      thumbnailUrl: "url.https?",
      order: "number",
      isFree: "boolean?",
    },
  ],
});

console.log("=== Test 1: Empty array ===");
const test1 = schema.safeParse({
  videos: [],
});
console.log("Result:", test1.success ? "PASS" : "FAIL");
console.log("Data:", test1.data);
console.log("Errors:", test1.errors);

console.log("\n=== Test 2: Array with valid object ===");
const test2 = schema.safeParse({
  videos: [
    {
      id: 1,
      title: "Test Video",
      description: "A test",
      duration: 120,
      videoUrl: "https://example.com/video.mp4",
      thumbnailUrl: "https://example.com/thumb.jpg",
      order: 1,
      isFree: true,
    },
  ],
});
console.log("Result:", test2.success ? "PASS" : "FAIL");
if (test2.success) {
  console.error("==============BUG=========");
  console.error(
    "Type 'number' is not assignable to type 'string' but in the provided data ' id: 1,' is number so break the rules"
  );
}
console.log("Data:", test2.data);
console.log("Errors:", test2.errors);

console.log(
  "\n=== Test 3: Array with invalid object (missing required fields) ==="
);
const test3 = schema.safeParse({
  videos: [
    {
      id: "video-1",
      // Missing title, duration, videoUrl, order
    },
  ],
});
console.log("Result:", test3.success ? "PASS" : "FAIL");
console.log("Data:", test3.data);
console.log("Errors:", test3.errors);

console.log("\n=== Test 4: Array with invalid object (wrong types) ===");
const test4 = schema.safeParse({
  videos: [
    {
      id: 123, // Should be string
      title: "Test",
      duration: "not a number", // Should be number
      videoUrl: "not-a-url",
      order: 1,
    },
  ],
});
console.log("Result:", test4.success ? "PASS" : "FAIL");
console.log("Data:", test4.data);
console.log("Errors:", test4.errors);

console.log("\n=== Test 5: Not an array (should fail) ===");
const test5 = schema.safeParse({
  videos: {
    id: "video-1",
    title: "Test Video",
    description: "A test",
    duration: 120,
    videoUrl: "https://example.com/video.mp4",
    order: 1,
  },
});
console.log("Result:", test5.success ? "PASS" : "FAIL");
console.log("Data:", test5.data);
console.log("Errors:", test5.errors);

console.log("\n=== Test 6: Array with multiple objects ===");
const test6 = schema.safeParse({
  videos: [
    {
      id: "video-1",
      title: "Video 1",
      duration: 120,
      videoUrl: "https://example.com/video1.mp4",
      order: 1,
    },
    {
      id: "video-2",
      title: "Video 2",
      duration: 180,
      videoUrl: "https://example.com/video2.mp4",
      order: 2,
    },
  ],
});
console.log("Result:", test6.success ? "PASS" : "FAIL");
console.log("Data:", test6.data);
console.log("Errors:", test6.errors);

const normalObjectSchema = Interface({
  video: {
    id: "string(1, 130)",
    title: "string(1, 110)",
    description: "string?",
    duration: "number",
    videoUrl: "url.https",
    thumbnailUrl: "url.https?",
    order: "number",
    isFree: "boolean?",
  },
});

console.log("\n=== Test 7: Normal object ===");
const test7 = normalObjectSchema.safeParse({
  video: {
    id: 1,
    title: "Test Video",
    description: "A test",
    duration: 120,
    videoUrl: "https://example.com/video.mp4",
    order: 1,
  },
});
console.log("Result:", test7.success ? "PASS" : "FAIL");
if (!test7.success) {
  console.info("TEST FAILED AS EXPECTED");
}
console.log("Data:", test7.data);
console.log("Errors:", test7.errors);
