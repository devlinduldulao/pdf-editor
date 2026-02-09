---
agent: "implementation"
model: Claude Sonnet 4.5
description: "Create a new React component following project patterns"
tools: ["edit", "read/readFile", "search/codebase"]
---

# Generate React Component

Create a new React component following the project's established patterns and best practices.

## Input Requirements

Ask the user for:

1. **Component name** (PascalCase, e.g., "UserProfileCard")
2. **File name** (kebab-case, e.g., "user-profile-card.tsx") - **CRITICAL: Always use kebab-case for files**
3. **Component type**:
   - UI component (`src/components/ui/`)
   - Shared component (`src/components/`)
   - Modal component (`src/components/modals/`)
   - Route-specific component (route `-components/` folder)
4. **Component purpose** (brief description)
5. **Props** (if any, with types)

## Research Phase

Before creating the component:

1. Search for similar components in the codebase
2. Identify reusable patterns and utilities
3. Check for existing UI components that can be used
4. Review the shadcn/ui components available

## Component Template

Create the component following this structure:

```tsx
import type React from "react";
import { cn } from "@/lib/utils";
// Import other dependencies as needed

interface ${ComponentName}Props {
  // Define props with proper types
  className?: string;
}

export function ${ComponentName}({
  className,
  ...props
}: ${ComponentName}Props) {
  // Hooks at the top

  // Event handlers (use camelCase!)
  const handleClick = () => {
    // Implementation
  };

  // Render
  return (
    <div className={cn("base-classes", className)}>
      {/* Component content */}
    </div>
  );
}
```

## Guidelines

### Naming (CRITICAL)

- Component name: **PascalCase** (e.g., `UserProfileCard`)
- Props interface: `${ComponentName}Props`
- Functions/handlers: **camelCase** (e.g., `handleClick`, `fetchData`)
- **NEVER use snake_case** for functions or variables!

### TypeScript

- Define explicit prop types
- Use `interface` for props
- Export the component function
- Add JSDoc comments if complex

### Styling

- Use Tailwind CSS utility classes
- Accept `className` prop for customization
- Use `cn()` utility for conditional classes
- Follow existing component styling patterns

### Accessibility

- Use semantic HTML
- Add ARIA labels where needed
- Ensure keyboard navigation
- Include proper roles

### Reusability

- Keep components focused and single-purpose
- Use composition over configuration
- Accept children when appropriate
- Make components flexible with props

### shadcn/ui Integration

- Use existing shadcn/ui components as building blocks
- Don't reinvent components that already exist
- Compose complex components from primitives

## Examples to Reference

Search the codebase for:

- Similar components (e.g., if creating a card, look at existing cards)
- Modal patterns: `src/components/modals/`
- UI primitives: `src/components/ui/`
- Form components: Look at `new-app-form.tsx` or similar

## Testing

After creating the component:

1. Create a test file: `${ComponentName}.test.tsx`
2. Test rendering
3. Test user interactions
4. Test prop variations
5. Test accessibility

## Deliverables

1. Component file with proper structure
2. Proper TypeScript types
3. Tailwind CSS styling
4. Accessibility features
5. (Optional) Test file
6. (Optional) Storybook story if applicable

## Component Checklist

- [ ] Component name is PascalCase
- [ ] All functions use camelCase (no snake_case!)
- [ ] Props interface defined
- [ ] TypeScript types are explicit
- [ ] Tailwind CSS classes used
- [ ] Accepts className prop
- [ ] Semantic HTML used
- [ ] ARIA labels added if needed
- [ ] Keyboard navigation works
- [ ] Component is reusable
- [ ] Follows existing patterns
