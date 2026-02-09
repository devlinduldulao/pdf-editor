---
agent: "implementation"
model: Claude Sonnet 4.5
description: "Create a new custom React hook following project patterns"
tools: ["edit", "read/readFile", "search/codebase"]
---

# Generate Custom React Hook

Create a new custom React hook following the project's patterns and React best practices.

## Input Requirements

Ask the user for:

1. **Hook name** (must start with "use", e.g., "useUserProfile", "useLocalStorage")
2. **Hook purpose** (what does it do?)
3. **Parameters** (what inputs does it take?)
4. **Return value** (what does it return?)
5. **Dependencies** (does it use API calls, local storage, etc.?)

## Research Phase

Before creating the hook:

1. Search for similar hooks in `src/hooks/`
2. Check if functionality already exists
3. Review existing patterns:
   - `src/hooks/use-auth.ts`
   - `src/hooks/use-mobile.ts`
4. Identify reusable utilities

## Hook Structure

### Basic Hook Template

```tsx
import { useState, useEffect } from "react";

/**
 * Description of what the hook does
 * @param param1 - Description of parameter
 * @returns Description of return value
 */
export function useHookName(param1: string) {
  const [state, setState] = useState<Type>(initialValue);

  // Logic here

  return { state, setState };
}
```

## Common Hook Patterns

### 1. State Management Hook

```tsx
import { useState, useCallback } from "react";

export function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  return { value, toggle, setTrue, setFalse };
}
```

### 2. Data Fetching Hook (TanStack Query)

```tsx
import { useSuspenseQuery } from "@tanstack/react-query";
import { applicationGetOptions } from "@/api/client/@tanstack/react-query.gen";

export function useApplication(applicationId: string) {
  const query = useSuspenseQuery(applicationGetOptions({ path: { applicationId } }));

  return {
    application: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
```

### 3. Mutation Hook

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { applicationUpdateMutation } from "@/api/client/@tanstack/react-query.gen";

export function useUpdateApplication() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...applicationUpdateMutation(queryClient),
    onSuccess: (data) => {
      toast.success("Application updated successfully");
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  return {
    updateApplication: mutation.mutate,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}
```

### 4. Effect Hook

```tsx
import { useEffect } from "react";

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    // Cleanup
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
```

### 5. Local Storage Hook

```tsx
import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Get from local storage or use initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  // Update local storage when value changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}
```

### 6. Debounced Value Hook

```tsx
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### 7. Media Query Hook

```tsx
import { useState, useEffect } from "react";

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);

    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

// Usage
export function useIsMobile() {
  return useMediaQuery("(max-width: 768px)");
}
```

### 8. Previous Value Hook

```tsx
import { useRef, useEffect } from "react";

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
```

### 9. Intersection Observer Hook

```tsx
import { useEffect, useState, useRef } from "react";

export function useIntersectionObserver(options?: IntersectionObserverInit) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return { targetRef, isIntersecting };
}
```

### 10. Form Field Hook

```tsx
import { useState, useCallback } from "react";

export function useFormField<T>(initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback((newValue: T) => {
    setValue(newValue);
    setError(null);
  }, []);

  const validate = useCallback(
    (validator: (val: T) => string | null) => {
      const validationError = validator(value);
      setError(validationError);
      return validationError === null;
    },
    [value],
  );

  const reset = useCallback(() => {
    setValue(initialValue);
    setError(null);
  }, [initialValue]);

  return {
    value,
    error,
    onChange: handleChange,
    validate,
    reset,
  };
}
```

## Critical Guidelines

### Naming (CRITICAL!)

- Hook name: Must start with "use" (e.g., `useUserData`, not `getUserData`)
- Use **camelCase** for the hook name
- Internal functions: **camelCase** (e.g., `handleClick`, `fetchData`)
- **NEVER use snake_case!**

### React Rules of Hooks

- Only call hooks at the top level (not in loops, conditions, or nested functions)
- Only call hooks from React functions (components or custom hooks)
- Hooks should be called in the same order every render
- Include all dependencies in useEffect/useCallback/useMemo

### TypeScript

- Define proper types for parameters and return values
- Use generics when appropriate
- Export the hook function

### Performance

- Use `useCallback` for functions returned from hooks
- Use `useMemo` for expensive computations
- Minimize re-renders by managing dependencies

### Error Handling

- Handle errors gracefully
- Provide error states in return value
- Use try-catch for operations that might fail

### Documentation

- Add JSDoc comments explaining the hook
- Document parameters and return values
- Include usage examples

## Testing

Create a test file: `use-hook-name.test.ts`

```tsx
import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "@/testing/test-utils";
import { useHookName } from "./use-hook-name";

describe("useHookName", () => {
  it("returns initial value", () => {
    const { result } = renderHook(() => useHookName("initial"));

    expect(result.current.value).toBe("initial");
  });

  it("updates value correctly", async () => {
    const { result } = renderHook(() => useHookName("initial"));

    result.current.setValue("updated");

    await waitFor(() => {
      expect(result.current.value).toBe("updated");
    });
  });
});
```

## File Location

Place hook in:

- `src/hooks/use-hook-name.ts` for shared hooks
- Route `-hooks/` folder for route-specific hooks

## Hook Documentation Template

````tsx
/**
 * Custom hook description
 *
 * @param param1 - Description of parameter 1
 * @param param2 - Description of parameter 2
 * @returns Object containing { value, error, methods }
 *
 * @example
 * ```tsx
 * const { value, setValue } = useHookName("initial");
 * ```
 */
export function useHookName(param1: string, param2?: number) {
  // Implementation
}
````

## Hook Checklist

- [ ] Hook name starts with "use"
- [ ] Hook name is camelCase
- [ ] All internal functions use camelCase (no snake_case!)
- [ ] Follows Rules of Hooks
- [ ] Proper TypeScript types defined
- [ ] Dependencies array correct in useEffect/useCallback/useMemo
- [ ] Error handling implemented
- [ ] JSDoc documentation added
- [ ] Test file created
- [ ] Cleanup functions in useEffect (if needed)
- [ ] Performance optimized (useCallback/useMemo where appropriate)
- [ ] Return value is consistent and typed
