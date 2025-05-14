App Flow Document

User Flows
	1.	Landing (Home)
	•	Presents brief overview, main CTA to calculator(s) or reference pages
	2.	Calculator Flow
	•	User chooses a specific calculator (e.g., Beam Deflection)
	•	Inputs required parameters (length, load, material, etc.)
	•	Submits to see immediate results
	•	Option to see reference details, disclaimers, or more advanced inputs
	3.	Reference Flow
	•	User navigates to a materials or formulas page
	•	Filters/searches data tables (e.g., by density, Young’s modulus)
	•	Views properties or formulas in a structured layout
	•	Links to external references or disclaimers where necessary
	4.	Authentication (Future)
	•	User logs in or registers (optional feature)
	•	Saves or retrieves personalized data (e.g., favorite materials, saved calculations)
	5.	Dashboard (Future)
	•	Displays quick links to calculators, saved data, recent searches
	•	Provides user-specific settings, if applicable

High-Level Page Structure
	1.	Home / Landing Page
	2.	Calculators
	•	Individual pages or routes for each calculator
	•	Common input/validation patterns
	3.	References
	•	Materials index with filters
	•	Formulas index with categorized listings
	4.	Auth Pages (Future)
	•	Login, Register, Profile
	5.	Dashboard (Future)

Back-End Flow
	1.	API Requests
	•	Client sends data for calculation or data retrieval
	•	Server (Next.js API) processes or queries database
	2.	Data Handling
	•	Database read/write for materials, formulas, user profiles
	3.	Response
	•	Sends JSON with results, which the client displays or processes

Error Handling
	•	Graceful fallback for invalid inputs or missing data
	•	Standardized JSON error responses

Navigation
	•	Global header for major sections (Home, Calculators, References, etc.)
	•	Consistent footer with disclaimers and legal info
	•	Responsive design for mobile/desktop access