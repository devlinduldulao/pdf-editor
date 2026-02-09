---
applyTo: "src/components/**/*.tsx,src/routes/**/*.tsx"
---

# UI Components & Design System Standards

Apply these standards when creating or modifying UI components to ensure consistent design across the application.

## Design System Overview

This project uses a **Neo-Brutalist design aesthetic** with a custom design system:

- **Styling**: Tailwind CSS 4.1 with custom theme and utilities
- **Component Libraries**: shadcn/ui (primary) + Base UI (Radix alternative)
- **Icon System**: Lucide React (no suffix convention required)
- **Typography**: Syne Variable (display/headings) and Outfit Variable (body text)
- **Animation**: Framer Motion + tw-animate-css for smooth transitions
- **Theming**: Three modes (light, dark, dim) with OKLCH color space

## Theme System

### Three Theme Modes

**Light Mode** (Default)

- Clean, professional appearance
- High contrast for accessibility
- Ant Design v5 light tokens

**Dark Mode**

- Pure black background (#000000)
- Reduced eye strain in low-light
- OKLCH color tokens with high contrast

**Dim Mode** (Twitter/Bluesky style)

- Warmer dark theme
- Softer than pure dark
- Popular for social/content apps

### Theme-Aware Design

Always ensure components work across all three themes:

```tsx
// ✅ Good - Uses theme tokens
<div className="bg-background text-foreground border-border">

// ❌ Bad - Hardcoded colors
<div className="bg-white text-black border-gray-300">
```

## Color System

### Using OKLCH Color Space

All colors are defined as CSS custom properties using OKLCH color space for perceptually uniform colors:

```tsx
// Background colors
bg - background; // Main background
bg - card; // Card background
bg - popover; // Elevated surfaces
bg - muted; // Muted background

// Text colors
text - foreground; // Primary text
text - muted - foreground; // Secondary text

// Border colors
border - border; // Default borders
border - input; // Input borders

// Status colors
bg - destructive; // Error states
bg - primary; // Primary actions
text - primary; // Primary text
```

### Custom Neo-Brutalist Utilities

```tsx
// Neo-brutalist borders with box shadows
neo-border           // Bold 3px border with 6px shadow
neo-border-sm        // Bold 2px border with 4px shadow

// Example usage
<Card className="neo-border border-primary">
  Bold brutalist card
</Card>
```

### Status Colors

```tsx
// Success states
<Badge className="bg-success text-success-foreground">Success</Badge>

// Error states
<Badge className="bg-destructive text-destructive-foreground">Error</Badge>

// Warning states
<Badge className="bg-warning text-warning-foreground">Warning</Badge>

// Info states
<Badge className="bg-info text-info-foreground">Info</Badge>
```

## Component Usage

### shadcn/ui Components (Primary)

Use shadcn/ui as the primary component library:

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
```

**Available Components:**

**Layout & Structure:**

- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `CardAction`
- `Separator`, `Scroll-area`, `Aspect-ratio`
- `Accordion`, `Tabs`, `Collapsible`

**Forms & Inputs:**

- `Button`, `ButtonGroup` - Group related actions
- `Input`, `InputGroup` - Composable inputs with icons/addons
- `Textarea`, `Checkbox`, `Radio-group`, `Switch`
- `Select`, `Combobox`
- `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
- `Field` (Base UI) - Modern form field alternative

**Feedback & Overlays:**

- `Dialog`, `Alert-dialog`, `Sheet`, `Drawer`
- `Toast` (via Sonner with custom wrapper)
- `Alert`, `AlertDescription`
- `Tooltip`, `Hover-card`, `Popover`
- `Progress`, `Spinner` - Loading indicators
- `Empty` - Standardized empty states

**Navigation:**

- `Dropdown-menu`, `Context-menu`, `Menubar`
- `Navigation-menu`, `Breadcrumb`
- `Pagination`, `Command` (⌘K menu)
- `Sidebar` - Application sidebar

**Data Display:**

- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`
- `Badge`, `Avatar`, `Skeleton`
- `Kbd` - Keyboard shortcuts display

### Base UI Components (Radix Alternative)

Base UI is available as an alternative to Radix UI primitives:

```tsx
// Both are valid, prefer shadcn/ui patterns
import { Field } from "@/components/ui/field"; // Base UI
import { FormField } from "@/components/ui/form"; // shadcn with RHF
```

### Component Composition Patterns

#### Card Layouts

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description text</CardDescription>
    <CardAction>
      <Button variant="ghost" size="icon">
        <MoreVerticalIcon />
      </Button>
    </CardAction>
  </CardHeader>
  <CardContent>{/* Main content */}</CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

#### Button Groups

```tsx
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";

// Horizontal group
<ButtonGroup>
  <Button variant="outline">Start</Button>
  <Button variant="outline">Stop</Button>
  <ButtonGroupSeparator />
  <Button variant="outline">Restart</Button>
</ButtonGroup>

// Vertical group
<ButtonGroup orientation="vertical">
  <Button>Option 1</Button>
  <Button>Option 2</Button>
</ButtonGroup>
```

#### Input Groups

```tsx
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

// With icon prefix
<InputGroup>
  <InputGroupAddon align="inline-start">
    <MagnifyingGlassIcon />
  </InputGroupAddon>
  <InputGroupInput placeholder="Search..." />
</InputGroup>

// With button suffix
<InputGroup>
  <InputGroupInput placeholder="Enter URL..." />
  <InputGroupAddon align="inline-end">
    <Button size="sm">Go</Button>
  </InputGroupAddon>
</InputGroup>
```

#### Empty States

```tsx
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia, EmptyContent } from "@/components/ui/empty";

