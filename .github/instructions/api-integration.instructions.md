---
applyTo: "src/api/**/*.ts,src/api/**/*.tsx"
---

# API Integration Standards

Apply these standards to all API-related code in the project.

## Generated API Client

This project uses **Hey API** to generate TypeScript clients from OpenAPI specifications.

### Generated Files Location

- Types: `src/api/client/types.gen.ts`
- Zod schemas: `src/api/client/zod.gen.ts`
- SDK functions: `src/api/client/sdk.gen.ts`
- TanStack Query hooks: `src/api/client/@tanstack/react-query.gen.ts`

### DO NOT Modify Generated Files

- Never edit generated files directly
- Changes will be overwritten on regeneration
- Update the OpenAPI spec instead

## Using Generated API Client

### Import Types

```tsx
import type { Application, ApplicationCreateRequest, ApplicationUpdateRequest } from "@/api/client/types.gen";
```

### Import Zod Schemas

```tsx
import { zApplication, zApplicationCreateRequest } from "@/api/client/zod.gen";
```

### Import TanStack Query Hooks

```tsx
import {
  applicationGetOptions,
  applicationUpdateMutation,
  applicationsListOptions,
} from "@/api/client/@tanstack/react-query.gen";
```

## Data Fetching Patterns

### Prefetch Pattern in Loaders

Use the `void` pattern to prefetch data in route loaders without awaiting. This allows React to show the pending component immediately while data loads in the background:

```tsx
loader: ({ context, params }) => {
  // Use void to prefetch without blocking
  void context.queryClient.ensureQueryData(applicationGetOptions({ path: params }));

  // Optionally return data for route context (like breadcrumbs)
  return {
    crumb: "application",
  };
},
```

### Query with useSuspenseQuery

```tsx
import { useSuspenseQuery } from "@tanstack/react-query";
import { applicationGetOptions } from "@/api/client/@tanstack/react-query.gen";

function ApplicationDetails({ applicationId }: { applicationId: string }) {
  const { data: application } = useSuspenseQuery(applicationGetOptions({ path: { applicationId } }));

  return <div>{application.name}</div>;
}
```

### Query with useQuery (for optional data)

```tsx
import { useQuery } from "@tanstack/react-query";
import { userProfileOptions } from "@/api/client/@tanstack/react-query.gen";

function UserProfile() {
  const { data, isLoading, error } = useQuery(userProfileOptions({ path: { userId: "123" } }));

  if (isLoading) return <Spinner />;
  if (error) return <Error error={error} />;

  return <div>{data?.name}</div>;
}
```

### Query in Route Loader

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { applicationGetOptions } from "@/api/client/@tanstack/react-query.gen";
import { ApplicationSkeleton } from "./-skeletons/application-skeleton";

export const Route = createFileRoute("/app/$applicationId/")({
  loader: ({ context: { queryClient }, params: { applicationId } }) => {
    void queryClient.ensureQueryData(applicationGetOptions({ path: { applicationId } }));
  },
  pendingComponent: ApplicationSkeleton,
  component: RouteComponent,
});
```

## Mutation Patterns

### Basic Mutation

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { applicationUpdateMutation } from "@/api/client/@tanstack/react-query.gen";
import { toast } from "sonner";

function UpdateApplicationForm() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...applicationUpdateMutation(queryClient),
    onSuccess: (data) => {
      toast.success("Application updated successfully");
      // Cache is automatically invalidated by generated mutation
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });

  const handleSubmit = (values: ApplicationUpdateRequest) => {
    mutation.mutate({
      path: { applicationId: "123" },
      body: values,
    });
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      {/* Form fields */}
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
```

### Mutation with Optimistic Update

```tsx
const mutation = useMutation({
  ...applicationUpdateMutation(queryClient),
  onMutate: async (variables) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries({
      queryKey: ["applications", variables.path.applicationId],
    });

    // Snapshot previous value
    const previousApp = queryClient.getQueryData(["applications", variables.path.applicationId]);

    // Optimistically update
    queryClient.setQueryData(["applications", variables.path.applicationId], (old: Application) => ({
      ...old,
      ...variables.body,
    }));

    return { previousApp };
  },
  onError: (error, variables, context) => {
    // Rollback on error
    if (context?.previousApp) {
      queryClient.setQueryData(["applications", variables.path.applicationId], context.previousApp);
    }
  },
});
```

## Query Key Management

### Use Generated Query Keys

```tsx
import { applicationGetQueryKey } from "@/api/client/@tanstack/react-query.gen";

// Invalidate specific query
queryClient.invalidateQueries({
  queryKey: applicationGetQueryKey({ path: { applicationId: "123" } }),
});

// Invalidate all applications
queryClient.invalidateQueries({
  queryKey: ["applications"],
});
```

### Prefetch Data

```tsx
import { applicationGetOptions } from "@/api/client/@tanstack/react-query.gen";

// Prefetch on hover (void pattern for fire-and-forget)
const handleMouseEnter = () => {
  void queryClient.prefetchQuery(applicationGetOptions({ path: { applicationId: "123" } }));
};
```

