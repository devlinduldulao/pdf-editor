---
agent: "implementation"
model: Claude Sonnet 4.5
description: "Create a new TanStack Router route with data loading"
tools: ["edit", "read/readFile", "search/codebase"]
---

# Generate TanStack Router Route

Create a new route using TanStack Router's file-based routing system with proper data loading and error handling.

## Input Requirements

Ask the user for:

1. **Route path** (e.g., `/app/$applicationId/settings`)
2. **Route purpose** (what does this page show?)
3. **Dynamic parameters** (if any, e.g., `applicationId`, `userId`)
4. **Data requirements** (what data needs to be loaded?)
5. **Search parameters** (if any, e.g., pagination, filters)
6. **Protected route?** (requires authentication/authorization?)

## Research Phase

Before creating the route:

1. Review existing route patterns:
   - `src/routes/app/$applicationId/index.tsx`
   - `src/routes/create-application/index.tsx`
2. Check if API endpoints exist for required data
3. Identify reusable components and patterns
4. Check for existing loaders and query options

## Route File Structure

### 1. Basic Route (No Data Loading)

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/path/to/route")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <h1>Page Title</h1>
      {/* Page content */}
    </div>
  );
}
```

### 2. Route with Data Loading

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { applicationGetOptions } from "@/api/client/@tanstack/react-query.gen";
import { SmartRouteError } from "@/components/errors/SmartRouteError";
import { ApplicationSkeleton } from "./-skeletons/application-skeleton";

export const Route = createFileRoute("/app/$applicationId/")({
  // Loader - prefetch data using void pattern
  loader: ({ context: { queryClient }, params: { applicationId } }) => {
    void queryClient.ensureQueryData(applicationGetOptions({ path: { applicationId } }));
  },

  // Component
  component: RouteComponent,

  // Error handling
  errorComponent: ({ error }) => <SmartRouteError error={error} resourceName="application" />,

  // Pending component - use route-specific skeleton
  pendingComponent: ApplicationSkeleton,
});

function RouteComponent() {
  const { applicationId } = Route.useParams();
  const { data: application } = useSuspenseQuery(applicationGetOptions({ path: { applicationId } }));

  return (
    <div>
      <h1>{application.name}</h1>
      {/* More content */}
    </div>
  );
}
```

### 3. Route with Multiple Data Dependencies

```tsx
loader: ({ context: { queryClient }, params }) => {
  // Prefetch multiple data sources using void pattern
  void queryClient.ensureQueryData(
    applicationGetOptions({ path: { applicationId: params.applicationId } })
  );
  void queryClient.ensureQueryData(
    getEnvironmentsOptions({ path: { applicationId: params.applicationId } })
  );
  void queryClient.ensureQueryData(
    servicesGetOptions({ path: { applicationId: params.applicationId } })
  );
},
```

### 4. Route with Search Parameters

```tsx
import { z } from "zod";

const searchSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(10).max(100).default(20),
  filter: z.string().optional(),
  sort: z.enum(["asc", "desc"]).default("asc"),
});

export const Route = createFileRoute("/users/")({
  validateSearch: searchSchema,

  loader: ({ context: { queryClient }, search }) => {
    void queryClient.ensureQueryData(
      usersListOptions({
        query: {
          page: search.page,
          pageSize: search.pageSize,
          filter: search.filter,
          sort: search.sort,
        },
      }),
    );
  },

  component: UsersComponent,
});

function UsersComponent() {
  const { page, pageSize, filter, sort } = Route.useSearch();
  const navigate = useNavigate();

  const { data } = useSuspenseQuery(
    usersListOptions({
      query: { page, pageSize, filter, sort },
    }),
  );

  const handlePageChange = (newPage: number) => {
    navigate({ search: { page: newPage, pageSize, filter, sort } });
  };

  return <div>{/* Component content */}</div>;
}
```

### 5. Protected Route (Authentication)

