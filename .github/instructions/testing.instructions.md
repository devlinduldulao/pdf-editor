---
applyTo: "**/*.test.ts,**/*.test.tsx"
---

# Testing Standards

Apply these standards to all test files in the project.

## Testing Framework

- Use **Vitest** for all tests
- Use **@testing-library/react** for component testing
- Use utilities from `src/testing/test-utils.tsx`

## File Naming and Location

### Test File Naming

- Component tests: `ComponentName.test.tsx`
- Hook tests: `use-hook-name.test.ts`
- Utility tests: `utils.test.ts`

### Test File Location

- Place tests in `-tests/` folders within routes
- Place tests alongside components/hooks when appropriate
- Mirror source file structure

## Test Structure

### Basic Structure

```tsx
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderWithProviders, screen, waitFor } from "@/testing/test-utils";
import userEvent from "@testing-library/user-event";

describe("ComponentName", () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe("feature group", () => {
    it("should do specific thing", async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## What to Test

### ✅ Do Test

- User interactions (clicks, typing, navigation)
- Data rendering and display
- Form validation and submission
- Loading and error states
- Conditional rendering
- API integration (with mocks)
- Accessibility features
- Custom hook behavior
- Edge cases and error scenarios

### ❌ Don't Test

- Implementation details
- Third-party library internals
- CSS styling (unless critical to UX)
- Exact component structure

## Testing Patterns

### Component Rendering

```tsx
it("renders user profile correctly", () => {
  renderWithProviders(<UserProfile userId="123" />);

  expect(screen.getByText(/profile/i)).toBeInTheDocument();
  expect(screen.getByRole("img", { name: /avatar/i })).toBeInTheDocument();
});
```

### User Interactions

```tsx
it("submits form when button clicked", async () => {
  const user = userEvent.setup();
  const handleSubmit = vi.fn();

  renderWithProviders(<MyForm onSubmit={handleSubmit} />);

  await user.type(screen.getByLabelText(/name/i), "John");
  await user.click(screen.getByRole("button", { name: /submit/i }));

  await waitFor(() => {
    expect(handleSubmit).toHaveBeenCalledWith({ name: "John" });
  });
});
```

### Form Validation

```tsx
it("shows error for invalid email", async () => {
  const user = userEvent.setup();
  renderWithProviders(<EmailForm />);

  const emailInput = screen.getByLabelText(/email/i);
  await user.type(emailInput, "invalid");
  await user.tab(); // Trigger blur

  expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
});
```

### API Integration

```tsx
it("loads and displays user data", async () => {
  const mockUser = { id: "123", name: "John Doe" };

  // Mock API call
  vi.mocked(apiClient.userGet).mockResolvedValue(mockUser);

  renderWithProviders(<UserProfile userId="123" />);

  await waitFor(() => {
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });
});
```

### Error States

```tsx
it("displays error message when API fails", async () => {
  const mockError = new Error("Network error");
  vi.mocked(apiClient.userGet).mockRejectedValue(mockError);

  renderWithProviders(<UserProfile userId="123" />);

  await waitFor(() => {
    expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
  });
});
```

### Loading States

```tsx
it("shows loading spinner while fetching data", () => {
  renderWithProviders(<UserProfile userId="123" />);

  expect(screen.getByRole("status")).toBeInTheDocument();
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});
```

### Custom Hooks

```tsx
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "@/testing/test-utils";

it("fetches user data correctly", async () => {
  const wrapper = createWrapper();
  const { result } = renderHook(() => useUserData("123"), { wrapper });

  expect(result.current.isLoading).toBe(true);

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });

  expect(result.current.data).toEqual({ id: "123", name: "John" });
});
```

## Query Selectors

### Preferred Order

1. `getByRole` - Best for accessibility
2. `getByLabelText` - Good for form inputs
3. `getByPlaceholderText` - Okay for inputs
4. `getByText` - Good for content
5. `getByDisplayValue` - For inputs with values
6. `getByAltText` - For images
7. `getByTitle` - For title attributes
8. `getByTestId` - Last resort only

### Query Variants

- `getBy*` - Throws if not found (immediate assertion)
- `queryBy*` - Returns null if not found (checking absence)
- `findBy*` - Async, waits for element (async rendering)

```tsx
// ✅ Element should exist
expect(screen.getByText(/submit/i)).toBeInTheDocument();