<Empty>
  <EmptyHeader>
    <EmptyMedia variant="icon">
      <DatabaseIcon className="size-12" />
    </EmptyMedia>
    <EmptyTitle>No data available</EmptyTitle>
    <EmptyDescription>Get started by adding your first item</EmptyDescription>
  </EmptyHeader>
  <EmptyContent>
    <Button onClick={handleAdd}>
      <PlusIcon className="mr-2 size-4" />
      Add Item
    </Button>
  </EmptyContent>
</Empty>;
```

#### Keyboard Shortcuts Display

```tsx
import { Kbd, KbdGroup } from "@/components/ui/kbd";

// Single key
<Kbd>⌘</Kbd>

// Key combination
<KbdGroup>
  <Kbd>Ctrl</Kbd>
  <Kbd>K</Kbd>
</KbdGroup>
```

#### Loading States

```tsx
import { Spinner } from "@/components/ui/spinner";

// Inline spinner
<Spinner size="sm" />

// With text
<div className="flex items-center gap-2">
  <Spinner size="sm" />
  <span>Loading...</span>
</div>

// Full page loading
<div className="flex min-h-screen items-center justify-center">
  <Spinner size="lg" />
</div>
```

## Typography

### Font Families

```css
/* Display/Headings - Syne Variable (geometric, bold) */
font-family: "Syne Variable", sans-serif;
--font-display: "Syne Variable", sans-serif;

/* Body text - Outfit Variable (clean, readable) */
font-family: "Outfit Variable", sans-serif;
--font-sans: "Outfit Variable", sans-serif;
```

### Text Styles

```tsx
// Headings - Use .font-display utility
<h1 className="font-display text-4xl sm:text-5xl lg:text-6xl gradient-text">
  Page Title
</h1>
<h2 className="font-display text-3xl font-semibold">Section Title</h2>
<h3 className="font-display text-xl font-medium">Subsection</h3>

// Body text - Default Outfit
<p className="text-base text-foreground">Regular text</p>
<p className="text-sm text-muted-foreground">Secondary text</p>
<p className="text-xs text-muted-foreground">Small text</p>

// Gradient text effect
<h1 className="gradient-text">
  Multi-color gradient heading
</h1>
```

### Custom Typography Utilities

```tsx
// Display font utility (Syne)
.font-display {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.02em;
}

