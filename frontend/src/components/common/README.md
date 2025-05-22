# PDF Tools Navigation Component

## Overview
This component provides a responsive navigation system for PDF tools and AI features. It displays a hamburger menu on smaller screens and a sidebar navigation on larger screens.

## Features
- Responsive design with hamburger menu for mobile devices
- Smooth animations for opening/closing the menu
- Proper accessibility with ARIA attributes
- Keyboard navigation support
- Highlights the active tool/category
- Consistent styling with the application theme

## Implementation Details
- Uses Framer Motion for animations
- Implements click-outside detection to close the menu
- Handles keyboard navigation (Escape key to close)
- Automatically closes when route changes
- Supports both PDF tools and AI features navigation

## Usage
```tsx
// Basic usage
<PdfToolsNavigation />

// With additional className
<PdfToolsNavigation className="sticky top-20" />
```

## Component Structure
- `PdfToolsNavigation.tsx`: Main component that handles the responsive navigation
- `AiFeatureLayout.tsx`: Layout component for AI feature pages that includes the navigation

## Accessibility Features
- Proper ARIA attributes (`aria-expanded`, `aria-controls`, `aria-label`)
- Keyboard navigation support
- Focus management
- Semantic HTML structure

## Animation Details
- Uses Framer Motion for smooth animations
- Implements staggered animations for menu items
- Provides visual feedback for user interactions

## Last Updated
2025-05-22T23:40:05.821Z (UTC)

## Author
Chirag Singhal (GitHub: `chirag127`)
