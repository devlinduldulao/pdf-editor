---
name: this-project
description: ThisProject development skill for building enterprise React applications with TanStack Router, TanStack Query, Zustand, shadcn/ui, Tailwind CSS 4.1, and Azure MSAL authentication. Use this skill when writing, reviewing, or generating code for this project to ensure consistent patterns, conventions, and best practices.
license: MIT
metadata:
  author: ThisProject Team
  version: "1.0.0"
---

# ThisProject Development Skill

Comprehensive development guide for the ThisProject enterprise React application. This skill ensures consistent code patterns, architecture best practices, and adherence to project conventions across all development tasks.

## When to Apply

Reference these guidelines when:

- Creating new React components, routes, or pages
- Implementing data fetching with TanStack Query
- Setting up routing with TanStack Router
- Managing state with Zustand
- Building forms with React Hook Form + Zod 4
- Writing tests with Vitest
- Implementing UI with shadcn/ui components
- Handling authentication with Azure MSAL

## Technology Stack

| Category             | Technology                    | Version |
| -------------------- | ----------------------------- | ------- |
| **Framework**        | React                         | 19.2    |
| **Routing**          | TanStack Router               | 1.x     |
| **Data Fetching**    | TanStack Query                | 5.x     |
| **State Management** | Zustand                       | 5.x     |
| **Styling**          | Tailwind CSS                  | 4.1     |
| **UI Components**    | shadcn/ui + Base UI           | Latest  |
| **Forms**            | React Hook Form               | 7.x     |
| **Validation**       | Zod                           | 4.x     |
| **Testing**          | Vitest + Testing Library      | Latest  |
| **API Client**       | Hey API (@hey-api/openapi-ts) | 0.91.x  |
| **Icons**            | Phosphor Icons                | 2.x     |
| **Auth**             | Azure MSAL                    | 5.x     |
| **Build**            | Vite                          | 8.x     |

## Project Structure

```
src/
├── api/                     # API client (auto-generated)
│   └── client/
│       ├── @tanstack/       # Generated TanStack Query hooks
│       ├── types.gen.ts     # Generated TypeScript types
│       ├── zod.gen.ts       # Generated Zod schemas
│       └── sdk.gen.ts       # Generated SDK functions
├── auth/                    # Azure MSAL configuration
├── components/              # Shared components
│   ├── ui/                  # shadcn/ui components
│   ├── modals/              # Modal components
│   └── errors/              # Error components
├── config/                  # Environment configuration
├── hooks/                   # Custom React hooks
├── lib/                     # Utility functions
├── models/                  # TypeScript interfaces/types
├── routes/                  # TanStack Router file-based routes
│   ├── app/                 # Authenticated routes
│   │   ├── $applicationId/  # Dynamic route
│   │   ├── -components/     # Route-specific components
│   │   ├── -skeletons/      # Loading skeletons
│   │   └── -tests/          # Route tests
│   └── __root.tsx           # Root layout
├── state/                   # Zustand stores
│   ├── client/              # Client-side stores
│   └── server/              # Server-side state
└── testing/                 # Test utilities
```

## Critical Naming Conventions

### ✅ REQUIRED: camelCase for All Code

```typescript
// ✅ Good - camelCase
const userName = "John";
function getUserData() {}
const handleSubmit = () => {};

// ❌ NEVER use snake_case
const user_name = "John"; // WRONG
function get_user_data() {} // WRONG
```

### File Naming

```
// ✅ Good - kebab-case for files
user-profile.tsx
data-table.tsx
use-auth.ts

// ❌ Bad - PascalCase for files
UserProfile.tsx  // WRONG
```

### Component & Type Naming

```typescript
// ✅ Good
const UserProfile: React.FC<UserProfileProps> = () => {};
interface ApiResponse {}
type FormValues = z.infer<typeof schema>;
const MAX_RETRIES = 3;

// ❌ Bad
const userProfile = () => {}; // Should be PascalCase for components
```

## Data Fetching Patterns

### Route Loader with Prefetch Pattern

Use `void` to prefetch data without blocking route transitions:

```typescript
// ✅ Good - Prefetch pattern in loaders
export const Route = createFileRoute("/app/$applicationId/")({
  loader: ({ context: { queryClient }, params: { applicationId } }) => {
    // Use void to prefetch without blocking
    void queryClient.ensureQueryData(applicationGetOptions({ path: { applicationId } }));

    // Return data for breadcrumbs/context
    return { crumb: "application" };
  },
  pendingComponent: ApplicationSkeleton,
  component: RouteComponent,
});
```

### Query with useSuspenseQuery

```typescript
// ✅ Good - Use useSuspenseQuery with loader prefetch
function RouteComponent() {
  const { applicationId } = Route.useParams();
  const { data } = useSuspenseQuery(
    applicationGetOptions({ path: { applicationId } })
  );

  return <div>{data.name}</div>;
}
```

### Mutations with Cache Invalidation

```typescript
// ✅ Good - Mutation pattern
const mutation = useMutation({
  ...applicationUpdateMutation(queryClient),
  onSuccess: () => {
    toast.success("Application updated successfully");
  },
  onError: (error) => {
    toast.error(`Update failed: ${error.message}`);
  },
});
```

## Routing Patterns

### File-Based Route Structure

```typescript
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/$applicationId/")({
  // 1. Loader for data prefetching
  loader: ({ context, params }) => {
    void context.queryClient.ensureQueryData(applicationGetOptions({ path: params }));
    return { crumb: "application" };
  },

  // 2. Auth/permissions check
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },

  // 3. Component
  component: RouteComponent,

  // 4. Loading skeleton
  pendingComponent: ApplicationSkeleton,

  // 5. Error handling
  errorComponent: ErrorComponent,
});
```

