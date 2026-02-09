---
agent: "implementation"
model: Claude Sonnet 4.5
description: "Create a new form with validation following project patterns"
tools: ["edit", "read/readFile", "search/codebase"]
---

# Generate Form Component

Create a new form component with React Hook Form and Zod validation following the project's patterns.

## Input Requirements

Ask the user for:

1. **Form name** (e.g., "UserProfileForm", "ApplicationSettingsForm")
2. **Form purpose** (what data does it collect?)
3. **Form fields** with:
   - Field name (camelCase!)
   - Field type (text, email, number, select, checkbox, etc.)
   - Validation rules (required, min/max length, pattern, etc.)
   - Label and placeholder
4. **Submit action** (what happens when form is submitted?)
5. **Is this a modal form?** (yes/no)

## Research Phase

Before creating the form:

1. Review existing form patterns:
   - `src/routes/create-application/-components/new-app-form.tsx`
   - `src/routes/app/$applicationId/-components/update-app-form.tsx`
   - `src/components/modals/new-web-endpoint-modal.tsx`
2. Check available form components in `src/components/ui/form.tsx`
3. Identify if API types already exist for this form data

## Form Structure

### 1. Define Zod Schema

```tsx
import { z } from "zod";

const formSchema = z.object({
  emailAddress: z.string().email("Invalid email address"),
  userName: z.string().min(1, "Name is required"),
  age: z.number().min(18, "Must be 18 or older"),
  // More fields...
});

type FormValues = z.infer<typeof formSchema>;
```

### 2. Create Form Component

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ${FormName}() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emailAddress: "",
      userName: "",
      age: 0,
    },
  });

  const handleSubmit = (values: FormValues) => {
    // Handle form submission
    console.log(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Form fields */}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </Form>
  );
}
```

### 3. Form Fields Pattern

```tsx
<FormField
  control={form.control}
  name="emailAddress"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email Address</FormLabel>
      <FormControl>
        <Input {...field} type="email" placeholder="user@example.com" />
      </FormControl>
      <FormDescription>We'll never share your email.</FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

## Field Types

### Text Input

```tsx
<FormField
  control={form.control}
  name="userName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Name</FormLabel>
      <FormControl>
        <Input {...field} placeholder="John Doe" />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Email Input

```tsx
// Schema
emailAddress: (z.string().email("Invalid email address"),
  (
    // Field
    <Input {...field} type="email" placeholder="user@example.com" />
  ));
```

### Number Input

```tsx
// Schema
age: (z.number().min(18).max(100),
  (
    // Field
    <Input {...field} type="number" onChange={(e) => field.onChange(+e.target.value)} />
  ));
```

### Select

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

<FormField
  control={form.control}
  name="role"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Role</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="user">User</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>;
```

### Checkbox

```tsx
import { Checkbox } from "@/components/ui/checkbox";

<FormField
  control={form.control}
  name="acceptTerms"
  render={({ field }) => (
    <FormItem className="flex items-center gap-2">
      <FormControl>
        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
      </FormControl>
      <FormLabel>Accept terms and conditions</FormLabel>
      <FormMessage />
    </FormItem>
  )}
/>;
```

### Textarea

```tsx
import { Textarea } from "@/components/ui/textarea";

<FormField
  control={form.control}
  name="description"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Description</FormLabel>
      <FormControl>
        <Textarea {...field} placeholder="Enter description..." />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>;
```

## API Integration

### With TanStack Query Mutation

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function ${FormName}() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: FormValues) => apiClient.createUser({ body: data }),
    onSuccess: () => {
      toast.success("User created successfully!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      form.reset();
    },
    onError: (error) => {
      toast.error(`Failed to create user: ${error.message}`);
    },
  });

  const handleSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  // Rest of component...
}
```

## Modal Form Wrapper

If this is a modal form:

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ${FormName}ModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormValues) => void;
}

export function ${FormName}Modal({ isOpen, onOpenChange, onSubmit }: ${FormName}ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Form Title</DialogTitle>
          <DialogDescription>Form description</DialogDescription>
        </DialogHeader>

        <${FormName} onSubmit={(data) => {
          onSubmit(data);
          onOpenChange(false);
        }} />
      </DialogContent>
    </Dialog>
  );
}
```

## Critical Guidelines

### Naming (CRITICAL!)

- Form component: **PascalCase** (e.g., `UserProfileForm`)
- Form fields: **camelCase** (e.g., `emailAddress`, not `email_address`)
- Submit handler: `handleSubmit` (not `handle_submit`)
- **NEVER use snake_case for anything!**

### Validation

- Use Zod for all validation
- Provide clear, user-friendly error messages
- Validate on blur and submit
- Consider async validation for unique values

### User Experience

- Show loading state during submission
- Disable submit button while submitting
- Clear form after successful submission (if appropriate)
- Show success/error toast notifications
- Add helpful descriptions for complex fields

### Accessibility

- Use proper labels for all fields
- Include ARIA descriptions where helpful
- Ensure keyboard navigation works
- Show error messages clearly

## Development Mode Debug Tools

Add debug tools in development:

```tsx
{
  process.env.NODE_ENV === "development" && (
    <>
      <DraggableDebugOverlay
        control={form.control}
        title="Form Debugger"
        mutationState={{
          isPending: mutation.isPending,
          isError: mutation.isError,
          isSuccess: mutation.isSuccess,
        }}
      />
      <DevTool control={form.control} />
    </>
  );
}
```

## Form Checklist

- [ ] Zod schema defined with proper validation
- [ ] FormValues type inferred from schema
- [ ] All field names use camelCase (no snake_case!)
- [ ] Default values set
- [ ] Form fields use FormField component
- [ ] Error messages are clear and helpful
- [ ] Submit button shows loading state
- [ ] Success/error handling implemented
- [ ] Form resets after successful submission
- [ ] Toast notifications for feedback
- [ ] Accessibility labels added
- [ ] Development debug tools included
