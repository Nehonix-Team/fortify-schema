import { Interface, Mod } from "../src";

// Schema 1: Array of objects (empty arrays are VALID by default)
const schemaAllowEmpty = Interface({
  id: "string(1, 130)",
  title: "string(1, 110)",
  description: "string?",
  order: "number",
  duration: "number",
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

// Test 2: Array with valid data should PASS
const test2 = schemaAllowEmpty.safeParse({
  duration: 12,
  id: "1822",
  order: 12,
  title: "test",
  description: "tst",
  videos: [
    {
      id: "video-1",
      title: "Introduction",
      description: "Intro video",
      duration: 120,
      videoUrl: "https://example.com/video1.mp4",
      thumbnailUrl: "https://example.com/thumb1.jpg",
      order: 1,
      isFree: true,
    },
  ],
});

console.log("\n=== Test 2: Array with valid data (should PASS) ===");
if (test2.success) {
  console.log("✅ Passed:", test2.data);
} else {
  console.log("❌ Failed:", test2.errors);
}
