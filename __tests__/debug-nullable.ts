import { Interface, Mod } from "../src";

const UserSchema = Interface({
  id: "number",
  name: "string",
  email: "email",
  age: "number?",
});

const nullable = Mod.nullable(UserSchema);

console.log("Definition:", (nullable as any).definition);

const result = nullable.safeParse({
  id: 1,
  name: "John",
  email: "john@example.com",
  age: 25,
});

console.log("Success:", result.success);
if (!result.success) {
  console.log("Errors:", result.errors);
}
