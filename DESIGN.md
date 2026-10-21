# Vibecoding Project Tracker — Design

**Status:** Hackathon starter design doc · fill in the **`<TODO>`** sections before you tag `design-done`.

**Why this file exists.** This tracker is your tool. It should look like *your* tool — not a generic Kanban with default Tailwind blue. Twenty minutes of design decisions here will be visible on every screen for the next six weeks of Module 5.

**Who owns this.** Person B, during the same window the rest of the team is reviewing the PRD. By the time the team converges to start M4 (`data-model`), this file should be filled in and the colors should already be in `tailwind.config.js`.

----

## 1. Mood / vibe

One sentence that captures the feeling the tracker should leave you with.

`Premium and simple.`


Two or three references that capture the vibe (links to dribbble shots, screenshots of apps you admire, Pinterest boards — anything visual):

- `https://www.morgen.so/blog-posts/linear-project-management`
- `https://cdn.dribbble.com/userupload/49330365/file/a740aa456d1f367e2d51f397ae379355.png?resize=1600x1200&vertical=center`
- `https://cdn.dribbble.com/userupload/17099807/file/original-55ee1e409dcfbd4b59f7ebb1cd7f507a.png?resize=752x&vertical=center`

Anti-references — what we are explicitly **not** trying to look like:

- `https://imgs.search.brave.com/g1D9v_EiLHfQxV2tdADGYdR_OkjOMMPwdHqWlPO79G0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9raWpv/LmNvLnVrL3dwLWNv/bnRlbnQvdXBsb2Fk/cy8yMDI0LzA5L1Nj/cmVlbnNob3QtMjAy/NC0wOS0yMy1hdC0x/Ny4xOS41My0xMDI0/eDUyNi5wbmc`

## 2. Color palette

These are the colors the build milestones will reference. Once chosen, paste the hex values into `tailwind.config.js` so the rest of the team can use Tailwind utility classes (e.g. `bg-brand-primary`, `border-due-warning`).

### Brand

| Token | Hex | Where it shows up |
|---|---|---|
| `brand-primary` | `B57EDC` | Header, "+" button, focus rings |
| `brand-accent` | `3D3D3D` | Highlights, hover states, links |
| `surface-page` | `FFFFFF` | Page background |
| `surface-card` | `FFFFFF` | Card background |
| `text-primary` | `0A0A0A` | Body text |
| `text-muted` | `C2C2C2` | Captions, dates, counts |

### Task type (M6 `tag-style`)

| Token | Hex | When used |
|---|---|---|
| `type-feature` | `00BF33` | Cards tagged `feature` (accent stripe + icon) |
| `type-bug` | `C41818` | Cards tagged `bug` (accent stripe + icon) |

### Due-date states (M8 `due-tint`)

| Token | Hex | When used |
|---|---|---|
| `due-safe` | `00BF33` | More than 2 days out |
| `due-warning` | `FFD900` | Less than 24 hours |
| `due-overdue` | `CF8600` | Past due |
| `due-neutral` | `C2C2C2` | Done (overrides date) |

## 3. Typography

| Role | Font | Why |
|---|---|---|
| Heading | `<16 pt>` | `<Following Government recommendations: https://www.communications.gov.uk/publication/accessibility-standards/>` |
| Body | `<14 pt>` | `<Following Government recommended font: https://www.communications.gov.uk/publication/accessibility-standards/>` |
| Monospace (tags, badges, code) | `12 pt` | `Minimum legal limit by Government: https://www.communications.gov.uk/publication/accessibility-standards/` |

Suggested sizes (override only if the design demands it):

- Page title: 24 px / semibold
- Section header: 16 px / semibold uppercase
- Card title: 14 px / medium
- Body: 14 px / regular
- Caption: 12 px / regular muted

## 4. Component principles

One short sentence per element. These set the tone for the build phase — Person A's modal and Person B's anchor board should both feel like they came from this doc.

- **Cards:** `Light, almost weightless; the only weight is from a 1px border, no shadow except on hover.` (e.g. "Light, almost weightless; the only weight is from a 1px border, no shadow except on hover.")
- **Buttons:** `Solid fill, no gradient, 1px border, no shadow, change colour on hover` (e.g. "Solid fill, no gradient, generous padding, rounded-md.")
- **Modal:** `Centered, max-width-md, slate-900 backdrop at 50% opacity` (e.g. "Centered, max-width-md, slate-900 backdrop at 50% opacity.")
- **Empty states:** `no border, transparent background` (e.g. "Dashed border, muted text, never sad.")
- **Drag affordance (if used):** `allow the user to drag their issues to different parts of the board and see it hovering as they drag it over` (e.g. "None — we use a status dropdown.")

## 5. Voice / microcopy

Three lines of microcopy that capture the tone of the product. Keep it short — these are the words a stressed user reads at 11pm.

| Where | Text |
|---|---|
| "+" button label | `Add Issue` (e.g. "+ Task" or "Add task" or "New") |
| Empty column placeholder | `Nothing here yet — keep going.` (e.g. "Nothing here yet — keep going.") |
| Toast after "Copy as Prompt Context" | `Copied!` (e.g. "Copied. Now paste it into the AI.") |
| Confirm-delete message | `Delete this task? You can't undo.` (e.g. "Delete this task? You can't undo.") |
| Handoff toast (M7 `task-owner`) | `Handed off to {name}. They've got it.` (e.g. "Handed off to {name}. They've got it.") |

## 6. Logo / wordmark

The tracker probably doesn't need a logo, but it does need a name and a wordmark style.

- **Product name:** `Lucid Board` (match PRD §11 team identity)
- **Wordmark style:** `Just the name in the heading font, brand-primary color, no icon.` (e.g. "Just the name in the heading font, brand-primary color, no icon.")

## 7. Out of scope (this hackathon)

To keep design tight, the following are explicitly not part of `design-done`:

- A dark mode toggle. Pick one mode and ship it.
- Multiple themes. One brand, applied consistently.
- Animations beyond a 200 ms fade on toast notifications.
- A custom icon set. Use [Lucide icons](https://lucide.dev) via Tailwind classes if you need any.

---

*DESIGN.md version: hackathon-starter v1*