// Gradient text effect
.gradient-text {
  background: linear-gradient(135deg, oklch(...), oklch(...));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

## Spacing & Layout

### Container Patterns

```tsx
// Full-width with max-width
<div className="container mx-auto py-8">

// Full viewport with padding
<div className="min-h-screen p-4 sm:p-6 lg:p-8">

// Centered content
<div className="mx-auto max-w-screen-2xl space-y-8">
```

### Spacing Scale

Use consistent spacing (follows Tailwind scale):

```tsx
gap - 2; // 0.5rem (8px)   - Tight spacing
gap - 4; // 1rem (16px)    - Default spacing
gap - 6; // 1.5rem (24px)  - Medium spacing
gap - 8; // 2rem (32px)    - Large spacing
gap - 12; // 3rem (48px)    - Extra large spacing
```

### Grid Layouts

```tsx
// Responsive grid
<div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>

// Two-column layout
<div className="grid gap-6 md:grid-cols-2">
  <div>Left</div>
  <div>Right</div>
</div>
```

## Icons

### Lucide Icons Convention

Use Lucide React icons (no suffix required):

```tsx
import {
  Search,
  Check,
  X,
  Plus,
  Trash,
  ArrowRight,
  BookOpen,
  Calendar
} from "lucide-react";

// ✅ Correct usage
<Search className="size-4" />
<BookOpen className="h-5 w-5" />

// Icon names are clean, no Icon suffix needed
<ArrowRight className="ml-2 size-4" />
```

### Icon Sizing

```tsx
size-3   // 12px - Extra small
size-4   // 16px - Small (default for inline)
size-5   // 20px - Medium
size-6   // 24px - Large
size-8   // 32px - Extra large
size-12  // 48px - Hero icons

// Or use explicit h- and w- classes
h-4 w-4  // 16px
h-5 w-5  // 20px
h-6 w-6  // 24px
```

### Icon in Buttons

```tsx
// Icon before text
<Button>
  <Plus className="mr-2 size-4" />
  Add Item
</Button>

// Icon after text
<Button>
  Next
  <ArrowRight className="ml-2 size-4" />
</Button>

// Icon only
<Button variant="ghost" size="icon">
  <Trash className="size-4" />
</Button>
```

## Responsive Design

### Breakpoint System

```tsx
// Mobile first approach
<div className="p-4 sm:p-6 md:p-8 lg:p-12">

// Breakpoints:
// sm:  640px
// md:  768px
// lg:  1024px
// xl:  1280px
// 2xl: 1536px
```

### Mobile Optimizations

```tsx
// Touch-friendly spacing (Tailwind CSS 4.1)
<Button className="pointer-coarse:p-4">
  Touch-optimized button
</Button>

// Hide on mobile
<div className="hidden md:block">
  Desktop only
</div>

// Show only on mobile
<div className="block md:hidden">
  Mobile only
</div>
```

## Accessibility

### Semantic HTML

```tsx
// ✅ Good - Semantic elements
<nav>...</nav>
<main>...</main>
<article>...</article>
<section>...</section>

// ❌ Bad - Generic divs everywhere
<div>...</div>
```

### ARIA Labels

```tsx
// Button with icon only
<Button variant="ghost" size="icon" aria-label="Delete item">
  <TrashIcon className="size-4" />
</Button>

// Form inputs
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" aria-describedby="email-description" />
<FormDescription id="email-description">
  We'll never share your email
</FormDescription>
```

### Keyboard Navigation

```tsx
// Ensure focusable elements
<Button>Focusable</Button>

// Custom focus styles
<div
  tabIndex={0}
  className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
>
  Custom focusable element
</div>
```

### Color Contrast

All colors in the design system meet WCAG AA standards:

```tsx
// ✅ Good - Uses theme tokens with proper contrast
<div className="bg-background text-foreground">

// ✅ Good - Status colors have sufficient contrast
<Badge className="bg-destructive text-destructive-foreground">
```

## Animation & Transitions

### Using Framer Motion

```tsx
import { motion } from "framer-motion";

// Page entrance animations
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>
  Content fades in and slides up
</motion.div>

// Staggered animations with delays
<motion.div
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ delay: 0.1, duration: 0.6 }}
>
  Delayed animation
</motion.div>

// Hover animations
<motion.div
  whileHover={{ y: -8, rotate: 1 }}
  className="cursor-pointer"
>
  Lifts and rotates on hover
</motion.div>

// Scroll-triggered animations
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6 }}
>
  Animates when scrolled into view
</motion.div>
```

### Using tw-animate-css

```tsx
// Fade animations
<div className="animate-in fade-in duration-300">
  Fades in
</div>

// Slide animations
<div className="animate-in slide-in-from-bottom-4 duration-300">
  Slides in from bottom
</div>

// Zoom animations
<div className="animate-in zoom-in-95 duration-200">
  Zooms in
</div>
```

### Custom Animation Utilities

```tsx
// Hover lift effect
<Card className="hover-lift">
  Lifts on hover
</Card>

// Staggered delays (use with animations)
<div className="animate-fade-up delay-100">First</div>
<div className="animate-fade-up delay-200">Second</div>
<div className="animate-fade-up delay-300">Third</div>
```

### Component Transitions

```tsx
// Dialog/Modal animations (built-in)
<Dialog>...</Dialog>;

// Toast notifications (built-in with Sonner)
toast.success("Action completed");

// Animated navigation indicators
<motion.div
  layoutId="nav-indicator"
  className="bg-primary/10 absolute inset-0 rounded-lg"
  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
/>;
```

## Shadows & Elevation

### Box Shadows (Ant Design tokens)

```tsx
// Subtle shadow for cards
<Card className="shadow-sm">

// Medium shadow for elevated components
<Card className="shadow">

// Large shadow for modals/dropdowns
<Dialog>...</Dialog> // Uses shadow-lg internally
```

### Neo-Brutalist Borders

Instead of relying heavily on shadows, use neo-brutalist borders:

```tsx
// Bold borders with offset shadows
<Card className="neo-border border-primary">
  Distinctive brutalist styling
</Card>

// Smaller version
<Badge className="neo-border-sm border-accent">
  Compact brutalist badge
</Badge>
```

## Form Patterns

### React Hook Form Integration

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

type FormValues = z.infer<typeof formSchema>;

function MyForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>Your display name</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </Form>
  );
}
```

## Toast Notifications

### Using Custom Toast Wrapper

```tsx
import { toast } from "@/lib/toast";

