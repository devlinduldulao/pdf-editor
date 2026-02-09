---
applyTo: "src/routes/**/*.tsx,src/routes/**/*.ts"
---

# TanStack Router Standards

Apply these standards to all route files using TanStack Router.

## File-Based Routing

### Route File Naming

- Index route: `index.tsx`
- Dynamic route: `$param.tsx` (e.g., `$applicationId.tsx`)
- Layout route: `__root.tsx` or `_layout.tsx`
- Route folders: Use folder name for route path

### Route File Structure

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { myDataOptions } from "@/api/client/@tanstack/react-query.gen";
import { MyRouteSkeleton } from "./-skeletons/my-route-skeleton";

// 1. Define route with loader
export const Route = createFileRoute("/path/to/route")({
  // Loader for data fetching (use void to prefetch without awaiting)
  loader: ({ context, params, search }) => {
    void context.queryClient.ensureQueryData(myDataOptions({ path: { id: params.id } }));

    // Optional: return data for breadcrumbs or other route context
    return {
      crumb: "route-name",
    };
  },

  // Optional: beforeLoad for auth/permissions
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },

  // Component
  component: RouteComponent,

  // Optional: Error component
  errorComponent: ErrorComponent,

  // Pending component - use route-specific skeleton
  pendingComponent: MyRouteSkeleton,
});

// 2. Define component
function RouteComponent() {
  const params = Route.useParams();
  const search = Route.useSearch();
  const { data } = useSuspenseQuery(myDataOptions({ path: { id: params.id } }));

  return <div>{/* Component content */}</div>;
}
```

## Data Loading

### Use Loaders for Data Fetching

```tsx
// ✅ Good - Load data in loader with void for prefetch pattern
export const Route = createFileRoute("/app/$applicationId/")({
  loader: ({ context: { queryClient }, params: { applicationId } }) => {
    void queryClient.ensureQueryData(applicationGetOptions({ path: { applicationId } }));
  },
  pendingComponent: ApplicationSkeleton,
  component: RouteComponent,
});

function RouteComponent() {
  const { applicationId } = Route.useParams();
  const { data } = useSuspenseQuery(applicationGetOptions({ path: { applicationId } }));

  return <div>{data.name}</div>;
}
```

### Multiple Data Dependencies

```tsx
// Use void for prefetch pattern - don't await
loader: ({ context: { queryClient }, params }) => {
  void queryClient.ensureQueryData(applicationGetOptions({ path: params }));
  void queryClient.ensureQueryData(getEnvironmentsOptions({ path: params }));
  void queryClient.ensureQueryData(servicesGetOptions({ path: params }));

  return {
    crumb: "route-name",
  };
},
```

## Route Parameters

### Path Parameters

```tsx
// Route: /app/$applicationId/environments/$envId
const { applicationId, envId } = Route.useParams();
```

### Search Parameters

```tsx
// Define search schema
const searchSchema = z.object({
  page: z.number().optional(),
  filter: z.string().optional(),
});

export const Route = createFileRoute("/users/")({
  validateSearch: searchSchema,
  component: UsersComponent,
});

function UsersComponent() {
  const { page, filter } = Route.useSearch();
  // Use search params
}
```

## Navigation

### Using Link Component

```tsx
import { Link } from "@tanstack/react-router";

// ✅ Type-safe navigation
<Link to="/app/$applicationId" params={{ applicationId: "123" }}>
  View Application
</Link>

// ✅ With search params
<Link
  to="/users"
  search={{ page: 1, filter: "active" }}
>
  Users
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

  return <button onClick={handleClick}>Navigate</button>;
}
```

## Route Organization

### Folder Structure

```
src/routes/
├── __root.tsx              # Root layout
├── index.tsx               # Home page (/)
├── create-application/     # /create-application
│   ├── index.tsx
│   ├── -components/        # Route-specific components
│   ├── -tests/            # Route tests
│   └── -skeletons/        # Loading skeletons
├── app/
│   ├── $applicationId/    # /app/:applicationId
│   │   ├── index.tsx
│   │   ├── settings/      # Nested routes
│   │   ├── -components/
│   │   └── -skeletons/
│   └── __layout.tsx       # Layout for /app/*
└── workspace/
    └── $workspaceId/
        ├── index.tsx
        └── -components/
