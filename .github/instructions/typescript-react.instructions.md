---
applyTo: "**/*.ts,**/*.tsx"
---

# TypeScript and React Development Standards

Apply these standards to all TypeScript and React code in this project.

## Naming Conventions (CRITICAL)

### ✅ REQUIRED: camelCase

- Functions: `getUserData()`, `handleSubmit()`, `calculateTotal()`
- Variables: `userName`, `totalCount`, `isLoading`
- Methods: `fetchData()`, `updateProfile()`, `validateForm()`
- Parameters: `userId`, `emailAddress`, `isActive`

### ❌ NEVER USE: snake_case

- **NEVER** use `get_user_data()`, `user_name`, `is_loading`, etc.
- This is a critical project requirement and must be followed strictly

### ✅ Other Conventions

- Components: `PascalCase` - `UserProfile`, `DataTable`, `FormInput`
- **File Names**: `kebab-case` - `user-profile.tsx`, `data-table.tsx`, `form-input.tsx` (NEVER use PascalCase for files)
- Types/Interfaces: `PascalCase` - `UserData`, `ApiResponse`, `FormValues`
- Constants: `ALL_CAPS` - `MAX_RETRIES`, `API_ENDPOINT`, `DEFAULT_TIMEOUT`
- Private members: `_privateMember` (prefix with underscore)

## TypeScript Guidelines

### Type Safety

- Use strict mode (no `any` unless absolutely necessary)
- Define explicit types for function parameters and return values
- Use `interface` for object shapes, `type` for unions/intersections
- Use `unknown` instead of `any` when type is truly unknown
- Leverage type inference where appropriate

### React Component Types

```tsx
// ✅ Good
interface UserProfileProps {
  userId: string;
  onUpdate: (data: UserData) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  // Implementation
};

// ❌ Avoid
const UserProfile = (props: any) => { ... };
```

## React Best Practices

### Functional Components

- Always use functional components with hooks
- No class components in new code
- Use `React.FC` type for components with children

### Hooks Rules

- Don't call hooks conditionally
- Don't call hooks in loops
- Don't call hooks in nested functions
- Always include all dependencies in useEffect/useCallback/useMemo

### Component Structure

```tsx
// ✅ Good structure
function MyComponent({ prop1, prop2 }: MyComponentProps) {
  // 1. Hooks
  const [state, setState] = useState();
  const query = useQuery(...);

  // 2. Derived state
  const derivedValue = useMemo(() => ..., [deps]);

  // 3. Event handlers
  const handleClick = useCallback(() => ..., [deps]);

  // 4. Effects
  useEffect(() => ..., [deps]);

  // 5. Render
  return <div>...</div>;
}
```

### Performance

- Use `useMemo` for expensive calculations
- Use `useCallback` for functions passed to child components
- Use React.memo for expensive components
- Rely on React Compiler for automatic optimizations
- Avoid unnecessary re-renders

## Forms (React Hook Form + Zod)

### Form Definition Pattern

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ✅ Define schema
const formSchema = z.object({
  emailAddress: z.string().email("Invalid email"),
  userName: z.string().min(1, "Name is required"),
});

// ✅ Infer TypeScript type
type FormValues = z.infer<typeof formSchema>;

// ✅ Use in component
const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    emailAddress: "",
    userName: "",
  },
});
```

### Form Field Pattern

```tsx
<FormField
  control={form.control}
  name="emailAddress"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input {...field} type="email" />
      </FormControl>
      <FormDescription>Your email address</FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

## State Management

### Server State (TanStack Query)

```tsx
// ✅ Use for API data
const { data, isLoading, error } = useSuspenseQuery(applicationGetOptions({ path: { applicationId } }));

// ✅ Mutations
const mutation = useMutation({
  ...applicationUpdateMutation(queryClient),
  onSuccess: () => {
    toast.success("Updated successfully");
  },
});
```

### Client State (Zustand)

```tsx
// ✅ Use for UI state, preferences, etc.
interface MyStore {
  selectedId: string | null;
  setSelectedId: (id: string) => void;
}

export const useMyStore = create<MyStore>()(
  persist(
    (set) => ({
      selectedId: null,
      setSelectedId: (id) => set({ selectedId: id }),
    }),
    { name: "my-store" },
  ),
);
```

## Error Handling

### Component Level

```tsx
// ✅ Use Error Boundaries
import { ErrorBoundary } from "react-error-boundary";

<ErrorBoundary fallback={<ErrorFallback />}>
  <MyComponent />
</ErrorBoundary>;
```

### Async Operations

```tsx
// ✅ Try-catch for async
const handleSubmit = async (data: FormValues) => {
  try {
    await apiCall(data);
    toast.success("Success!");
  } catch (error) {
    toast.error(`Failed: ${error.message}`);
  }
};
```

## Styling (Tailwind CSS 4)

### Utility Classes

```tsx
// ✅ Use Tailwind utilities
<div className="flex items-center gap-4 rounded-lg bg-background p-4">

// ✅ Use cn() for conditional classes
<div className={cn(
  "rounded-lg p-4",
  isActive && "bg-primary text-white",
  error && "border-destructive"
)}>
```

### shadcn/ui Components

- Use components from `src/components/ui/`
- Don't modify UI components directly
- Compose complex components from shadcn primitives

## Accessibility

- Use semantic HTML (`button`, `nav`, `main`, `article`, etc.)
- Add ARIA labels where needed
- Ensure keyboard navigation works
- Maintain color contrast for WCAG compliance
- Test with screen readers

## File Imports

### Import Order

```tsx
// 1. External libraries
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// 2. Internal modules (absolute imports)
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

// 3. Relative imports
import { FormSection } from "./form-section";

// 4. Types
import type { User } from "@/api/client/types.gen";
```

### Prefer Absolute Imports

```tsx
// ✅ Good
import { Button } from "@/components/ui/button";

// ❌ Avoid
import { Button } from "../../../components/ui/button";
```

## Code Organization

- Keep files under 300 lines when possible
- Extract complex logic into custom hooks
- Create reusable utility functions
- Group related components together
- Use `-components/` folders for route-specific components

## Documentation

- Add JSDoc comments for complex functions
- Document non-obvious behavior
- Include type information in comments
- Explain "why" not "what"

```tsx
/**
 * Validates user email against domain whitelist
 * @param email - User email address to validate
 * @returns True if email domain is allowed
 */
function validateEmail(email: string): boolean {
  // Implementation
}
```