// ✅ Element should NOT exist
expect(screen.queryByText(/optional/i)).not.toBeInTheDocument();

// ✅ Wait for async element
const element = await screen.findByText(/loaded/i);
expect(element).toBeInTheDocument();
```

## Test Naming

### Descriptive Names

```tsx
// ✅ Good - Describes behavior
it("shows error message when email is invalid", () => { ... });
it("disables submit button while form is submitting", () => { ... });
it("redirects to dashboard after successful login", () => { ... });

// ❌ Bad - Too vague
it("test email", () => { ... });
it("button works", () => { ... });
it("renders correctly", () => { ... });
```

## Async Testing

### Wait for Updates

```tsx
// ✅ Use waitFor for state updates
await waitFor(() => {
  expect(screen.getByText(/success/i)).toBeInTheDocument();
});

// ✅ Use findBy for async rendering
const element = await screen.findByText(/async content/i);

// ❌ Don't forget await
await user.click(button); // ✅
user.click(button); // ❌
```

## Mocking

### Mock Functions

```tsx
const mockCallback = vi.fn();
mockCallback.mockReturnValue("value");
mockCallback.mockResolvedValue("async value");
mockCallback.mockRejectedValue(new Error("error"));

expect(mockCallback).toHaveBeenCalled();
expect(mockCallback).toHaveBeenCalledWith("arg");
expect(mockCallback).toHaveBeenCalledTimes(2);
```

### Mock Modules

```tsx
vi.mock("@/api/client/sdk.gen", () => ({
  applicationGet: vi.fn().mockResolvedValue({ id: "123" }),
  applicationUpdate: vi.fn(),
}));
```

### Mock Environment

```tsx
beforeEach(() => {
  vi.stubEnv("VITE_API_URL", "http://localhost:3000");
});

afterEach(() => {
  vi.unstubAllEnvs();
});
```

## Test Utilities

### Custom Render

```tsx
import { renderWithProviders } from "@/testing/test-utils";

// ✅ Always use renderWithProviders
renderWithProviders(<Component />);

// ❌ Don't use raw render
render(<Component />); // Missing providers
```

### User Events

```tsx
const user = userEvent.setup();

await user.click(element);
await user.type(input, "text");
await user.clear(input);
await user.selectOptions(select, "option");
await user.keyboard("{Enter}");
await user.hover(element);
await user.tab();
```

## Coverage Goals

Aim for:

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

Run coverage:

```bash
npm run test:coverage
```

## Common Patterns

### Testing Forms

```tsx
it("validates and submits form", async () => {
  const user = userEvent.setup();
  const handleSubmit = vi.fn();

  renderWithProviders(<MyForm onSubmit={handleSubmit} />);

  // Fill form
  await user.type(screen.getByLabelText(/name/i), "John");
  await user.type(screen.getByLabelText(/email/i), "john@example.com");

  // Submit
  await user.click(screen.getByRole("button", { name: /submit/i }));

  // Verify
  await waitFor(() => {
    expect(handleSubmit).toHaveBeenCalledWith({
      name: "John",
      email: "john@example.com",
    });
  });
});
```

### Testing Mutations

```tsx
it("creates application successfully", async () => {
  const queryClient = createTestQueryClient();
  const wrapper = createWrapper({ queryClient });

  const { result } = renderHook(() => useMutation(applicationCreateMutation(queryClient)), { wrapper });

  result.current.mutate({ body: { id: "app-1", name: "My App" } });

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });
});
```

### Testing Routes

```tsx
it("loads route data correctly", async () => {
  // Mock API response
  vi.mocked(apiClient.applicationGet).mockResolvedValue({ id: "123", name: "My App" });

  const router = createTestRouter([Route], ["/app/123"]);

  renderWithProviders(<RouterProvider router={router} />);

  // Should show pending component first
  expect(screen.getByRole("status")).toBeInTheDocument();

  // Then show loaded data
  await waitFor(() => {
    expect(screen.getByText("My App")).toBeInTheDocument();
  });
});
```

## Best Practices

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **One assertion per test** (when possible)
3. **Test user behavior**, not implementation
4. **Clean up after tests** (use beforeEach/afterEach)
5. **Mock external dependencies** (APIs, timers, etc.)
6. **Use descriptive test names**
7. **Test error cases** and edge cases
8. **Keep tests isolated** and independent
9. **Avoid testing implementation details**
10. **Use accessibility queries** (getByRole, getByLabelText)
