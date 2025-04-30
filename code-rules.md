# Code Review & Suggestion Rules

## 1. Code Analysis First
- Review all related files before suggesting changes
- Document dependencies between files
- Note existing patterns and conventions
- Identify reusable code/functions

## 2. Documentation Requirements
- Use JSDoc comments for all functions
- Explain complex logic with inline comments
- Document file relationships
- Note any side effects

## 3. Code Style
- Match existing indentation and spacing
- Follow established naming conventions
- Keep consistent error handling patterns
- Use existing constant values

## 4. Code Organization
- No duplicate functionality
- Use existing utilities when possible
- Keep related code together
- Follow project structure

## 5. Change Process
1. Show original code
2. Explain why change is needed
3. Show modified code
4. Explain impacts
5. List affected files

## 6. Format for Code Suggestions
```javascript
// filepath: /path/to/file.js
// BEFORE:
// ...show relevant existing code...

// AFTER:
// ...show modified code...

// EXPLANATION:
// - Why the change is needed
// - What it accomplishes
// - Side effects to consider
```