// Success
toast.success("Changes saved successfully");

// Error
toast.error("Failed to save changes");

// Warning
toast.warning("This action cannot be undone");

// Info
toast.info("New updates available");

// With description
toast.success("User created", {
  description: "An email has been sent to the user",
});
```

## Skeleton Loading States

### Route-Specific Skeletons

Create dedicated skeleton components for each route:

```tsx
// src/routes/app/$applicationId/-skeletons/application-skeleton.tsx
export function ApplicationSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

// Use in route
export const Route = createFileRoute("/app/$applicationId/")({
  pendingComponent: ApplicationSkeleton,
  component: RouteComponent,
});
```

### Skeleton Colors

Skeletons use theme-aware neutral colors that work across all themes:

```tsx
// Automatic theme-aware styling
<Skeleton className="h-10 w-full" />
```

## Common Patterns

### Data Tables

```tsx
<div className="rounded-md border">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {data.map((item) => (
        <TableRow key={item.id}>
          <TableCell className="font-medium">{item.name}</TableCell>
          <TableCell>
            <Badge variant="success">{item.status}</Badge>
          </TableCell>
          <TableCell>
            <Button variant="ghost" size="sm">
              Edit
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

### Search & Filter UI

```tsx
<div className="mb-6 flex items-center justify-between gap-4">
  <InputGroup className="w-full max-w-sm">
    <InputGroupAddon align="inline-start">
      <Search />
    </InputGroupAddon>
    <InputGroupInput placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
  </InputGroup>

  <Button>
    <Plus className="mr-2 size-4" />
    Add New
  </Button>
</div>
```

### Modal Patterns

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogDescription>Make changes to your profile here</DialogDescription>
    </DialogHeader>

    <div className="space-y-4 py-4">{/* Form content */}</div>

    <DialogFooter>
      <ButtonGroup>
        <Button variant="outline" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save Changes</Button>
      </ButtonGroup>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Best Practices

### 1. Use Design Tokens

```tsx
// ✅ Good - Theme-aware
<div className="bg-card text-foreground border-border">

// ❌ Bad - Hardcoded
<div className="bg-white text-black border-gray-300">
```

### 2. Consistent Spacing

```tsx
// ✅ Good - Consistent scale
<div className="space-y-6">
  <section className="space-y-4">

// ❌ Bad - Random values
<div className="space-y-7">
  <section className="space-y-3">
```

### 3. Component Composition

```tsx
// ✅ Good - Compose from primitives
<Card>
  <CardHeader>
    <CardTitle>...</CardTitle>
  </CardHeader>
</Card>

// ❌ Bad - Custom implementation
<div className="rounded-lg border p-4">
  <div className="mb-4 font-bold">...</div>
</div>
```

### 4. Responsive First

```tsx
// ✅ Good - Mobile first
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// ❌ Bad - Desktop only
<div className="grid grid-cols-3">
```

### 5. Accessible by Default

```tsx
// ✅ Good - Semantic HTML + ARIA
<Button aria-label="Close dialog">
  <X />
</Button>

// ❌ Bad - Missing accessibility
<div onClick={handleClose}>
  <X />
</div>
```

### 6. Loading States

```tsx
// ✅ Good - Clear loading state
{
  isLoading ? <Spinner /> : <UserData data={data} />;
}

// ❌ Bad - No loading feedback
<UserData data={data} />;
```

### 7. Error States

```tsx
// ✅ Good - User-friendly error
{
  error && (
    <Alert variant="destructive">
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  );
}
```

### 8. Empty States

```tsx
// ✅ Good - Helpful empty state
{
  items.length === 0 && (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>No items</EmptyTitle>
        <EmptyDescription>Add your first item to get started</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={handleAdd}>Add Item</Button>
      </EmptyContent>
    </Empty>
  );
}

// ❌ Bad - Plain text only
{
  items.length === 0 && <div>No items</div>;
}
```

## Reference Files

For implementation examples, reference these files:

- **Forms**: `src/routes/create-application/-components/new-app-form.tsx`
- **Tables**: `src/routes/app/$applicationId/settings/permissions/clients.tsx`
- **Cards**: `src/routes/app/index.tsx`
- **Modals**: `src/components/modals/*`
- **Empty States**: Search for `<Empty>` component usage
- **Loading**: `src/components/ui/spinner.tsx`
- **Themes**: `src/index.css` (token definitions)
- **Animations**: `src/routes/index.tsx`, `src/routes/activities/index.tsx`
- **Neo-Brutalist**: `src/routes/books/index.tsx`, `src/routes/activities/$id/index.tsx`

## Component Checklist

When creating a new component:

- [ ] Uses shadcn/ui components where possible
- [ ] Works across all three themes (light/dark/dim)
- [ ] Uses design tokens (no hardcoded colors)
- [ ] Follows Lucide Icons convention (no suffix)
- [ ] Includes proper TypeScript types
- [ ] Has responsive design (mobile-first)
- [ ] Includes accessibility attributes (ARIA, semantic HTML)
- [ ] Has loading and error states
- [ ] Uses consistent spacing scale
- [ ] Follows existing component patterns
- [ ] Has empty state handling (if applicable)
- [ ] Uses proper typography (Syne for display, Outfit for body)
- [ ] Includes Framer Motion animations where appropriate
- [ ] Applies Neo-Brutalist utilities (neo-border, gradient-text, hover-lift)
