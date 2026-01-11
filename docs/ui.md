# UI Coding Standards

## Core Principle: shadcn/ui Components ONLY

**This project uses EXCLUSIVELY shadcn/ui components for all UI elements.**

### Rule

❌ **DO NOT create custom UI components**
✅ **ONLY use shadcn/ui components**

All user interface components must come from the shadcn/ui library. Custom components are strictly prohibited.

## Why This Standard?

1. **Consistency**: Ensures uniform design across the entire application
2. **Accessibility**: shadcn/ui components are built with accessibility in mind
3. **Maintainability**: Reduces technical debt and maintenance burden
4. **Dark Mode**: All components support dark mode out of the box
5. **Best Practices**: Components follow React and TypeScript best practices
6. **Battle-Tested**: Components are well-tested and production-ready

## Installing shadcn/ui Components

When you need a UI component, install it from shadcn/ui:

```bash
npx shadcn@latest add [component-name]
```

### Examples

```bash
# Install individual components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog

# Install multiple components at once
npx shadcn@latest add button card dialog input
```

Components are installed to `components/ui/` directory.

## Available shadcn/ui Components

### Currently Installed

- `button` - Buttons and interactive triggers
- `card` - Container components with header/content/footer
- `calendar` - Date selection component
- `popover` - Floating content container
- `collapsible` - Expandable/collapsible sections
- `badge` - Small status indicators
- `skeleton` - Loading state placeholders

### Common Components to Add

```bash
# Forms
npx shadcn@latest add input
npx shadcn@latest add textarea
npx shadcn@latest add select
npx shadcn@latest add checkbox
npx shadcn@latest add radio-group
npx shadcn@latest add switch
npx shadcn@latest add label
npx shadcn@latest add form

# Layout
npx shadcn@latest add separator
npx shadcn@latest add tabs
npx shadcn@latest add accordion
npx shadcn@latest add sheet

# Feedback
npx shadcn@latest add alert
npx shadcn@latest add toast
npx shadcn@latest add dialog
npx shadcn@latest add alert-dialog
npx shadcn@latest add progress

# Data Display
npx shadcn@latest add table
npx shadcn@latest add dropdown-menu
npx shadcn@latest add tooltip
npx shadcn@latest add avatar
```

Full list: https://ui.shadcn.com/docs/components

## Component Usage Guidelines

### ✅ CORRECT: Use shadcn/ui Components

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function MyFeature() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Title</CardTitle>
      </CardHeader>
      <CardContent>
        <Input placeholder="Enter value..." />
        <Button>Submit</Button>
      </CardContent>
    </Card>
  );
}
```

### ❌ INCORRECT: Custom UI Components

```tsx
// ❌ DO NOT DO THIS - Custom button component
export function CustomButton({ children, ...props }) {
  return (
    <button className="px-4 py-2 bg-blue-500 rounded" {...props}>
      {children}
    </button>
  );
}

// ❌ DO NOT DO THIS - Custom card component
export function CustomCard({ title, children }) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-bold">{title}</h3>
      <div>{children}</div>
    </div>
  );
}
```

## Composition is Allowed

You can compose domain-specific components that USE shadcn/ui components internally:

### ✅ CORRECT: Domain Components Using shadcn/ui

```tsx
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// This is a domain component (workout card)
// It USES shadcn/ui components internally
export function WorkoutCard({ workout }) {
  return (
    <Card>
      <CardContent>
        <h3>{workout.name}</h3>
        <Badge>{workout.exerciseCount} exercises</Badge>
        <Button>View Details</Button>
      </CardContent>
    </Card>
  );
}
```

**Key Distinction**: `WorkoutCard` is NOT a UI component. It's a domain component that composes existing shadcn/ui components.

## Styling Guidelines

### Use Tailwind CSS Classes

Style components using Tailwind CSS utility classes:

```tsx
<Button className="w-full mt-4">
  Full Width Button
</Button>

<Card className="max-w-md mx-auto">
  <CardContent className="space-y-4">
    {/* Content */}
  </CardContent>
</Card>
```

### Use Component Variants

shadcn/ui components come with built-in variants:

```tsx
// Button variants
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Button sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon Only</Button>

// Badge variants
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>
```

### Use the cn() Utility

Use the `cn()` utility from `lib/utils.ts` for conditional classes:

```tsx
import { cn } from '@/lib/utils';

<Button className={cn(
  "w-full",
  isPending && "opacity-50 cursor-not-allowed"
)}>
  Submit
</Button>
```

## Icons

Use **Lucide React** for all icons (included with shadcn/ui):

```tsx
import { Calendar, Dumbbell, ChevronDown, Plus } from 'lucide-react';

<Button>
  <Plus className="h-4 w-4 mr-2" />
  Add Workout
</Button>

<Calendar className="h-5 w-5 text-muted-foreground" />
```

Browse icons: https://lucide.dev/icons

## Date Formatting

Use **date-fns** for all date formatting throughout the project.

### Installation

date-fns is already installed in this project:

```bash
npm install date-fns
```

### Standard Date Format

All dates displayed to users must follow this format:

**Format**: `do MMM yyyy`

**Examples**:
- 1st Sep 2025
- 2nd Aug 2025
- 3rd Jan 2026
- 4th Mar 2026

### Usage

```tsx
import { format } from 'date-fns';

// Format a date for display
const date = new Date('2025-09-01');
const formattedDate = format(date, 'do MMM yyyy');
// Result: "1st Sep 2025"

