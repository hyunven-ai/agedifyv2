# Agedify Design Guidelines

## Brand Identity

### Color Palette
- **Primary Accent**: Violet (#8B5CF6) - Used for CTAs, highlights, and interactive elements
- **Secondary Accent**: Cyan (#06B6D4) - Used for gradients and secondary highlights
- **Dark Background**: #030712 (Very dark blue-gray)
- **Card Background (Dark)**: #0F172A
- **Text (Dark Mode)**: #E2E8F0 (Light gray)
- **Muted Text**: #94A3B8

### Typography
- **Headings**: Outfit (Geometric Sans-Serif)
  - H1: 4.5rem (72px) / Bold
  - H2: 3rem (48px) / Bold
  - H3: 1.5rem (24px) / Bold
- **Body**: DM Sans (Humanist Sans-Serif)
  - Base: 1rem (16px) / Regular
  - Large: 1.125rem (18px) / Regular
- **Code**: JetBrains Mono

## Design Principles

### 1. Glassmorphism Navigation
- Frosted glass effect with backdrop blur
- Semi-transparent background with subtle border
- Rounded pill-shaped CTA buttons

### 2. Gradient Buttons
```css
.btn-gradient {
  background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #8B5CF6 100%);
  background-size: 200% auto;
}
```

### 3. Card Glow Effect
- Subtle gradient border on hover
- Transform translateY(-4px) on hover
- Box shadow with accent color glow

### 4. Animated Background Elements
- Floating gradient orbs with blur
- Animated gradient text with color shifting
- Pulse animations for status indicators

### 5. Badge Design
- Uppercase text with letter-spacing
- Rounded full pills with accent backgrounds
- Status dot indicator with ping animation

## Component Patterns

### Cards
- Border radius: 1.5rem (24px)
- Padding: 2rem (32px)
- Border: 1px solid border/50
- Hover: card-glow class

### Tables
- Rounded container: 1.5rem
- Row hover: bg-accent/5
- Metric badges: Colored rounded squares

### Buttons
- Primary: btn-gradient class
- Secondary: Outline with hover fill
- Rounded full (pill shape)

## Spacing System
- Section padding: py-24 md:py-32
- Card padding: p-8
- Grid gap: gap-6 to gap-8
- Content max-width: max-w-7xl

## Animations
- fadeInUp: Entry animation for content
- float: Subtle floating for background elements
- gradient-shift: Animated gradient text
- pulse-glow: Status indicators
