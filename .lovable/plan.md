# Mee3ad Design & UX Refresh

## Goal
Transform Mee3ad from a single-column calendar into a polished, mobile-first dashboard with a calm Sage & Cream visual identity and smoother interactions.

## What we'll build

### 1. Sage & Cream visual identity
- Update `src/styles.css` to a warm, muted palette: cream backgrounds, sage accents, soft shadows.
- Keep the Arabic RTL layout and Tajawal font.
- Replace hard edges with rounded cards, gentle borders, and subtle depth.

### 2. Dashboard layout
- Add a collapsible sidebar on the left (desktop) showing:
  - Upcoming events list (next 7 days)
  - Quick "add event" shortcut
  - Mini monthly summary / today highlight
- Main area keeps the monthly calendar, now wider and more spacious.
- On mobile the sidebar becomes a bottom-sheet or drawer triggered from the header.

### 3. Mobile-first UX
- Swipe left/right on the calendar to change months.
- Larger touch targets for day cells (min 44×44 mm hit area).
- Event modal becomes a bottom sheet on small screens, centered modal on desktop.
- Sticky "Today" and month header while scrolling on mobile.

### 4. Micro-animations
- Fade/scale enter animation for the event modal/bottom sheet.
- Smooth month transition when navigating between months.
- Subtle hover/focus states on day cells and buttons.

### 5. Empty states & polish
- Friendly empty-day message inside the modal.
- Better event chips with color-coded dots and truncation.
- Consistent spacing and responsive typography.

## Technical details
- `src/styles.css`: new OKLCH color tokens for Sage & Cream.
- `src/routes/index.tsx`: refactor into dashboard layout, add sidebar state, swipe handlers, bottom sheet behavior.
- `src/components/ui/sidebar.tsx` (or new local sidebar): shadcn sidebar adapted for the dashboard.
- Add `framer-motion` or use Tailwind animations for transitions (decide during build based on bundle size).
- Keep LocalStorage persistence and Web Notifications unchanged.

## Out of scope
- Backend sync or user accounts.
- Recurring events.
- Import/export.

## Success criteria
- App looks and feels cohesive in Sage & Cream on desktop and mobile.
- Calendar is usable one-handed on a phone (swipe, large targets, bottom sheet).
- No regressions in adding, deleting, or notifying events.