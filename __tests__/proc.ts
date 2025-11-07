import { Interface, Mod } from "../src";

const DigitalProductConfig = Interface({
  type: "course|ebook",
  level: "string?",
  language: "string?",
  author: "string?",
  totalDuration: "number?",
  // Optionnal modules
  modules: [
    {
      id: "string",
      title: "string",
      description: "string?",
      order: "number",
      duration: "number",
      videos: [
        {
          id: "string",
          title: "string",
          description: "string?",
          duration: "number",
          videoUrl: "url",
          thumbnailUrl: "url?",
          order: "number",
          isFree: "boolean?",
        },
      ],
    },
  ],
  // Optionnal resources
  resources: [
    {
      id: "string",
      title: "string",
      type: "pdf|code|exercise|solution|slides|template|document|other",
      fileName: "string",
      fileSize: "number",
      url: "url",
      downloadUrl: "url",
    },
  ],
});

const DigitalProductConfigSchema = Mod.makeOptional(DigitalProductConfig, [
  "modules",
  "resources",
]);

//minimal config should pass
const products = DigitalProductConfigSchema.safeParse({
  type: "ebook",
});

if (products.success) {
  console.log("Test passed: ", products.data);
} else {
  console.error("===============BUG===============");
  console.error(
    "Minimal config should pass since all properties except 'types' are optional"
  );
  console.log("❌ not passed: ", products.errors);
}