```tsx
import { redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  beforeLoad: ({ context }) => {
    // Check authentication
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: "/login" });
    }

    // Check authorization
    if (!context.auth.user?.isAdmin) {
      throw redirect({ to: "/" });
    }
  },

  component: AdminComponent,
});
```

## File Organization

Create these files in the route folder:

```
src/routes/path/to/route/
├── index.tsx                    # Main route file
├── -components/                 # Route-specific components
│   ├── component-one.tsx
│   └── component-two.tsx
├── -skeletons/                  # Loading skeletons
│   └── page-skeleton.tsx
└── -tests/                      # Route tests
    └── index.test.tsx
```

## Loading States

### Create Skeleton Component

```tsx
// -skeletons/application-details-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function ApplicationDetailsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-32 w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
```

### Use Suspense Boundaries

```tsx
import { Suspense } from "react";

function RouteComponent() {
  return (
    <div>
      <h1>Application Details</h1>

      <Suspense fallback={<ApplicationDetailsSkeleton />}>
        <ApplicationDetails />
      </Suspense>

      <Suspense fallback={<EnvironmentsSkeleton />}>
        <Environments />
      </Suspense>
    </div>
  );
}
```

## Error Handling

### Use Smart Error Component

```tsx
import { SmartRouteError } from "@/components/errors/SmartRouteError";

export const Route = createFileRoute("/app/$applicationId/")({
  errorComponent: ({ error, reset }) => <SmartRouteError error={error} resourceName="application" reset={reset} />,
});
```

### Custom Error Component

```tsx
function CustomErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <h2 className="mb-4 text-2xl font-bold">Something went wrong</h2>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
```

## Navigation

### Link to Route

```tsx
import { Link } from "@tanstack/react-router";

<Link
  to="/app/$applicationId"
  params={{ applicationId: "123" }}
>
  View Application
</Link>

// With search params
<Link
  to="/users"
  search={{ page: 2, filter: "active" }}
>
  Next Page
</Link>
```

### Programmatic Navigation

```tsx
import { useNavigate } from "@tanstack/react-router";

function MyComponent() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate({
      to: "/app/$applicationId",
      params: { applicationId: "123" },
    });
  };

  return <button onClick={handleClick}>Go to App</button>;
}
```

## Testing

Create a test file in `-tests/index.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { Route } from "./index";

describe("Route: /app/$applicationId", () => {
  it("has correct path", () => {
    expect(Route.options.path).toBe("/app/$applicationId");
  });

  it("has component defined", () => {
    expect(Route.options.component).toBeDefined();
  });

  it("has loader defined", () => {
    expect(Route.options.loader).toBeDefined();
  });
});
```

## Critical Guidelines

### Naming (CRITICAL!)

- Route component: `RouteComponent` or specific name in PascalCase
- Loader function: define inline or name in camelCase
- Event handlers: camelCase (e.g., `handleClick`, `handleSubmit`)
- **NEVER use snake_case!**

### Data Loading

- Always use loader for data prefetching
- Use `useSuspenseQuery` in component
- Load multiple dependencies in parallel with `Promise.all`
- Invalidate queries after mutations

### Error Handling

- Always provide errorComponent
- Use SmartRouteError for standard errors
- Handle specific error cases when needed

### Loading States

- Create skeleton components in `-skeletons/`
- Use Suspense boundaries
- Provide pendingComponent for route-level loading

### Type Safety

- Use Route.useParams() for type-safe params
- Use Route.useSearch() for type-safe search params
- Define search schema with Zod

### Performance

- Prefetch data in loader
- Use parallel loading for multiple dependencies
- Add preload="intent" to important links

## Route Checklist

- [ ] Route file created in correct location
- [ ] Route path defined correctly
- [ ] Loader prefetches required data
- [ ] Component uses useSuspenseQuery
- [ ] Error component provided
- [ ] Loading skeleton created
- [ ] All functions use camelCase
- [ ] Search params validated (if used)
- [ ] Protected route check (if needed)
- [ ] Navigation links are type-safe
- [ ] Test file created
- [ ] `-components/` folder for route-specific components
