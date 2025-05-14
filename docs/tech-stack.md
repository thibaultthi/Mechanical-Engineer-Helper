Tech Stack Document

Overview
	•	Full-stack web application for Mechanical Engineering references and calculators
	•	Focus on maintainability, scalability, performance, and SEO

Front-End
	•	Next.js (React)
	•	Tailwind CSS (or Chakra UI)
	•	TypeScript (optional)
	•	Possible libraries: Formik or React Hook Form

Back-End
	•	Next.js API Routes
	•	Node.js + Express (future microservices, if needed)
	•	ORM: Prisma, Sequelize, or TypeORM

Database
	•	PostgreSQL for structured data
	•	Potential table structure:
	•	materials (id, name, density, E, yield_strength, etc.)
	•	calculators (metadata for each tool)
	•	users (optional, if authentication is implemented)
	•	disclaimers/references

Hosting & Deployment
	•	Vercel for Next.js
	•	Managed PostgreSQL on Supabase, Railway, Render, or AWS RDS
	•	Docker (optional) for containerization and alternative hosting

Future Extensions
	•	Search & Filter with ElasticSearch (if data grows large)
	•	Authentication using NextAuth or JWT
	•	Analytics & Monitoring (e.g., Google Analytics, Sentry, or similar)