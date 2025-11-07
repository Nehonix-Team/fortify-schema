import { Interface, Mod } from "../src";

const UserSchema = Interface({
  id: "number",
  name: "string",
  email: "email",
  age: "number?",
});

const ProfileSchema = Interface({
  bio: "string?",
  avatar: "url?",
  social: {
    twitter: "string?",
    github: "string?",
  },
});

const merged = Mod.merge(UserSchema, ProfileSchema);

console.log("Merged definition:", (merged as any).definition);

const result = merged.safeParse({
  id: 1,
  name: "John",
  email: "john@example.com",
  bio: "Developer",
});

console.log("Success:", result.success);
if (!result.success) {
  console.log("Errors:", result.errors);
}
