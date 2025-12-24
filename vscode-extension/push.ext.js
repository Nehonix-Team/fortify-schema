/**
 * Automaticly publish ext to sdk.
 * Src: https://dll.nehonix.com/sdks/pkgs/mods/vscode/['version' or 'latest']/fortify-schema.vsix
 * VFile: fortify-schema-vscode-0.1.0.vsix
 */

const fs = require("fs");
const p = require("path");

console.log("=".repeat(50));
console.log("Pushing extension 👨‍🦼🏃‍♂️");

// source to stock exts
const src = "./pkgs/mods/vscode";

//name for the ext
const extName = "fortify-schema-vscode";

const extModule = ".";

// get ext version
const version = require(extModule + "/package.json").version;

console.log("✅ version>" + version);

// Read the ext pkg
let vsixContent;

try {
  const extPath = p.join(__dirname, extModule, `${extName}-${version}.vsix`);
  console.log("Reading vsix from: " + extPath);
  vsixContent = fs.readFileSync(extPath);

  //delete path
  fs.unlinkSync(extPath);
  console.log("✅ Read success");
} catch (error) {
  console.error("❌ Reading error");
  throw new Error(error.message || error);
}

// Storing module
try {
  const stockVersion = [version, "latest"];
  for (const v of stockVersion) {
    const stockPath = p.join(__dirname, src, `${v}/fortify-schema.vsix`);
    const stockDir = p.dirname(stockPath);
    console.log("Storing to: ", stockDir);
    if (!fs.existsSync(stockDir)) {
      fs.mkdirSync(stockDir, { recursive: true });

      console.log("✅ Dir created ");
    }

    fs.writeFileSync(stockPath, vsixContent);

    console.log("✅ Stored to " + stockPath);
  }
} catch (error) {
  console.error("❌ Storing error");
  throw new Error(error);
}

console.log("😎 completed");
