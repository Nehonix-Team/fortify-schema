import { Interface } from "fortify-schema";

// Test custom error message syntax highlighting
const userSchema = Interface({
  // Basic custom error message
  name: "string --> Please provide a valid name",
  
  // With constraints
  age: "number(18,100) --> Age must be between 18 and 100",
  
  // With required marker
  email: "email! --> Please provide a valid email address",
  
  // With optional marker
  phone: "string? --> Phone number must be a string if provided",
  
  // Complex example
  username: "string(3,20)! --> Username must be 3-20 characters",
  
  // Nested object
  profile: {
    bio: "string(10,500) --> Bio must be between 10 and 500 characters",
    avatar: "url! --> Please provide a valid avatar URL",
  },
  
  // Array with custom message
  tags: "string[] --> Tags must be an array of strings",
  
  // Union with custom message
  role: "admin|user|guest --> Role must be admin, user, or guest",
});

// Test without custom messages (should still work)
const simpleSchema = Interface({
  id: "number!",
  title: "string?",
  status: "pending|approved|rejected",
});