### Type-Safe Navigation

```typescript
import { Link } from "@tanstack/react-router";

// ✅ Good - Type-safe navigation
<Link to="/app/$applicationId" params={{ applicationId: "123" }}>
  View Application
</Link>

// ✅ With search params
<Link to="/users" search={{ page: 1, filter: "active" }}>
  Users
</Link>
```

## State Management with Zustand

### Store Pattern

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

type WorkspaceState = {
  selectedWorkspaceId: string | null;
  setSelectedWorkspaceId: (workspaceId: string) => void;
  clearSelectedWorkspace: () => void;
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      selectedWorkspaceId: null,
      setSelectedWorkspaceId: (workspaceId) => set({ selectedWorkspaceId: workspaceId }),
      clearSelectedWorkspace: () => set({ selectedWorkspaceId: null }),
    }),
    { name: "workspace-storage" },
  ),
);
```

## Form Handling Patterns

### React Hook Form + Zod

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// 1. Define schema
const formSchema = z.object({
  emailAddress: z.string().email("Invalid email"),
  userName: z.string().min(1, "Name is required"),
});

// 2. Infer type from schema
type FormValues = z.infer<typeof formSchema>;

// 3. Use in component
function MyForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emailAddress: "",
      userName: "",
    },
  });

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="emailAddress"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input {...field} type="email" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  );
}
```

## UI Component Patterns

### Theme-Aware Design

Always use CSS theme variables:

```typescript
// ✅ Good - Uses theme tokens
<div className="bg-background text-foreground border-border">

// ❌ Bad - Hardcoded colors
<div className="bg-white text-black border-gray-300">
```

### Icon Convention

Use Phosphor Icons with `Icon` suffix:

```typescript
import { MoonIcon, CheckIcon, PlusIcon } from "@phosphor-icons/react";

<Button>
  <PlusIcon className="mr-2 size-4" />
  Add Item
</Button>
```

### Component Composition

```typescript
// Card pattern
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
    <CardAction>
      <Button variant="ghost" size="icon">
        <MoreVerticalIcon />
      </Button>
    </CardAction>
  </CardHeader>
  <CardContent>{/* Content */}</CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Loading States

```typescript
// Route-specific skeleton pattern
function ApplicationSkeleton() {
  return (
    <div className="flex gap-6 overflow-auto">
      <Skeleton className="h-[156px] sm:h-48" />
    </div>
  );
}
```

## Testing Patterns

### Test Structure

```typescript
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, waitFor } from "@/testing/test-utils";
import userEvent from "@testing-library/user-event";

describe("ComponentName", () => {
  describe("feature group", () => {
    it("should do specific thing", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      renderWithProviders(<MyComponent />);
      await user.click(screen.getByRole("button"));

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Expected")).toBeInTheDocument();
      });
    });
  });
});
```

### Test Location

- Place tests in `-tests/` folders within routes
- Or alongside components: `component.test.tsx`

## API Client Usage

### Generated Client Imports

```typescript
// Types
import type { Application } from "@/api/client/types.gen";

// Zod schemas
import { zApplication } from "@/api/client/zod.gen";

// Query hooks
import { applicationGetOptions, applicationsListOptions } from "@/api/client/@tanstack/react-query.gen";

// Mutations
import { applicationUpdateMutation } from "@/api/client/@tanstack/react-query.gen";
```

### Never Modify Generated Files

Generated files in `src/api/client/` are auto-generated from OpenAPI spec. Update `swagger.json` and run:

```bash
npm run openapi-ts
```

## Authentication Pattern

Azure MSAL v5 is configured in `src/auth/config.ts`:

```typescript
import useAuth from "@/hooks/use-auth";

function ProtectedComponent() {
  const auth = useAuth();

  if (auth.status !== "loggedIn") {
    return <Login />;
  }

  return <AuthenticatedContent />;
}
```

## Key Best Practices

### 1. Performance

- Use React Compiler for automatic optimizations
- Prefetch data in loaders with `void` pattern
- Use `useSuspenseQuery` with route loading
- Implement proper skeletons for all routes

### 2. Type Safety

- Always use generated types from API client
- Define explicit types for function parameters
- Use `z.infer<typeof schema>` for form types

### 3. Code Organization

- Keep route-specific code in route folders
- Use `-components/`, `-skeletons/`, `-tests/` prefixes
- Share reusable components in `src/components/`

### 4. Error Handling

- Use `errorComponent` in routes
- Show user-friendly error messages with `toast`
- Implement proper error boundaries

### 5. Styling

- Use Tailwind CSS theme variables
- Follow the 3-theme system (Light, Dark, Dim)
- Use `glass-panel` for floating elements
- Apply `animate-enter-up` with staggered delays

## Quick Reference Commands

```bash
# Development
npm run dev           # Start dev server on port 3000
npm run build         # Build for production
npm run typecheck     # Type check with tsgo

# Testing
npm run test          # Run tests once
npm run test:watch    # Watch mode
npm run test:coverage # With coverage

# API Client
npm run openapi-ts    # Regenerate API client
npm run update-swagger-pwsh  # Update OpenAPI spec (PowerShell)
npm run update-swagger-bash  # Update OpenAPI spec (Bash)

# Linting
npm run lint          # Run oxlint
```

## Additional Resources

See instruction files in `.github/instructions/` for detailed patterns:

- `api-integration.instructions.md` - API patterns
- `tanstack-router.instructions.md` - Routing patterns
- `testing.instructions.md` - Testing patterns
- `typescript-react.instructions.md` - TS/React conventions
- `ui-design-system.instructions.md` - UI/styling guidelines