## Error Handling

### Handle API Errors

```tsx
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const { data, error } = useQuery({
  ...applicationGetOptions({ path: { applicationId } }),
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});

useEffect(() => {
  if (error) {
    toast.error(`Failed to load application: ${error.message}`);
  }
}, [error]);
```

### Error Boundaries

```tsx
import { ErrorBoundary } from "react-error-boundary";

<ErrorBoundary
  fallback={<ErrorFallback />}
  onError={(error) => {
    console.error("API Error:", error);
  }}
>
  <ApplicationDetails />
</ErrorBoundary>;
```

## Authentication

### Azure MSAL Token

```tsx
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/auth/config";

const { instance, accounts } = useMsal();

// Get token for API calls
const getToken = async () => {
  const account = accounts[0];
  if (!account) throw new Error("No active account");

  const response = await instance.acquireTokenSilent({
    scopes: loginRequest.scopes,
    account,
  });

  return response.accessToken;
};
```

### API Client with Auth

The generated client automatically includes authentication tokens via the client configuration.

## Real-time Updates (SignalR)

### SignalR Connection

```tsx
import { HubConnectionBuilder } from "@microsoft/signalr";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

function useApplicationSignalR(applicationId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl(`${API_URL}/ws/ApplicationHub`, {
        accessTokenFactory: () => getToken(),
      })
      .build();

    connection.on("ReceiveApplicationUpdate", (update) => {
      // Invalidate query to refetch
      queryClient.invalidateQueries({
        queryKey: ["applications", applicationId],
      });
    });

    connection.start();

    return () => {
      connection.stop();
    };
  }, [applicationId, queryClient]);
}
```

## Generating API Client

### Update OpenAPI Spec

1. Download latest spec:

```bash
curl -o swagger.json https://apicity-test.dnv.com/api/docs/v1.0/swagger.json
```

2. Generate client:

```bash
npm run openapi-ts
```

### Configuration

See `openapi-ts.config.ts` for client generation settings.

## Best Practices

### 1. Always Use Generated Types

```tsx
// ✅ Good
import type { Application } from "@/api/client/types.gen";

// ❌ Bad
interface Application { ... } // Don't redefine
```

### 2. Use Generated Query Options with Void Pattern in Loaders

```tsx
// ✅ Good - In loaders, use void for prefetch pattern
loader: ({ context, params }) => {
  void context.queryClient.ensureQueryData(applicationGetOptions({ path: params }));
},

// ✅ Good - In components, use useSuspenseQuery
useSuspenseQuery(applicationGetOptions({ path: { applicationId } }))

// ❌ Bad
useSuspenseQuery({
  queryKey: ["application", applicationId],
  queryFn: () => fetch(...),
})
```

### 3. Use Generated Mutations

```tsx
// ✅ Good
useMutation(applicationUpdateMutation(queryClient))

// ❌ Bad
useMutation({
  mutationFn: (data) => fetch(...),
})
```

### 4. Handle Loading States

```tsx
// ✅ Good - Use Suspense with generated hooks
<Suspense fallback={<Skeleton />}>
  <Component /> {/* uses useSuspenseQuery */}
</Suspense>;

// ✅ Good - Manual loading state
const { data, isLoading } = useQuery(options);
if (isLoading) return <Spinner />;
```

### 5. Invalidate Cache After Mutations

```tsx
// ✅ Good - Generated mutations handle this
useMutation({
  ...applicationUpdateMutation(queryClient),
  // Invalidation handled automatically
});

// ✅ Good - Manual invalidation if needed
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["applications"] });
};
```

### 6. Use Proper Error Handling

```tsx
// ✅ Good
const mutation = useMutation({
  ...createMutation(queryClient),
  onError: (error) => {
    toast.error(`Operation failed: ${error.message}`);
  },
});
```

### 7. Type API Responses

```tsx
// ✅ Good - Use generated types
const { data } = useSuspenseQuery<Application>(options);

// ❌ Bad - Don't use any
const { data } = useSuspenseQuery<any>(options);
```

### 8. Naming Conventions

```tsx
// ✅ Good - camelCase for API methods
const createApplication = () => { ... };
const updateUserProfile = () => { ... };

// ❌ Bad - snake_case
const create_application = () => { ... };
const update_user_profile = () => { ... };
```

## Common Patterns

### List with Pagination

```tsx
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  ...applicationsListOptions({
    query: { page: 1, pageSize: 20 },
  }),
  getNextPageParam: (lastPage) => lastPage.nextPage,
});
```

### Dependent Queries

```tsx
// Second query depends on first
const { data: application } = useSuspenseQuery(applicationGetOptions({ path: { applicationId } }));

const { data: environments } = useSuspenseQuery({
  ...environmentsListOptions({ path: { applicationId } }),
  enabled: !!application, // Only run if application loaded
});
```

### Polling

```tsx
const { data } = useQuery({
  ...jobStatusOptions({ path: { jobId } }),
  refetchInterval: 5000, // Poll every 5 seconds
  refetchIntervalInBackground: true,
});
```
