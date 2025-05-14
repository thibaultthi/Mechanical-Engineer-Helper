Frontend Guidelines

Framework & Language
	•	Next.js for server-side rendering and page routing
	•	React (functional components)
	•	TypeScript (if applicable)

Project Structure
	•	pages/ for each route (e.g., /calculators/beam-deflection, /materials)
	•	components/ for shared UI elements (e.g., form inputs, result displays)
	•	lib/ or utils/ for helper functions (e.g., math logic, formatting)
	•	styles/ for global and base CSS files (if not using Tailwind exclusively)

Styling
	•	Tailwind CSS (preferred)
	•	Use utility classes for layout, spacing, typography
	•	Minimize custom CSS; create small utility classes if needed
	•	Maintain consistent design across pages (colors, typography, spacing)

Component Guidelines
	•	Functional Components Only
	•	Use React hooks for state, side effects
	•	Props & State
	•	Keep components small and focused
	•	Pass data via props, avoid excessive global state
	•	Naming
	•	CalculatorForm, MaterialCard, etc.
	•	Use PascalCase for component filenames and exports

Forms & Validation
	•	Inline Validation
	•	Basic checks (required fields, numeric ranges) for calculator inputs
	•	Show error states and messages clearly
	•	Submit Behavior
	•	Trigger calculations client-side or via API calls (Next.js API routes)

Performance
	•	Code Splitting
	•	Leverage Next.js dynamic imports if any large third-party libraries
	•	Memoization
	•	Use React.memo or hooks (e.g., useMemo, useCallback) for expensive calculations

Accessibility
	•	Ensure proper labels for inputs, especially for calculators
	•	Use semantic HTML elements (e.g., <form>, <label>)
	•	Provide alt text for images and icons

Testing
	•	Unit Tests (Jest + React Testing Library) for critical components (calculations, forms)
	•	Integration/End-to-End (e.g., Cypress) for key user flows (calculator usage, reference pages)

Version Control & Code Reviews
	•	Keep feature branches short-lived
	•	Run lint checks (ESLint) and format code (Prettier) before merging
	•	Use pull requests for collaboration and feedback

Deployment
	•	Vercel for automatic builds and previews
	•	Maintain stable production branch for quick rollbacks if needed

Updates & Scalability
	•	Add new calculators or reference sections as separate pages in pages/calculators or pages/references
	•	Keep design consistent by reusing existing components and Tailwind utility classes