```

### Route-Specific Resources

- `-components/`: Components used only in this route
- `-tests/`: Tests for this route
- `-skeletons/`: Loading skeleton components
- Prefix with `-` to prevent route generation

## Loading States

### Use Suspense with Skeletons

```tsx
import { Suspense } from "react";
import { Await } from "@tanstack/react-router";

function RouteComponent() {
  return (
    <Suspense fallback={<ApplicationDetailsSkeleton />}>
      <Await promise={loaderData}>{(data) => <ApplicationDetails data={data} />}</Await>
    </Suspense>
  );
}
```

### Pending Component

// ✅ Use route-specific skeleton component
export const Route = createFileRoute("/app/$applicationId/settings/network")({
loader: ({ context, params }) => {
void context.queryClient.ensureQueryData(
applicationSettingsOptions({ path: { applicationId: params.applicationId } }),
);
},
pendingComponent: NetworkSkeleton, // Route-specific skeleton
pendingComponent: () => <LoadingSkeleton />,
component: RouteComponent,
});

````

## Error Handling

### Route Error Component

```tsx
import { SmartRouteError } from "@/components/errors/SmartRouteError";

export const Route = createFileRoute("/app/$applicationId/")({
  loader: myLoader,
  component: RouteComponent,
  errorComponent: ({ error }) => <SmartRouteError error={error} resourceName="application" />,
});
````

### Error Boundaries

```tsx
import { ErrorBoundary } from "react-error-boundary";

function RouteComponent() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

## Authentication & Authorization

### Protected Routes

```tsx
export const Route = createFileRoute("/admin/")({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: "/login" });
    }

    if (!context.auth.user?.isAdmin) {
      throw redirect({ to: "/" });
    }
  },
  component: AdminPanel,
});
```

## Route Context

### Accessing Context

```tsx
export const Route = createFileRoute("/my-route")({
  loader: ({ context }) => {
    // Access auth
    const user = context.auth.user;

    // Access query client
    const queryClient = context.queryClient;

    return queryClient.ensureQueryData(myOptions());
  },
});
```

## Best Practices

### 1. Always Use Type-Safe Navigation

````tsx
// ✅ Good - Type-safe
<Link to="/app/$applicationId" params={{ applicationId: id }}>

// ❌ Bad - String-based (not type-safe)
<a href={`/app/${id}`}>
```Prefetch data in loader using void pattern
loader: ({ context, params }) => {
  void context.queryClient.ensureQueryData(dataOptions({ path: params }));
},

// ❌ Bad - Load in component (causes waterfall)
function Component() {
  const { data } = useQuery(dataOptions());
}Good - Load in loader
loader: (({ context, params }) => context.queryClient.ensureQueryData(dataOptions({ path: params })),
  // ❌ Bad - Load in component (causes waterfall)
  function Component() {
    const { data } = useQuery(dataOptions());
  });
````

### 3. Use Suspense Boundaries

```tsx
// ✅ Good - Suspense for better UX
<Suspense fallback={<Skeleton />}>
  <AsyncComponent />
</Suspense>

// ❌ Bad - No loading state
<AsyncComponent />
```

### 4. Handle Errors Gracefully

```tsx
// ✅ Good - Custom error component
errorComponent: ({ error }) => <SmartRouteError error={error} />;

// ❌ Bad - No error handling
```

### 5. Validate Search Params

```tsx
// ✅ Good - Validated search params
validateSearch: z.object({
  page: z.number().min(1).default(1),
  sort: z.enum(["asc", "desc"]).default("asc"),
}),

// ❌ Bad - Unvalidated search params
```

### 6. Organize Route Files

- Keep route components focused
- Extract complex logic to `-components/`
- Add loading skeletons in `-skeletons/`
- Place tests in `-tests/`

### 7. Use Route Params Correctly

```tsx
// ✅ Good - Get params from route
const params = Route.useParams();

// ❌ Bad - Parse from URL manually
const id = window.location.pathname.split("/")[2];
```

### 8. Prefetch Important Routes

```tsx
<Link
  to="/app/$applicationId"
  params={{ applicationId: id }}
  preload="intent" // Prefetch on hover
>
  View App
</Link>
```