// In a component
export function WorkoutCard({ workout }) {
  const workoutDate = new Date(workout.date);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{format(workoutDate, 'do MMM yyyy')}</CardTitle>
      </CardHeader>
    </Card>
  );
}
```

### Important Notes

- **Always use `'do MMM yyyy'`** as the format string
- `do` - Day of month with ordinal (1st, 2nd, 3rd, 4th, etc.)
- `MMM` - Abbreviated month name (Jan, Feb, Mar, etc.)
- `yyyy` - Full year (2025, 2026, etc.)

### ❌ Don't Use

```tsx
// ❌ Wrong format
format(date, 'DD/MM/YYYY')  // 01/09/2025
format(date, 'MM-DD-YYYY')  // 09-01-2025
format(date, 'YYYY-MM-DD')  // 2025-09-01

// ❌ Don't use toLocaleDateString()
date.toLocaleDateString()   // Inconsistent across locales

// ❌ Don't use Date methods
date.toDateString()         // Inconsistent format
```

### ✅ Always Use

```tsx
// ✅ Correct - Standard format
import { format } from 'date-fns';

format(date, 'do MMM yyyy')  // 1st Sep 2025
```

### Additional date-fns Utilities

You can use other date-fns functions for date manipulation:

```tsx
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  isSameDay,
  parseISO
} from 'date-fns';

// Parse ISO date string from database
const date = parseISO('2025-09-01');

// Add/subtract days
const tomorrow = addDays(new Date(), 1);
const yesterday = subDays(new Date(), 1);

// Compare dates
const isToday = isSameDay(date, new Date());

// Always format for display
const displayDate = format(date, 'do MMM yyyy');
```

date-fns documentation: https://date-fns.org/docs

## Dark Mode

All shadcn/ui components support dark mode automatically. Use semantic color classes:

```tsx
// ✅ Semantic colors (work in both light and dark mode)
<div className="bg-background text-foreground">
  <p className="text-muted-foreground">Secondary text</p>
  <div className="border border-border">Content</div>
</div>

// ❌ Hard-coded colors (breaks dark mode)
<div className="bg-white text-black">
  <p className="text-gray-500">Secondary text</p>
</div>
```

## Form Handling

For forms, use shadcn/ui form components with React Hook Form:

```bash
npx shadcn@latest add form
```

```tsx
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function WorkoutForm() {
  const form = useForm();

  return (
    <Form {...form}>
      <FormField
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Workout Name</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
          </FormItem>
        )}
      />
      <Button type="submit">Save</Button>
    </Form>
  );
}
```

## Exception: Page-Level Components

The ONLY exceptions to this rule are page-level and feature-level components that:

1. **Orchestrate business logic** (e.g., `DashboardClient`, `WorkoutCard`)
2. **Compose multiple shadcn/ui components** into features
3. **Handle data fetching and state management**

These are NOT UI components - they are domain components that USE shadcn/ui components.

### Examples of Allowed Domain Components

- `app/dashboard/_components/workout-card.tsx` - Domain component for workouts
- `app/dashboard/_components/dashboard-client.tsx` - Client orchestration
- `app/dashboard/_components/empty-state.tsx` - Composes Card + Icon

All of these components ONLY use shadcn/ui components internally.

## What if I Need Something Custom?

**First, check if shadcn/ui has it**: https://ui.shadcn.com/docs/components

If you think you need a custom UI component:

1. ❌ **DO NOT create it**
2. ✅ **Find the equivalent shadcn/ui component**
3. ✅ **Use Tailwind classes to customize appearance**
4. ✅ **Compose existing shadcn/ui components**

If you absolutely cannot find a shadcn/ui component that fits:

1. **Check if shadcn/ui has it in their registry**
2. **Ask before implementing** - there's likely a shadcn/ui solution
3. **Consider if it's actually a domain component** (which should use shadcn/ui internally)

## Project Structure

```
components/
└── ui/                    # shadcn/ui components ONLY (auto-generated)
    ├── button.tsx
    ├── card.tsx
    ├── input.tsx
    └── ...

app/
├── dashboard/
│   └── _components/       # Domain components (use shadcn/ui internally)
│       ├── workout-card.tsx
│       └── dashboard-client.tsx
└── ...

lib/
├── utils.ts              # Utility functions (cn helper)
└── ...
```

## Summary

### The One Rule

**Use ONLY shadcn/ui components for all UI elements. No custom UI components allowed.**

### Quick Reference

✅ **DO**:
- Install shadcn/ui components: `npx shadcn@latest add [component]`
- Use component variants: `variant="outline"`
- Style with Tailwind: `className="mt-4 w-full"`
- Use Lucide icons: `import { Icon } from 'lucide-react'`
- Use semantic colors: `bg-background`, `text-foreground`
- Format dates with date-fns: `format(date, 'do MMM yyyy')`
- Create domain components that compose shadcn/ui components

❌ **DON'T**:
- Create custom button/card/input components
- Use hard-coded colors that break dark mode
- Use date formats other than `'do MMM yyyy'`
- Use `toLocaleDateString()` or `toDateString()` for dates
- Reinvent components that exist in shadcn/ui
- Create UI component libraries

## Resources

- **shadcn/ui Documentation**: https://ui.shadcn.com
- **Component Catalog**: https://ui.shadcn.com/docs/components
- **Lucide Icons**: https://lucide.dev/icons
- **date-fns**: https://date-fns.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
