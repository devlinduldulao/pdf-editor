---
agent: "implementation"
model: Claude Sonnet 4.5
description: "Debug issues and provide solutions"
tools: ["read/readFile", "search/codebase", "web/fetch"]
---

# Debug and Troubleshoot

Help identify and fix issues in the codebase by analyzing errors, logs, and code patterns.

## Information Gathering

Ask the user for:

1. **Error message** (exact text, stack trace)
2. **When does it occur?** (on load, on action, specific conditions)
3. **What were you trying to do?**
4. **Recent changes** (if any)
5. **Browser/environment** (if relevant)

## Debugging Process

### 1. Analyze the Error

- Read the full error message and stack trace
- Identify the file and line number where error occurred
- Understand the error type (TypeError, ReferenceError, etc.)

### 2. Search for Context

```
Search for:
- The component/function where error occurs
- Related API calls or data operations
- Similar error handling in codebase
- Recent changes to affected files
```

### 3. Identify Common Issues

#### TypeScript Errors

- **Type mismatch**: Check if types align
- **Null/undefined**: Add optional chaining or null checks
- **Missing properties**: Verify API response structure
- **Any usage**: Replace with proper types

#### React Errors

- **Hooks called conditionally**: Ensure hooks called at top level
- **Missing dependencies**: Check useEffect/useCallback/useMemo deps
- **State updates on unmounted**: Add cleanup in useEffect
- **Infinite renders**: Check if effect dependencies cause loops

#### TanStack Query Errors

- **Query key mismatch**: Ensure query keys match
- **Stale data**: Check cache invalidation
- **Loading states**: Verify Suspense boundaries
- **Mutation errors**: Check error handling

#### TanStack Router Errors

- **Route not found**: Check route path definition
- **Params undefined**: Verify route params usage
- **Loader errors**: Check data loading logic
- **Navigation errors**: Verify navigation paths

#### Form Errors (React Hook Form + Zod)

- **Validation not working**: Check Zod schema
- **Form not submitting**: Check handleSubmit wrapper
- **Default values**: Ensure defaultValues match schema
- **Field registration**: Verify field names match schema

#### API Integration Errors

- **Network errors**: Check API endpoint and CORS
- **401/403**: Verify authentication token
- **404**: Check API route and parameters
- **500**: Check request payload format
- **Type errors**: Verify API types match actual response

#### Build/Runtime Errors

- **Import errors**: Check file paths and exports
- **Module not found**: Verify package installation
- **Circular dependency**: Check import structure
- **Environment variables**: Check .env configuration

### 4. Check Common Patterns

#### Naming Convention Issues (CRITICAL)

```typescript
// ❌ Common mistake - snake_case
function get_user_data() { ... }
const user_name = "John";

// ✅ Correct - camelCase
function getUserData() { ... }
const userName = "John";
```

#### Missing Error Boundaries

```tsx
// ❌ No error handling
<MyComponent />

// ✅ With error boundary
<ErrorBoundary fallback={<ErrorFallback />}>
  <MyComponent />
</ErrorBoundary>
```

#### Missing Suspense Boundaries

```tsx
// ❌ No loading state
<AsyncComponent />

// ✅ With Suspense
<Suspense fallback={<Skeleton />}>
  <AsyncComponent />
</Suspense>
```

#### Incorrect Hook Usage

```tsx
// ❌ Conditional hook
if (condition) {
  useEffect(() => { ... });
}

// ✅ Effect with condition inside
useEffect(() => {
  if (condition) { ... }
}, [condition]);
```

## Debugging Checklist

### General

- [ ] Read full error message and stack trace
- [ ] Identify exact file and line number
- [ ] Check recent git changes
- [ ] Review related code sections

### TypeScript

- [ ] Check type definitions match usage
- [ ] Verify API types match actual responses
- [ ] Look for `any` types that should be specific
- [ ] Check for null/undefined handling

### React

- [ ] Verify hooks are called unconditionally
- [ ] Check useEffect dependencies
- [ ] Look for state updates on unmounted components
- [ ] Check for infinite render loops

### Data Fetching

- [ ] Verify query keys are correct
- [ ] Check loader implementation
- [ ] Ensure Suspense boundaries exist
- [ ] Check mutation error handling

### Forms

- [ ] Verify Zod schema matches form structure
- [ ] Check defaultValues match schema
- [ ] Ensure field names use camelCase
- [ ] Verify form submission logic

### Build/Deploy

- [ ] Check package.json for missing dependencies
- [ ] Verify environment variables are set
- [ ] Check for import path errors
- [ ] Run type check: `npm run typecheck`
- [ ] Run linter: `npm run lint`

## Solution Format

Provide solutions in this format:

### Problem Summary

Brief description of the issue

### Root Cause

Explain why the error is occurring

### Solution

```tsx
// ❌ Before (incorrect)
[problematic code]

// ✅ After (correct)
[corrected code]
```

### Explanation

Why this solution fixes the issue

### Prevention

How to avoid this issue in the future

## Common Solutions

### TypeScript Type Error

```typescript
// ❌ Problem
const user = data?.user; // Type unknown

// ✅ Solution
const user = data?.user as User;
// Or better: define proper return type
function getUser(): User | undefined { ... }
```

### React Hook Dependency Warning

```typescript
// ❌ Problem
useEffect(() => {
  fetchData(userId);
}, []); // Missing userId dependency

// ✅ Solution
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

### Query Not Updating

```typescript
// ❌ Problem
mutation.mutate(data);
// Cache not invalidated

// ✅ Solution
mutation.mutate(data, {
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
  },
});
```

### Form Not Submitting

```tsx
// ❌ Problem
<form onSubmit={handleSubmit}>

// ✅ Solution
<form onSubmit={form.handleSubmit(handleSubmit)}>
```

### Route Not Found

```tsx
// ❌ Problem
export const Route = createFileRoute("/app/applicationId/");

// ✅ Solution (dynamic param)
export const Route = createFileRoute("/app/$applicationId/");
```

## Testing the Fix

After proposing a solution:

1. Explain how to test the fix
2. Suggest what to look for to verify it works
3. Recommend related tests to run
4. Suggest monitoring for related issues

## Follow-up Questions

- Does this solve your issue?
- Are there any related errors appearing?
- Would you like me to explain any part in more detail?
- Should we add tests to prevent this issue?
- Would you like me to implement the fix?
