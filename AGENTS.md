# ThisProject - Agent Instructions

> IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any tasks in this project.

## Tech Stack

| Category      | Technology               | Version   |
| ------------- | ------------------------ | --------- |
| Framework     | React                    | 19.2      |
| Routing       | TanStack Router          | 1.x       |
| Data Fetching | TanStack Query           | 5.x       |
| State         | Zustand                  | 5.x       |
| Styling       | Tailwind CSS             | 4.1       |
| UI            | shadcn/ui + Base UI      | Latest    |
| Forms         | React Hook Form + Zod    | 7.x + 4.x |
| Testing       | Vitest + Testing Library | Latest    |
| API Client    | @hey-api/openapi-ts      | 0.91.x    |
| Icons         | Phosphor Icons           | 2.x       |
| Auth          | Azure MSAL               | 5.x       |
| Build         | Vite                     | 8.x       |

## Setup Commands

```bash
npm install              # Install dependencies
npm run dev              # Start dev server (port 5173)
npm run build            # Production build
npm run test             # Run all tests
npm run test -- --run    # Run tests once (no watch)
npm run typecheck        # TypeScript check
npm run lint             # ESLint check
npm run openapi-ts       # Regenerate API client from swagger.json
```

## Project Structure

```
src/
├── api/client/              # Auto-generated API (DO NOT EDIT)
│   ├── @tanstack/           # Generated TanStack Query hooks
│   ├── types.gen.ts         # Generated types
│   └── zod.gen.ts           # Generated Zod schemas
├── components/              # Shared components
│   ├── ui/                  # shadcn/ui components
│   └── modals/              # Modal components
├── routes/                  # TanStack Router file-based routes
│   ├── app/$applicationId/  # Dynamic authenticated routes
│   ├── -components/         # Route-specific components (prefix with -)
│   ├── -skeletons/          # Loading skeletons (prefix with -)
│   └── -tests/              # Route tests (prefix with -)
├── hooks/                   # Custom React hooks (use-*.ts)
├── lib/                     # Utilities (utils.ts, toast.tsx)
├── state/client/            # Zustand stores (*-store.ts)
└── testing/                 # Test utilities (render-with-providers)
```

## Critical Conventions

### Naming

- **Files**: `kebab-case.tsx` (e.g., `user-profile.tsx`, `use-auth.ts`)
- **Variables/Functions**: `camelCase` (NEVER `snake_case`)
- **Components/Types**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Icons**: Import with `Icon` suffix (e.g., `MoonIcon`, `CheckIcon`)

### Imports

```typescript
// ✅ Correct - Direct imports from @phosphor-icons/react
import { MoonIcon, SunIcon } from "@phosphor-icons/react";

// ✅ Correct - Generated API hooks
import { applicationGetOptions } from "@/api/client/@tanstack/react-query.gen";
import { useSuspenseQuery } from "@tanstack/react-query";
```

### Data Fetching Pattern

```typescript
// Route loader - prefetch with void (non-blocking)
export const Route = createFileRoute("/app/$applicationId/")({
  loader: ({ context: { queryClient }, params: { applicationId } }) => {
    void queryClient.ensureQueryData(applicationGetOptions({ path: { applicationId } }));
    return { crumb: "application" };
  },
  pendingComponent: ApplicationSkeleton,
  component: RouteComponent,
});

// Component - use useSuspenseQuery (data already cached)
function RouteComponent() {
  const { applicationId } = Route.useParams();
  const { data } = useSuspenseQuery(applicationGetOptions({ path: { applicationId } }));
  return <div>{data.name}</div>;
}
```

### Form Pattern

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
});

type FormValues = z.infer<typeof schema>;

function MyForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });
  // ...
}
```

### Testing Pattern

```typescript
import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/testing/render-with-providers";

describe("ComponentName", () => {
  it("should render correctly", async () => {
    renderWithProviders(<Component />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
```

## Common Tasks

### Add a new route

1. Create file in `src/routes/` following file-based routing
2. Add loader with `void queryClient.ensureQueryData()` for prefetching
3. Add `-components/` folder for route-specific components
4. Add `-tests/` folder for tests

### Add a new component

1. Create in `src/components/` with `kebab-case.tsx` naming
2. Export named export (not default)
3. Add `.test.tsx` file alongside

### Regenerate API types

After updating `swagger.json`:

```bash
npm run openapi-ts
npm run typecheck  # Verify no breaking changes
```

## Detailed Documentation

| Topic                 | File                                                    |
| --------------------- | ------------------------------------------------------- |
| Full project patterns | `.github/skills/this-project/SKILL.md`                  |
| API integration       | `.github/instructions/api-integration.instructions.md`  |
| TanStack Router       | `.github/instructions/tanstack-router.instructions.md`  |
| Testing               | `.github/instructions/testing.instructions.md`          |
| TypeScript/React      | `.github/instructions/typescript-react.instructions.md` |
| UI/Design System      | `.github/instructions/ui-design-system.instructions.md` |

## PR/Commit Guidelines

- Run `npm run lint && npm run test` before committing
- Add/update tests for any code changes
- Use descriptive commit messages
- Title format: `[component/feature] Description`
